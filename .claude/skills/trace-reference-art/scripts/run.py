# Trace one page end to end: python3 run.py pages/<page>.json <reference.png>
# Run from anywhere; the output path in the config is relative to the repo root.
# Writes the ES module, plus previews to --work (default: a temp folder) to
# check the trace before rendering it in the game.
import argparse, hashlib, json, os, sys, tempfile, pathlib
import cv2
sys.path.insert(0, os.path.dirname(__file__))
from tracer import trace
from regions import regions
from gen import module

ap = argparse.ArgumentParser()
ap.add_argument('config')
ap.add_argument('reference')
ap.add_argument('--work', default=None, help='where previews go')
a = ap.parse_args()

page = json.load(open(a.config))
repo = pathlib.Path(__file__).resolve().parents[4]
work = pathlib.Path(a.work or tempfile.mkdtemp(prefix='trace-%s-' % page['page']))
work.mkdir(parents=True, exist_ok=True)

ref = cv2.imread(a.reference)
if ref is None:
    sys.exit('cannot read ' + a.reference)
size = [ref.shape[1], ref.shape[0]]
digest = hashlib.sha256(open(a.reference, 'rb').read()).hexdigest()
want = page['reference']
if size != want['size']:
    sys.exit('reference is %s, config expects %s' % (size, want['size']))
if want.get('sha256') and want['sha256'] != digest:
    print('warning: this is not the same image the page was traced from (sha256 differs)')

t, prev, rep = trace(ref, page.get('trace', {}))
print(rep)
cv2.imwrite(str(work / 'trace-preview.png'), prev)
r = None
if 'regions' in page:
    r, rprev = regions(ref, page['regions'])
    cv2.imwrite(str(work / 'regions-preview.png'), rprev)
    print('regions: %d, floor %s' % (len(r['pieces']), r['floor']))
out = repo / page['out']
out.write_text(module(page, t, r))
print('wrote %s (%d KB); previews in %s' % (page['out'], out.stat().st_size // 1024, work))
