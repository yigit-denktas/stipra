"""Prepares pinned native backends outside the Stipra checkout."""
import base64
import hashlib
import io
import json
import platform
import shutil
import struct
import subprocess
import sys
import tarfile
from pathlib import Path

from PIL import Image, features

HERE = Path(__file__).resolve().parent
PINS = json.loads((HERE / "pins.json").read_text())


def sha(data):
    """Returns the identity used by the frozen experiment manifest."""
    return hashlib.sha256(data).hexdigest()


def freeze_inputs(root):
    """Generates synthetic inputs once and rejects changed frozen bytes."""
    out = root / "inputs"
    out.mkdir()
    for filename in ("color-reference.json", "png-boundaries.json"):
        data = json.loads((root / "snapshot/tests/fixtures" / filename).read_text())
        for key, value in data.get("files", data).items():
            extension = ".jpg" if "jpeg" in key else ".png"
            (out / (filename.split(".")[0] + "-" + key + extension)).write_bytes(base64.b64decode(value))
    for width, height in ((49, 33), (33, 49), (49, 49), (97, 61)):
        pixels = bytearray()
        for y in range(height):
            for x in range(width):
                color = (x * 255 // max(1, width - 1), y * 255 // max(1, height - 1), (x * 13 + y * 17) % 256)
                if x in (0, width - 1) or y in (0, height - 1):
                    color = (0, 0, 0)
                alpha = (0, 1, 2, 3, 7, 15, 31, 63, 127, 128, 254, 255)[x % 12] if y < height // 2 else 255
                pixels.extend((*color, alpha))
        (out / f"rgba-{width}x{height}.bin").write_bytes(pixels)
        image = Image.frombytes("RGBA", (width, height), bytes(pixels))
        image.save(out / f"rgba-{width}x{height}.png", compress_level=0)
        if (width, height) == (97, 61):
            image.save(out / "frozen-alpha.webp", lossless=True)
            image.convert("RGB").save(out / "frozen.jpg", quality=95, subsampling=0)
    base = (out / "frozen.jpg").read_bytes()
    for orientation in range(1, 9):
        exif = Image.Exif()
        exif[274] = orientation
        data = exif.tobytes()
        segment = b"\xff\xe1" + struct.pack(">H", len(data) + 2) + data
        (out / f"exif-{orientation}.jpg").write_bytes(base[:2] + segment + base[2:])
    (out / "fills.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" width="97" height="61" viewBox="0 0 97 61"><rect x="1" y="1" width="25" height="59" fill="#006043"/><path fill="#ff665d" fill-rule="evenodd" d="M30 2H94V58H30Z M40 12V48H84V12Z"/><circle cx="48.5" cy="30.5" r="15.2" fill="#0d4dad" opacity=".4"/></svg>')
    (out / "unsafe.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><image href="https://example.com/x.png"/></svg>')
    manifest = {p.name: {"bytes": p.stat().st_size, "sha256": sha(p.read_bytes())} for p in sorted(out.iterdir())}
    if manifest != PINS["inputs"]:
        raise AssertionError("Frozen fixture bytes changed; inspect generator/dependency versions, never replace pins automatically")
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


def prepare(root, repo):
    """Installs locked packages and verifies native, source and font identities."""
    if root.exists() or root.is_relative_to(repo):
        raise ValueError("Experiment root must be new and outside the source checkout")
    if platform.system() != "Linux" or platform.machine() != "x86_64":
        raise ValueError("These binary pins cover Linux x64 glibc only")
    root.mkdir(parents=True)
    snapshot = root / "snapshot"
    snapshot.mkdir()
    archive = subprocess.check_output(["git", "archive", PINS["sourceCommit"]], cwd=repo)
    with tarfile.open(fileobj=io.BytesIO(archive)) as stream:
        stream.extractall(snapshot, filter="data")
    if sha((snapshot / "package-lock.json").read_bytes()) != PINS["sourceLockSha256"]:
        raise AssertionError("Source lock identity changed")
    # Shared JS dependencies stay fixed; the worker intercepts every native import.
    (snapshot / "node_modules").symlink_to(repo / "node_modules", target_is_directory=True)
    fonts = repo / ".cache/stipra-paper-mono"
    for name, expected in PINS["fontsSha256"].items():
        if sha((fonts / name).read_bytes()) != expected:
            raise AssertionError("Font identity changed: " + name)
    shutil.copytree(fonts, snapshot / ".cache/stipra-paper-mono")
    for version in ("v3", "v4"):
        prefix = root / "backends" / version
        prefix.mkdir(parents=True)
        for name in ("package.json", "package-lock.json"):
            shutil.copyfile(HERE / "locks" / (version + "-" + name), prefix / name)
        if sha((prefix / "package-lock.json").read_bytes()) != PINS["backendLocksSha256"][version]:
            raise AssertionError("Backend lock identity changed")
        subprocess.run(["npm", "ci", "--prefix", str(prefix), "--ignore-scripts", "--no-audit", "--no-fund"], check=True)
        pin = PINS["native"][version]
        native = prefix / pin["path"]
        if version == "v3":
            reviewed = repo / "node_modules/skia-canvas/lib/skia.node"
            if sha(reviewed.read_bytes()) != pin["sha256"]:
                raise AssertionError("Need reviewed 3.0.8 Linux binary from the existing source install")
            shutil.copyfile(reviewed, native)
        if native.stat().st_size != pin["bytes"] or sha(native.read_bytes()) != pin["sha256"]:
            raise AssertionError("Native binary identity changed")
    freeze_inputs(root)
    env = {"python": platform.python_version(), "pillow": Image.__version__, "libjpeg": features.version_codec("jpg"), "libwebp": features.version_module("webp"), "node": subprocess.check_output(["node", "--version"], text=True).strip(), "sourceCommit": PINS["sourceCommit"]}
    (root / "environment.json").write_text(json.dumps(env, indent=2) + "\n")
    print(root)


if __name__ == "__main__":
    prepare(Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve())
