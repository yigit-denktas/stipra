# Studio v0.9-rc.1 — prepared prerelease notes

Status: prepared, not published. Target the exact verified commit `aec0c23d6cc538e4e00352c66ee9543eba7694cd`, not a moving branch. Set GitHub's prerelease flag and do not mark this as a stable/latest release. This does not change the three published npm alpha.1 packages.

The GitHub tag must be **`v0.9.0-rc.1`**. The earlier `v0.9-rc.1` name is a Studio planning label; it omits the patch component and is not accepted by the release-history SemVer contract. Keep the already verified archive and its manifest unchanged; use the full tag when publishing.

## Release description

Stiprā's first Studio release candidate is an experimental digital printmaking workflow: import artwork, compare recipes without replacing edits, adjust ink coverage, inspect each plate and export aligned masters with a reproducible package.

- Added [ART-01] Import supported raster images and restricted geometric SVG with declared color and geometry limits.
- Added [STU-01] Inspect and adjust two to eight spot inks or CMYK, compare candidate recipes, and explicitly keep or adopt a treatment.
- Added [STY-01] Use versioned shared recipe families with physical screen-frequency settings and suitability guidance.
- Added [DOC-01] Follow public reproduction instructions using the Studio's control names and print vocabulary.
- Verified [QA-01] Check digital geometry, deterministic masks, real Chromium interaction and browser/CLI export parity for the candidate source.
- Verified [OPS-01] Verify the retained browser archive and every listed site file against their recorded SHA-256 values.

The main-build [verification run](https://github.com/yigit-denktas/stipra/actions/runs/39274175313) passed all 77 steps, including 189 Node tests with none skipped. The [Pages deployment](https://github.com/yigit-denktas/stipra/actions/runs/39274175418) succeeded for the same source commit. Separate source release-history/navigation tests passed locally (14/14).

[Browser candidate archive](https://github.com/yigit-denktas/stipra/actions/runs/39274175313/artifacts/12197585789): **3,714,250 bytes**, SHA-256 `a07cb05d0f14945b69870c6b6fb1e084cf62cb0e10674cfb2caac72eabce32b3`. Its `candidate.json` records the source revision, workflow run and 78 site-file hashes. All 79 ZIP entries, including the manifest, were independently checked after download. No mismatched, missing, unlisted or duplicate files were found. The Actions download expires on 18 November 2026; attach these exact bytes as a release asset if publishing, rather than relying on the temporary link as permanent distribution.

Serve the extracted site over HTTP, keeping its fonts, notices and relative paths together. The existing [primary Studio](https://apps.yigitdenktas.com/stipra/) stays primary; [GitHub Pages](https://yigit-denktas.github.io/stipra/) remains the mirror. The root Node application is private and this browser archive contains no native executable or owner photographs.

### Limits retained in this prerelease

Previews are uncalibrated digital approximations. Human keyboard/screen-reader observations remain open; physical printing and independent artist trials are owner-deferred, not passed. The owner approved the supplied digital forest/beach specimens only. Native executable/container distribution remains blocked on component notices in #14. No Skia upgrade, final identity approval, npm publication or physical-quality claim follows from this candidate.

The hosted entry/guide/Canvas observations are bounded. The live-host import-to-download journey remains incomplete because browser file transfer failed and the connected browser then reported an extension UI requiring a person to dismiss it. CI verifies the full built-site workflow; this is not a substitute claim about a completed live-host interaction. Direct primary-host HTTP hashing from the command runner returned 403 and supplies no deployed-byte equivalence evidence.

## Verification reproduction

Download artifact 12197585789 from run 39274175313, then independently check its archive digest and internal manifest:

```sh
python3 - /path/to/stipra-browser.zip <<'PY'
import hashlib, json, pathlib, sys, zipfile
p = pathlib.Path(sys.argv[1])
assert p.stat().st_size == 3714250
assert hashlib.sha256(p.read_bytes()).hexdigest() == 'a07cb05d0f14945b69870c6b6fb1e084cf62cb0e10674cfb2caac72eabce32b3'
with zipfile.ZipFile(p) as z:
    assert z.testzip() is None
    names = z.namelist()
    assert len(names) == len(set(names)) == 79
    m = json.loads(z.read('candidate.json'))
    assert m['sourceRevision'] == 'aec0c23d6cc538e4e00352c66ee9543eba7694cd'
    assert m['workflowRunId'] == '39274175313'
    entries = m['files']
    assert len(entries) == len({f['path'] for f in entries}) == 78
    assert set(names) == {f['path'] for f in entries} | {'candidate.json'}
    for f in entries:
        b = z.read(f['path'])
        assert len(b) == f['bytes']
        assert hashlib.sha256(b).hexdigest() == f['sha256'], f['path']
print('Verified exact Studio browser candidate')
PY
```

The archive digest is checked before parsing; this procedure is for the pinned candidate, not an arbitrary ZIP reader. Numeric verification is recorded in [the follow-up evidence](evidence/studio-candidate-follow-up-2026-10-19.json). The first transfer was truncated and rejected; only the fresh complete download matched the archive digest and passed verification.

## Publication handoff

These notes and typed capability mappings are prepared for the existing release-history workflow. Publication has not occurred. The connector exposes no release-write operation, and browser automation is currently blocked by the extension UI; no tag, release or asset upload was attempted through an undocumented interface. After publication through the normal GitHub release flow, verify the actual release URL/target/asset digest, the release-history job and its dispatched Pages build. Do not insert a publication timestamp or release event manually to simulate that operational acceptance.
