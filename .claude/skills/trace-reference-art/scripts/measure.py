# Measure a render against its reference. Judge the art by these numbers and
# the images this writes, not by eye alone: every real improvement in the couch
# page showed up here, and so did every mistake.
#
#   python3 measure.py ref.png mine.png --status-bar 77 --out DIR \
#       [--ignore x0,y0,x1,y1 ...]        areas to leave out (e.g. the reference's own UI)
#       [--grain name=x0,y0,x1,y1 ...]    flat areas: grain strength at 1, 2 and 4 px
#       [--tones name=x0,y0,x1,y1 ...]    busy areas: share of black / dark grey / mid / light
#       [--crop name=x0,y0,x1,y1 ...]     3x crops, reference beside render
# All coordinates are reference pixels. Writes side.png (reference | render |
# 50/50 overlay: doubled lines mean misalignment), heat.png (where the error is).
import argparse, pathlib
import cv2, numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('ref'); ap.add_argument('render')
ap.add_argument('--status-bar', type=int, default=0)
ap.add_argument('--out', default='.')
for opt in ('ignore', 'grain', 'tones', 'crop'):
    ap.add_argument('--' + opt, nargs='*', default=[])
a = ap.parse_args()
out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
box = lambda s: tuple(int(v) for v in s.split(','))
named = lambda items: [(s.split('=')[0], box(s.split('=')[1])) for s in items]

ref = cv2.imread(a.ref)
m = cv2.imread(a.render)
# the render starts where the status bar ends; put it back in reference coordinates
mine = np.full_like(ref, 255)
rows = min(m.shape[0], ref.shape[0] - a.status_bar)
mine[a.status_bar:a.status_bar + rows] = cv2.resize(m, (ref.shape[1], m.shape[0] * ref.shape[1] // m.shape[1]))[:rows]
valid = np.zeros(ref.shape[:2], bool); valid[a.status_bar:a.status_bar + rows] = True
for x0, y0, x1, y1 in map(box, a.ignore):
    valid[y0:y1, x0:x1] = False

gr = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY)
gm = cv2.cvtColor(mine, cv2.COLOR_BGR2GRAY)
d = np.abs(ref.astype(int) - mine.astype(int)).mean(2)
lines = cv2.dilate((cv2.Canny(gr, 60, 140) > 0).astype(np.uint8), np.ones((7, 7), np.uint8)) > 0
print('error (0-255): everywhere %.2f | near lines %.2f | pixels off by >60: %.2f%%'
      % (d[valid].mean(), d[valid & lines].mean(), 100 * (d[valid] > 60).mean()))
band = 300
print('by band: ' + '  '.join('%d-%d: %.1f' % (y, y + band, d[y:y + band][valid[y:y + band]].mean())
                              for y in range(a.status_bar, ref.shape[0], band) if valid[y:y + band].any()))

if a.grain:
    print('grain: detail left after removing blur of sigma 1 / 2 / 4 (reference vs render)')
    clear = cv2.dilate((gr < 100).astype(np.uint8), np.ones((25, 25), np.uint8)) == 0
    hp = lambda g, s: g.astype(np.float32) - cv2.GaussianBlur(g.astype(np.float32), (0, 0), s)
    for name, (x0, y0, x1, y1) in named(a.grain):
        sel = clear[y0:y1, x0:x1] & valid[y0:y1, x0:x1]
        r = [hp(gr, s)[y0:y1, x0:x1][sel].std() for s in (1, 2, 4)]
        o = [hp(gm, s)[y0:y1, x0:x1][sel].std() for s in (1, 2, 4)]
        print('  %-14s %.2f %.2f %.2f   vs   %.2f %.2f %.2f' % (name, *r, *o))

if a.tones:
    print('tones: % of pixels  <40 | 40-90 | 90-150 | 150-210 | >210   (reference / render)')
    bins = [0, 40, 90, 150, 210, 256]
    for name, (x0, y0, x1, y1) in named(a.tones):
        hr = np.histogram(gr[y0:y1, x0:x1], bins)[0] / gr[y0:y1, x0:x1].size * 100
        hm = np.histogram(gm[y0:y1, x0:x1], bins)[0] / gm[y0:y1, x0:x1].size * 100
        print('  %-14s ' % name + ' | '.join('%4.1f/%4.1f' % p for p in zip(hr, hm)))

top = a.status_bar
views = [ref[top:top + rows], mine[top:top + rows], cv2.addWeighted(ref, 0.5, mine, 0.5, 0)[top:top + rows]]
gap = np.full((rows, 20, 3), 255, np.uint8)
side = np.hstack([views[0], gap, views[1], gap, views[2]])
cv2.imwrite(str(out / 'side.png'), cv2.resize(side, (side.shape[1] // 3, side.shape[0] // 3)))
heat = cv2.applyColorMap(np.clip(d * 3, 0, 255).astype(np.uint8), cv2.COLORMAP_INFERNO)
cv2.imwrite(str(out / 'heat.png'), cv2.resize(heat[top:top + rows], (ref.shape[1] // 3, rows // 3)))
for name, (x0, y0, x1, y1) in named(a.crop):
    pair = np.hstack([ref[y0:y1, x0:x1], np.full((y1 - y0, 4, 3), 255, np.uint8), mine[y0:y1, x0:x1]])
    cv2.imwrite(str(out / ('crop-%s.png' % name)), cv2.resize(pair, None, fx=3, fy=3, interpolation=cv2.INTER_NEAREST))
print('wrote side.png, heat.png' + ''.join(', crop-%s.png' % n for n, _ in named(a.crop)) + ' to ' + str(out))
