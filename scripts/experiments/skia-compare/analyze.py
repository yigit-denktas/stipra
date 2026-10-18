"""Compares frozen backend results without changing acceptance goldens."""
import hashlib
import fcntl
import json
import statistics
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image
from pypdf import PdfReader
import zxingcpp


def digest(data):
    """Returns the SHA-256 of canonical bytes."""
    return hashlib.sha256(data).hexdigest()


def pixel_diff(left, right, width, height):
    """Measures exact RGBA differences and their pixel bounds."""
    a = np.frombuffer(left, dtype=np.uint8).reshape(height, width, 4)
    b = np.frombuffer(right, dtype=np.uint8).reshape(height, width, 4)
    delta = np.abs(a.astype(np.int16) - b.astype(np.int16))
    changed = np.any(delta, axis=2)
    ys, xs = np.where(changed)
    return {
        "equal": not bool(changed.any()),
        "changedPixels": int(changed.sum()),
        "maxChannelDelta": int(delta.max()),
        "meanChannelDelta": float(delta.mean()),
        "alphaChangedPixels": int((delta[:, :, 3] != 0).sum()),
        "bbox": [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)] if len(xs) else None,
    }


def png_density(data):
    """Reads physical density chunks without trusting the backend decoder."""
    chunks = []
    at = 8
    while at < len(data):
        size = int.from_bytes(data[at:at + 4], "big")
        if data[at + 4:at + 8] == b"pHYs":
            chunks.append([int.from_bytes(data[at + 8:at + 12], "big"), int.from_bytes(data[at + 12:at + 16], "big"), data[at + 16]])
        at += size + 12
    return chunks


def qr_decode(image, expected):
    """Checks color and grayscale QR decoding against the public guide URL."""
    results = []
    for mode in ("RGB", "L"):
        code = zxingcpp.read_barcode(image.convert(mode))
        results.append({"mode": mode, "passed": bool(code and code.text == expected), "decoded": code.text if code else None})
    return results


def reference_checks(root):
    """Checks profile conversion and orientation against independent expectations."""
    fixture = json.loads((root / "snapshot/tests/fixtures/color-reference.json").read_text())
    checks = []
    transpose = {1: None, 2: Image.Transpose.FLIP_LEFT_RIGHT, 3: Image.Transpose.ROTATE_180, 4: Image.Transpose.FLIP_TOP_BOTTOM,
                 5: Image.Transpose.TRANSPOSE, 6: Image.Transpose.ROTATE_270, 7: Image.Transpose.TRANSVERSE, 8: Image.Transpose.ROTATE_90}
    for version in ("v3", "v4"):
        rows = json.loads((root / "results" / version / "decode-0/records.json").read_text())["records"]
        cases = {r["id"]: r for r in rows}
        for name, reference in (("linear", "reference"), ("linear-jpeg", "jpeg-reference")):
            a = cases["color-reference-" + name + (".jpg" if "jpeg" in name else ".png")]
            b = cases["color-reference-" + reference + (".jpg" if "jpeg" in reference else ".png")]
            raw_a = np.frombuffer((root / a["rgbaPath"]).read_bytes(), dtype=np.uint8).reshape(a["height"], a["width"], 4)
            raw_b = np.frombuffer((root / b["rgbaPath"]).read_bytes(), dtype=np.uint8).reshape(b["height"], b["width"], 4)
            deltas = [int(np.abs(raw_a[y, x, :3].astype(np.int16) - raw_b[y, x, :3].astype(np.int16)).max()) for x, y in fixture["sampleCoordinates"]]
            checks.append({"version": version, "id": name + "-LittleCMS-reference", "maxSampleDelta": max(deltas), "tolerance": fixture["tolerance8bit"], "passed": max(deltas) <= fixture["tolerance8bit"]})
        base = cases["exif-1.jpg"]
        image = Image.frombytes("RGBA", (base["width"], base["height"]), (root / base["rgbaPath"]).read_bytes())
        for orientation in range(1, 9):
            actual = cases[f"exif-{orientation}.jpg"]
            expected = image if orientation == 1 else image.transpose(transpose[orientation])
            checks.append({"version": version, "id": f"exif-{orientation}-orientation-once", "passed": expected.size == (actual["width"], actual["height"]) and expected.tobytes() == (root / actual["rgbaPath"]).read_bytes()})
    return checks


