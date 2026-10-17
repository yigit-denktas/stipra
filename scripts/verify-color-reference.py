"""Verify the committed original patch fixtures using Pillow's LittleCMS path."""
import base64
import io
import json
from pathlib import Path

from PIL import Image, ImageCms


def verify():
    fixture = json.loads((Path(__file__).resolve().parents[1] / "tests/fixtures/color-reference.json").read_text())
    results = []
    for name, reference in [("linear", "reference"), ("linear-jpeg", "jpeg-reference")]:
        source = Image.open(io.BytesIO(base64.b64decode(fixture["files"][name])))
        expected = Image.open(io.BytesIO(base64.b64decode(fixture["files"][reference])))
        profile = ImageCms.ImageCmsProfile(io.BytesIO(source.info["icc_profile"]))
        actual = ImageCms.profileToProfile(source, profile, ImageCms.createProfile("sRGB"), outputMode="RGB")
        differences = [abs(a-b) for x, y in fixture["sampleCoordinates"]
                       for a, b in zip(actual.getpixel((x, y)), expected.getpixel((x, y)))]
        maximum = max(differences)
        if maximum > fixture["tolerance8bit"]:
            raise AssertionError(f"{name}: reference drift {maximum}")
        results.append({"fixture": name, "maximumPatchDifference8bit": maximum})
    print(json.dumps({"Pillow": Image.__version__, "LittleCMS": ImageCms.core.littlecms_version,
                      "results": results}, indent=2))


if __name__ == "__main__":
    verify()
