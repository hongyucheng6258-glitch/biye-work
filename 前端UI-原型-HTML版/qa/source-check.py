"""Read-only verification against the original V1 source tree digest."""
from pathlib import Path
import hashlib, json, datetime

output = Path(__file__).resolve().parents[1]
source = output.parent / '毕业设计（更新版本）'
reference = json.loads((output/'qa/source-integrity.json').read_text(encoding='utf-8'))
if not source.is_dir():
    raise SystemExit('Original source folder is not next to this package; integrity check skipped.')
entries = []
for file in source.rglob('*'):
    if file.is_file():
        digest = hashlib.sha256()
        with file.open('rb') as stream:
            for chunk in iter(lambda: stream.read(1024*1024), b''):
                digest.update(chunk)
        entries.append(('/'+file.relative_to(source).as_posix(),file.stat().st_size,digest.hexdigest().upper()))
entries.sort(key=lambda row: row[0])
tree_digest = hashlib.sha256('\n'.join(f'{p}\t{s}\t{h}' for p,s,h in entries).encode()).hexdigest()
report = {'version':'V2','checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'algorithm':'SHA-256 of sorted path/size/file SHA-256 records',
          'baselineFileCount':reference['fileCountBefore'],'currentFileCount':len(entries),
          'baselineTreeDigest':reference['treeDigestBefore'],'currentTreeDigest':tree_digest,
          'unchanged':tree_digest==reference['treeDigestBefore'] and len(entries)==reference['fileCountBefore']}
(output/'qa/v2/source-integrity-v2.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
if not report['unchanged']:
    raise SystemExit(1)