def pdf_structure(file):
    """Extracts page geometry, text, fonts and embedded recipe contents."""
    document = PdfReader(file)
    pages = []
    for page in document.pages:
        spans, fonts, links = [], [], []

        def visit(text, matrix, text_matrix, font, size):
            """Retains text placement and actual embedded face identity."""
            if text.strip():
                spans.append({"text": text, "matrix": matrix, "textMatrix": text_matrix, "font": str(font.get("/BaseFont")) if font else None, "size": size})

        page.extract_text(visitor_text=visit)
        for ref in page["/Resources"].get("/Font", {}).values():
            font = ref.get_object()
            face = font["/DescendantFonts"][0].get_object() if font.get("/DescendantFonts") else font
            descriptor = face["/FontDescriptor"].get_object() if face.get("/FontDescriptor") else None
            stream = next((descriptor[k].get_object().get_data() for k in ("/FontFile", "/FontFile2", "/FontFile3") if k in descriptor), None) if descriptor else None
            fonts.append({"name": str(font.get("/BaseFont")), "subtype": str(font.get("/Subtype")), "embeddedSha256": digest(stream) if stream else None})
        for ref in page.get("/Annots", []):
            annotation = ref.get_object()
            links.append({"rect": list(annotation.get("/Rect", [])), "uri": str(annotation.get("/A", {}).get("/URI", ""))})
        pages.append({"size": [float(v) for v in page.mediabox], "spans": spans, "fonts": fonts, "links": links})
    attachments = {}
    for name, variants in document.attachments.items():
        data = variants[0]
        attachments[name] = json.loads(data) if name.endswith(".json") else {"sha256": digest(data)}
    return {"pages": pages, "attachments": attachments}


def compare_pdfs(root, left, right, prefix, boxes, url):
    """Renders paired PDFs through Poppler and checks their pixels and QR boxes."""
    a, b = pdf_structure(left), pdf_structure(right)
    result = {"id": prefix, "pageCounts": [len(a["pages"]), len(b["pages"])],
              "pageSizesEqual": [p["size"] for p in a["pages"]] == [p["size"] for p in b["pages"]],
              "textAndFontsEqual": [{k: p[k] for k in ("spans", "fonts")} for p in a["pages"]] == [{k: p[k] for k in ("spans", "fonts")} for p in b["pages"]],
              "attachmentNamesEqual": sorted(a["attachments"]) == sorted(b["attachments"]),
              "attachmentContentEqual": {name: a["attachments"][name] == b["attachments"].get(name) for name in a["attachments"]},
              "renders": [], "qr": []}
    (root / "review").mkdir(exist_ok=True)
    for dpi in (150, 300):
        with tempfile.TemporaryDirectory(prefix="stipra-skia-pdf-") as directory:
            renders = []
            for version, file in (("v3", left), ("v4", right)):
                stem = Path(directory) / version
                subprocess.run(["pdftoppm", "-r", str(dpi), "-png", str(file), str(stem)], check=True, capture_output=True)
                files = sorted(Path(directory).glob(version + "-*.png"))
                renders.append(files)
                for n, imagefile in enumerate(files):
                    image = Image.open(imagefile).convert("RGBA")
                    if dpi == 150:
                        image.save(root / "review" / f"{prefix}-{version}-page-{n + 1}.png")
                    page_height = a["pages"][n]["size"][3]
                    page_width = a["pages"][n]["size"][2]
                    actual_boxes = boxes if boxes else [{"x": page_width - 34 - 72, "y": 10, "width": 72, "height": 72, "mm": 25.4}]
                    for box in actual_boxes:
                        scale = dpi / 72
                        crop = image.crop((round(box["x"] * scale), round((page_height - box["y"] - box["height"]) * scale), round((box["x"] + box["width"]) * scale), round((page_height - box["y"]) * scale)))
                        result["qr"].append({"version": version, "page": n + 1, "dpi": dpi, "mm": box["mm"], "results": qr_decode(crop, url)})
            if len(renders[0]) != len(renders[1]):
                continue
            for n, (x, y) in enumerate(zip(*renders)):
                im_a, im_b = Image.open(x).convert("RGBA"), Image.open(y).convert("RGBA")
                if im_a.size != im_b.size:
                    result["renders"].append({"page": n + 1, "dpi": dpi, "dimensionsEqual": False})
                else:
                    result["renders"].append({"page": n + 1, "dpi": dpi, "rgbaSha256": [digest(im_a.tobytes()), digest(im_b.tobytes())], **pixel_diff(im_a.tobytes(), im_b.tobytes(), *im_a.size)})
    return result


