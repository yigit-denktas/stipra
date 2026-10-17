#!/usr/bin/env python3
"""Fetch the pinned official Linux research validator after verifying its release digest."""
import hashlib
import io
import os
from pathlib import Path
import sys
import tarfile
import urllib.request

VERSION = '0.28.2'
SHA256 = 'ff9f05d0f985a77995ec18956671f331d619c804e033c9929972a8d4f479e93a'
URL = f'https://github.com/contentauth/c2patool/releases/download/v{VERSION}/v{VERSION}-x86_64-unknown-linux-gnu.tar.gz'
if sys.platform != 'linux' or os.uname().machine != 'x86_64':
    raise SystemExit('This pinned research helper supports Linux x86_64 only; supply your own verified tool on other hosts.')
target = Path(sys.argv[1] if len(sys.argv) > 1 else '.cache/c2patool')
with urllib.request.urlopen(URL, timeout=60) as response:
    archive = response.read(64 * 1024 * 1024 + 1)
if len(archive) > 64 * 1024 * 1024 or hashlib.sha256(archive).hexdigest() != SHA256:
    raise SystemExit('Official archive digest/size mismatch')
with tarfile.open(fileobj=io.BytesIO(archive), mode='r:gz') as tar:
    matches = [member for member in tar if member.isfile() and Path(member.name).name == 'c2patool']
    if len(matches) != 1 or matches[0].size > 64 * 1024 * 1024:
        raise SystemExit('Unexpected archive executable')
    data = tar.extractfile(matches[0]).read()
target.parent.mkdir(parents=True, exist_ok=True)
target.write_bytes(data)
target.chmod(0o755)
print(target.resolve())
