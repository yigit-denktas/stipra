"""Mutation-checks real PDF attachments without changing their page content."""
import hashlib
import json
import sys
import tempfile
from pathlib import Path

from PIL import Image
from pypdf import PdfReader, PdfWriter
from pypdf.generic import DecodedStreamObject, NameObject

from analyze import pdf_structure
from contracts import attachment_contract, pdf_contract_stops


def mutate_pdf(source, target, attachment, change):
    """Replaces one embedded JSON stream while retaining page drawing streams."""
    writer = PdfWriter()
    writer.clone_document_from_reader(PdfReader(source))
    names = writer.root_object["/Names"]["/EmbeddedFiles"]["/Names"]
    for index in range(0, len(names), 2):
        if str(names[index]) != attachment:
            continue
        filespec = names[index + 1].get_object()
        value = json.loads(filespec["/EF"]["/F"].get_object().get_data())
        change(value)
        stream = DecodedStreamObject()
        stream.set_data(json.dumps(value).encode())
        filespec["/EF"][NameObject("/F")] = writer._add_object(stream)
        break
    else:
        raise ValueError("Attachment not found: " + attachment)
    with target.open("wb") as output:
        writer.write(output)


def verify(root):
    """Checks the delivered benign differences and hidden recipe mutations."""
    paths = [root / "results" / v / "reports-0/49x33" for v in ("v3", "v4")]
    pdfs = [p / "report/separation-sheet.pdf" for p in paths]
    pairs = []
    for left in paths[0].rglob("*.png"):
        right = paths[1] / left.relative_to(paths[0])
        a, b = Image.open(left).convert("RGBA"), Image.open(right).convert("RGBA")
        if a.size == b.size and a.tobytes() == b.tobytes():
            pairs.append((hashlib.sha256(left.read_bytes()).hexdigest(), hashlib.sha256(right.read_bytes()).hexdigest()))
    structures = [pdf_structure(p) for p in pdfs]
    baseline = attachment_contract(structures[0]["attachments"], structures[1]["attachments"], pairs)
    assert baseline["compatible"] and len(baseline["allowedImageHashChanges"]) == 4
    results = []
    changes = [("ink-recipe", "inks.json", lambda v: v["inks"][0].update(gain=99)),
               ("replay-dpi", "replay.json", lambda v: v.update(dpi=72)),
               ("layout-position", "report-layout.json", lambda v: v["pages"][0]["images"][0].update(x=999)),
               ("unverified-image-hash", "report-layout.json", lambda v: v["pages"][0]["images"][0].update(sha256="0" * 64))]
    with tempfile.TemporaryDirectory(prefix="stipra-attachment-mutations-") as directory:
        for name, attachment, change in changes:
            target = Path(directory) / (name + ".pdf")
            mutate_pdf(pdfs[1], target, attachment, change)
            altered = pdf_structure(target)
            assert altered["pages"] == structures[1]["pages"], "Mutation changed visible page structure"
            before, after = PdfReader(pdfs[1]), PdfReader(target)
            page_streams_equal = [p.get_contents().get_data() for p in before.pages] == [p.get_contents().get_data() for p in after.pages]
            assert page_streams_equal
            contract = attachment_contract(structures[0]["attachments"], altered["attachments"], pairs)
            stops = pdf_contract_stops({"attachmentContract": contract})
            assert stops, "Attachment-only tampering escaped the gate"
            results.append({"mutation": name, "pageDrawingStreamsUnchanged": page_streams_equal, "pageStructureUnchanged": True,
                            "blocked": True, "unexpectedChanges": contract["unexpectedChanges"]})
    return {"contract": "stipra-attachment-mutation-verification-v1", "baselineCompatible": True,
            "baselineAllowedImageHashChanges": len(baseline["allowedImageHashChanges"]), "mutations": results}


if __name__ == "__main__":
    print(json.dumps(verify(Path(sys.argv[1]).resolve()), indent=2))
