"""Exercises attachment-only tampering and encoded-image exceptions."""
import copy
import unittest

from contracts import attachment_contract, differences, pdf_contract_stops, redact_paths

A, B = "a" * 64, "b" * 64


class AttachmentContracts(unittest.TestCase):
    """Mutates independent recipe and layout fields without changing pages."""

    def setUp(self):
        """Builds a minimal report with separate ink, replay and layout settings."""
        self.original = {"inks.json": {"inks": [{"gain": 1}]}, "replay.json": {"dpi": 300},
                         "report-layout.json": {"pages": [{"images": [{"name": "Original", "x": 34, "sha256": A}]}]}}

    def test_encoded_hash_change_requires_pixel_verified_pair(self):
        changed = copy.deepcopy(self.original)
        changed["report-layout.json"]["pages"][0]["images"][0]["sha256"] = B
        self.assertFalse(attachment_contract(self.original, changed)["compatible"])
        result = attachment_contract(self.original, changed, [(A, B)])
        self.assertTrue(result["compatible"])
        self.assertEqual(len(result["allowedImageHashChanges"]), 1)

    def test_recipe_dpi_geometry_identity_and_structure_mutations_stop(self):
        mutations = []
        for name, key, value in [("inks.json", "inks", [{"gain": 2}]), ("replay.json", "dpi", 72)]:
            changed = copy.deepcopy(self.original)
            changed[name][key] = value
            mutations.append(changed)
        for key, value in [("x", 35), ("name", "Different image"), ("sha256", "not-a-digest")]:
            changed = copy.deepcopy(self.original)
            changed["report-layout.json"]["pages"][0]["images"][0][key] = value
            mutations.append(changed)
        changed = copy.deepcopy(self.original)
        changed["report-layout.json"]["pages"].append({"images": []})
        mutations.append(changed)
        changed = copy.deepcopy(self.original)
        del changed["inks.json"]
        mutations.append(changed)
        changed = copy.deepcopy(self.original)
        del changed["report-layout.json"]["pages"][0]["images"][0]["sha256"]
        mutations.append(changed)
        for changed in mutations:
            with self.subTest(changed=changed):
                result = attachment_contract(self.original, changed, [(A, B)])
                self.assertFalse(result["compatible"])
                self.assertTrue(pdf_contract_stops({"attachmentContract": result}))

    def test_known_image_hash_does_not_hide_semantic_change(self):
        changed = copy.deepcopy(self.original)
        image = changed["report-layout.json"]["pages"][0]["images"][0]
        image.update(sha256=B, x=35)
        result = attachment_contract(self.original, changed, [(A, B)])
        self.assertFalse(result["compatible"])
        self.assertEqual(len(result["allowedImageHashChanges"]), 1)
        self.assertEqual(len(result["unexpectedChanges"]), 1)

    def test_print_images_and_links_are_blocking(self):
        valid = {"attachmentContract": {"compatible": True}, "printEqual": True, "linksEqual": True,
                 "packageImages": [{"pillowPixelsEqual": True}]}
        self.assertEqual(pdf_contract_stops(valid), [])
        for key, value in [("printEqual", False), ("linksEqual", False), ("packageImages", [{"pillowPixelsEqual": False}]),
                           ("packageImages", [{"pillowPixelsEqual": True, "workerIdentitiesVerified": False}])]:
            changed = copy.deepcopy(valid)
            changed[key] = value
            self.assertEqual(len(pdf_contract_stops(changed)), 1)

    def test_json_types_and_path_diagnostics(self):
        self.assertEqual(differences({"gain": True}, {"gain": 1}), [("gain",)])
        nested = {"error": "require('/workspace/scratch/old-task/lib.js')\nat /private/run/x.js:3"}
        result = redact_paths(nested, "/private/run")
        self.assertNotIn("/workspace/scratch/", result["error"])
        self.assertNotIn("/private/run", result["error"])


if __name__ == "__main__":
    unittest.main()
