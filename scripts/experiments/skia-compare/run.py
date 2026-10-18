"""Runs each backend in a fresh process and records missing-payload failures."""
import json
import hashlib
import os
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def validate(root):
    """Rejects changed frozen inputs and native payloads before execution."""
    pins = json.loads((HERE / "pins.json").read_text())
    for name, pin in pins["inputs"].items():
        data = (root / "inputs" / name).read_bytes()
        if len(data) != pin["bytes"] or hashlib.sha256(data).hexdigest() != pin["sha256"]:
            raise AssertionError("Frozen input changed: " + name)
    for version, pin in pins["native"].items():
        data = (root / "backends" / version / pin["path"]).read_bytes()
        if len(data) != pin["bytes"] or hashlib.sha256(data).hexdigest() != pin["sha256"]:
            raise AssertionError("Native payload changed: " + version)


def run(root):
    """Collects isolated behavior and bounded repeated-export measurements."""
    if (root / "results").exists():
        raise ValueError("Results already exist; prepare a new experiment root")
    validate(root)
    for group in ("decode", "masks", "fonts", "reports", "paper"):
        for version in ("v3", "v4"):
            subprocess.run(["node", str(HERE / "worker.cjs"), str(root), version, group], check=True)
    # Alternate ordering to reduce the effect of one backend always running first.
    for trial, order in enumerate((("v3", "v4"), ("v4", "v3"), ("v3", "v4")), 1):
        for version in order:
            subprocess.run(["node", "--expose-gc", str(HERE / "worker.cjs"), str(root), version, "memory", str(trial)], check=True)
    records = []
    for version in ("v3", "v4"):
        dest = root / "failure" / version
        shutil.copytree(root / "backends" / version, dest, ignore=shutil.ignore_patterns("*.node", "@skia-canvas"))
        env = os.environ.copy()
        env["NODE_PATH"] = ""
        process = subprocess.run(["node", "-e", "require(process.argv[1])", str(dest / "node_modules/skia-canvas")], env=env, capture_output=True, text=True)
        expected = "Cannot find module" if version == "v3" else "could not find a native binary for this platform"
        record = {"version": version, "mode": "platform payload omitted from isolated copy", "exitCode": process.returncode, "error": process.stderr, "stdout": process.stdout, "failedLoudly": process.returncode != 0 and expected in process.stderr}
        if not record["failedLoudly"]:
            raise AssertionError("Missing payload failed silently")
        records.append(record)
    (root / "results/failure.json").write_text(json.dumps(records, indent=2) + "\n")
    subprocess.run([sys.executable, str(HERE / "analyze.py"), str(root)], check=True)


if __name__ == "__main__":
    run(Path(sys.argv[1]).resolve())
