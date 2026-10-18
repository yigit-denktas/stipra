"""Checks research PDF metadata independently of native rendering."""
import re


def differences(left, right, path=()):
    """Returns changed JSON paths without hiding type or structure changes."""
    if type(left) is not type(right):
        return [path]
    if isinstance(left, dict):
        paths = []
        for key in sorted(left.keys() | right.keys()):
            paths.extend(differences(left[key], right[key], path + (key,)) if key in left and key in right else [path + (key,)])
        return paths
    if isinstance(left, list):
        if len(left) != len(right):
            return [path]
        return [p for i, (a, b) in enumerate(zip(left, right)) for p in differences(a, b, path + (i,))]
    return [] if left == right else [path]


def at(value, path):
    """Reads a value at a path already confirmed present in both documents."""
    for key in path:
        value = value[key]
    return value


def attachment_contract(left, right, pixel_equal_image_pairs=()):
    """Allows image hash churn only when actual paired PNG pixels are equal."""
    pairs = set(pixel_equal_image_pairs)
    allowed, unexpected = [], []
    for name in sorted(left.keys() | right.keys()):
        if name not in left or name not in right:
            unexpected.append({"attachment": name, "path": [], "reason": "Attachment added or removed"})
            continue
        for path in differences(left[name], right[name]):
            image_leaf = (name == "report-layout.json" and len(path) == 5 and path[0] == "pages"
                          and type(path[1]) is int and path[2] == "images" and type(path[3]) is int and path[4] == "sha256")
            verified_pair = False
            if image_leaf:
                try:
                    a, b = at(left[name], path), at(right[name], path)
                except (KeyError, IndexError, TypeError):
                    a, b = None, None
                verified_pair = (isinstance(a, str) and isinstance(b, str)
                                 and re.fullmatch(r"[0-9a-f]{64}", a) is not None
                                 and re.fullmatch(r"[0-9a-f]{64}", b) is not None and (a, b) in pairs)
            change = {"attachment": name, "path": list(path)}
            (allowed if verified_pair else unexpected).append(change)
    return {"compatible": not unexpected, "allowedImageHashChanges": allowed, "unexpectedChanges": unexpected}


def pdf_contract_stops(pdf):
    """Blocks report metadata and artwork changes even when pages look equal."""
    stops = []
    if not pdf["attachmentContract"]["compatible"]:
        stops.append("Embedded recipe or layout attachment changed outside verified image hashes")
    if pdf.get("printEqual") is False:
        stops.append("Package physical print contract changed")
    if any(not item["pillowPixelsEqual"] for item in pdf.get("packageImages", [])):
        stops.append("Package image pixels changed")
    if any(item.get("workerIdentitiesVerified") is False for item in pdf.get("packageImages", [])):
        stops.append("Emitted package image differs from recorded identity")
    if pdf.get("linksEqual") is False:
        stops.append("PDF link destination or placement changed")
    return stops


def redact_paths(value, experiment, repository=None):
    """Removes host-specific paths from nested diagnostic text."""
    if isinstance(value, str):
        value = value.replace(str(experiment), "$EXPERIMENT")
        if repository:
            value = value.replace(str(repository), "$REPOSITORY")
        return re.sub(r"/workspace/scratch/[^\s\"'<>):]+", "$SCRATCH", value)
    if isinstance(value, list):
        return [redact_paths(v, experiment, repository) for v in value]
    if isinstance(value, dict):
        return {k: redact_paths(v, experiment, repository) for k, v in value.items()}
    return value