def analyze(root):
    """Writes the measured comparison and explicit promotion blockers."""
    output = {"contract": "stipra-skia-results-v1", "comparisons": {}, "pdf": [], "memory": {}, "stops": [], "qr": [], "independentChecks": []}
    for group in ("decode", "masks", "fonts", "paper"):
        runs = [json.loads((root / "results" / v / f"{group}-0" / "records.json").read_text()) for v in ("v3", "v4")]
        records = []
        for a, b in zip(runs[0]["records"], runs[1]["records"], strict=True):
            if a["id"] != b["id"]:
                raise AssertionError("Case order differs")
            record = {"id": a["id"]}
            if "sourceUnchanged" in a:
                record["sourcesUnchanged"] = bool(a["sourceUnchanged"] and b["sourceUnchanged"])
            if "pure" in a:
                record["jsEqual"] = a["pure"] == b["pure"]
            if "error" in a or "error" in b:
                record.update({"errors": [a.get("error"), b.get("error")], "expectedRejection": bool(a.get("expectedRejection") and b.get("expectedRejection")), "rejectionEqual": a.get("error") == b.get("error")})
            if "rgbaPath" in a and "rgbaPath" in b:
                record["dimensionsEqual"] = (a["width"], a["height"]) == (b["width"], b["height"])
                if record["dimensionsEqual"]:
                    record["pixels"] = pixel_diff((root / a["rgbaPath"]).read_bytes(), (root / b["rgbaPath"]).read_bytes(), a["width"], a["height"])
            if "encodedSha256" in a:
                record["encodedEqual"] = a["encodedSha256"] == b["encodedSha256"]
                record["encodedBytes"] = [a["encodedBytes"], b["encodedBytes"]]
            if "metrics" in a:
                record["metricsEqual"] = a["metrics"] == b["metrics"]
                record["metrics"] = [a["metrics"], b["metrics"]]
                record["synthesis"] = [a.get("synthesis"), b.get("synthesis")]
            if "metadata" in a:
                record["metadataEqual"] = a["metadata"] == b["metadata"]
            if a.get("kind") == "qr":
                for version, item in zip(("v3", "v4"), (a, b)):
                    output["qr"].append({"id": a["id"], "version": version, "results": qr_decode(Image.open(root / item["imagePath"]), a["url"])})
            if a.get("kind") == "master":
                record["printEqual"] = a["print"] == b["print"]
                for version, item in zip(("v3", "v4"), (a, b)):
                    rgba = np.frombuffer((root / item["rgbaPath"]).read_bytes(), dtype=np.uint8).reshape(-1, 4)
                    coverage = np.frombuffer((root / item["coveragePath"]).read_bytes(), dtype=np.uint8)
                    output["independentChecks"].append({"id": item["id"], "version": version, "grayscalePolarity": bool(np.all(rgba[:, :3] == (255 - coverage)[:, None]) and np.all(rgba[:, 3] == 255)), "density300": png_density((root / item["imagePath"]).read_bytes()) == [[11811, 11811, 1]], "originZero": item["print"]["origin"] == {"x": 0, "y": 0}})
            if record.get("jsEqual") is False or record.get("dimensionsEqual") is False or (record.get("pixels", {}).get("equal") is False and (group != "fonts" or "Regular-Only" not in a["id"])):
                output["stops"].append({"group": group, "id": a["id"], "reason": "Mask, decoded artwork or geometry changed"})
            if record.get("metricsEqual") is False:
                output["stops"].append({"group": group, "id": a["id"], "reason": "Canvas text metrics changed; review callers"})
            if "Regular-Only" in a["id"] and record.get("pixels", {}).get("equal") is False:
                output["stops"].append({"group": group, "id": a["id"], "reason": "Missing-face default synthesizes bold in v4"})
            if ("error" in a or "error" in b) and not (record["expectedRejection"] and record["rejectionEqual"]):
                output["stops"].append({"group": group, "id": a["id"], "reason": "Unexpected decoder error or rejection change"})
            if record.get("sourcesUnchanged") is False or record.get("metadataEqual") is False or record.get("printEqual") is False:
                output["stops"].append({"group": group, "id": a["id"], "reason": "Source or metadata contract changed"})
            records.append(record)
        output["comparisons"][group] = {"records": records, "backend": [{k: r[k] for k in ("version", "node", "platform", "arch", "engine", "native")} for r in runs]}
    reports = [json.loads((root / "results" / v / "reports-0" / "records.json").read_text())["records"] for v in ("v3", "v4")]
    for a, b in zip(*reports, strict=True):
        if a["id"] == "qr-specimen":
            output["pdf"].append(compare_pdfs(root, root / a["pdfPath"], root / b["pdfPath"], "qr-specimen", a["boxes"], a["url"]))
        else:
            paths = [root / item["artifactDirectory"] for item in (a, b)]
            files = [next(p.rglob("*.pdf")) for p in paths]
            result = compare_pdfs(root, *files, a["id"], None, "https://apps.yigitdenktas.com/stipra/guide/")
            result["printEqual"] = a["manifest"]["output"] == b["manifest"]["output"]
            parts_a = {p["name"]: p for p in a["parts"]}
            parts_b = {p["name"]: p for p in b["parts"]}
            result["packageImages"] = []
            for name in parts_a:
                if not name.endswith((".png", ".jpg", ".webp")):
                    continue
                left_im, right_im = [Image.open(p / name).convert("RGBA") for p in paths]
                result["packageImages"].append({"path": name, "encodedEqual": parts_a[name]["sha256"] == parts_b[name]["sha256"],
                                                "pillowPixelsEqual": left_im.size == right_im.size and left_im.tobytes() == right_im.tobytes(), "dimensions": list(left_im.size)})
            orientation = a["manifest"]["report"]["orientation"]
            left_paper, right_paper = [Image.open(root / "results" / v / "reports-0" / ("paper-" + orientation + ".png")).convert("RGBA") for v in ("v3", "v4")]
            result["paperPixels"] = pixel_diff(left_paper.tobytes(), right_paper.tobytes(), *left_paper.size)
            output["pdf"].append(result)
            controlled = [root / "results" / v / "reports-0" / ("fixed-paper-" + orientation + ".pdf") for v in ("v3", "v4")]
            output["pdf"].append(compare_pdfs(root, *controlled, "fixed-paper-" + orientation, None, "https://apps.yigitdenktas.com/stipra/guide/"))
    for version in ("v3", "v4"):
        output["memory"][version] = []
        for file in sorted((root / "results" / version).glob("memory-*/records.json")):
            r = json.loads(file.read_text())["records"][0]
            samples = [s for s in r["samples"] if not s["warmup"]]
            output["memory"][version].append({"trial": file.parent.name, "requireMs": r["requireMs"], "canvasMs": r["canvasMs"], "decodeMs": r["decodeMs"], "encodeMs": r["encodeMs"], "medianExportMs": statistics.median(s["ms"] for s in samples), "rssStart": samples[0]["rss"], "rssEnd": samples[-1]["rss"], "rssMin": min(s["rss"] for s in samples), "rssMax": max(s["rss"] for s in samples), "maxRssKiB": r["resourceUsage"]["maxRSS"], "samples": len(samples)})
    output["references"] = reference_checks(root)
    for check in output["references"]:
        if not check["passed"]:
            output["stops"].append({"group": "reference", "id": check["id"], "reason": "ICC or orientation reference failed"})
    output["failure"] = json.loads((root / "results" / "failure.json").read_text())
    for item in output["failure"]:
        if not item["failedLoudly"]:
            output["stops"].append({"group": "failure", "id": item["version"], "reason": "Missing native payload did not fail loudly"})
    for check in output["independentChecks"]:
        if not all(check[k] for k in ("grayscalePolarity", "density300", "originZero")):
            output["stops"].append({"group": "physical", "id": check["id"], "reason": "Polarity, density or origin contract failed"})
    for item in output["qr"] + [q for pdf in output["pdf"] for q in pdf["qr"]]:
        if not all(r["passed"] for r in item["results"]):
            output["stops"].append({"group": "qr", "id": str(item), "reason": "Public-guide QR failed decoding"})
    for pdf in output["pdf"]:
        if not pdf["pageSizesEqual"] or not pdf["textAndFontsEqual"] or any(not r.get("equal") for r in pdf["renders"]):
            output["stops"].append({"group": "pdf", "id": pdf["id"], "reason": "Page geometry, fonts, text or decoded page pixels changed"})
    output["promotion"] = "stop-and-review" if output["stops"] else "eligible-for-separate-decision"
    (root / "results" / "comparison.json").write_text(json.dumps(output, indent=2) + "\n")
    print(json.dumps({"promotion": output["promotion"], "stops": len(output["stops"]), "cases": {k: len(v["records"]) for k, v in output["comparisons"].items()}, "pdfPairs": len(output["pdf"])}))


if __name__ == "__main__":
    experiment = Path(sys.argv[1]).resolve()
    with (experiment / "analysis.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        analyze(experiment)
