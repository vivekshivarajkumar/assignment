# Traces the chapter 1 couch reference into src/game/chapters/ch01-couch-trace.js.
#
#   pip install opencv-python-headless numpy
#   python3 trace.py  ref.png trace.json trace-preview.png
#   python3 pieces.py ref.png pieces.json pieces-preview.png
#   python3 gen.py    trace.json pieces.json ../../src/game/chapters/ch01-couch-trace.js
#
# ref.png is the 1200 x 2670 phone screenshot (not kept in the repo). Ink is
# traced at the halfway tone between pen and paper, at 2x so edges fall between
# pixels; colour comes only from clean fill, so line edges never become colours
# of their own. Paths are in half reference pixels; the page draws them at 0.375.
import cv2, numpy as np, sys, json
REF, OUT, PREVIEW = sys.argv[1:4]
K = 12
TOP = 77
UP = 2

ref = cv2.imread(REF)
h, w = ref.shape[:2]
bx, by, br = 1078, 196, 62
hole = np.zeros((h, w), np.uint8)
cv2.circle(hole, (bx, by), br, 255, -1)
# the curtain behind the button is flat: fill the hole with the plain tone
# from a ring around it (the ink pass puts the line back)
src = ref.copy()
ring = cv2.dilate(hole, np.ones((31, 31), np.uint8)) & ~hole
ringg = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY)
src[hole > 0] = np.median(ref[(ring > 0) & (ringg > 150)], 0)
gray = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY).astype(np.float32)

def nconv(img, weight, k):
    # average of img over the pixels where weight is 1, in a k x k window
    num = cv2.boxFilter(img * weight[..., None] if img.ndim == 3 else img * weight, -1, (k, k), normalize=False)
    den = cv2.boxFilter(weight, -1, (k, k), normalize=False)
    return num / np.maximum(den, 1e-6)[..., None] if img.ndim == 3 else num / np.maximum(den, 1e-6), den

# hair, her shorts and the shadowed back of the tray are solid mid-dark areas;
# a black line only passes through that tone at its 1-2 px anti-aliased rim,
# so an opening keeps the areas and drops the rims
g3 = cv2.medianBlur(gray.astype(np.uint8), 3)
mid = ((g3 >= 26) & (g3 <= 78)).astype(np.uint8)
hairzone = cv2.morphologyEx(mid, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8)) > 0
# the local paper/fill tone, from pixels that are clearly not ink
rough = (gray < 90) & ~(hairzone & (gray >= 22))
fill_est, _ = nconv(gray, (~rough).astype(np.float32), 21)
fill_est[fill_est < 1] = 200
# ink sits at the halfway tone between the pen and the fill beside it
thr = np.clip((16 + fill_est) / 2, 55, 135)
thr[hairzone] = 22
ink_soft = np.clip((thr - gray) / 24 + 0.5, 0, 1)  # 0..1, 0.5 at the edge
ink_soft[hole > 0] = 0
# carry the curtain line behind the home button straight through
above, below = by - br - 3, by + br + 3
for x in range(bx - br, bx + br + 1):
    if ink_soft[above, x] > 0.5 and ink_soft[below, x] > 0.5:
        ink_soft[above:below, x] = 1
ink_soft[:TOP] = 0
ink = ink_soft > 0.5

# colour: every pixel takes the average of clean fill pixels around it, so
# the anti-aliased rim of a line never becomes a colour of its own
pure = ((gray > thr + 14) | (hairzone & ~ink)) & (hole == 0)
col, den = nconv(src.astype(np.float32), pure.astype(np.float32), 9)
bad = den < 1
if bad.any():
    fallback = cv2.inpaint(src, (ink * 255).astype(np.uint8), 5, cv2.INPAINT_TELEA).astype(np.float32)
    col[bad] = fallback[bad]
own = pure[..., None]
under = np.where(own, cv2.medianBlur(src, 3).astype(np.float32), col).astype(np.uint8)
under = cv2.medianBlur(under, 3)
lab = cv2.cvtColor(under, cv2.COLOR_BGR2LAB).reshape(-1, 3).astype(np.float32)
sample = lab[np.random.default_rng(1).choice(len(lab), 60000, replace=False)]
_, _, centers = cv2.kmeans(sample, K, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 60, 0.5), 4, cv2.KMEANS_PP_CENTERS)
labels = np.zeros(h * w, np.uint8)
for s in range(0, h * w, 400000):
    d = ((lab[s:s + 400000, None, :] - centers[None]) ** 2).sum(-1)
    labels[s:s + 400000] = d.argmin(1)
labels = labels.reshape(h, w)
clean = np.full((h, w), 255, np.uint8)
for k in range(K):
    m = cv2.morphologyEx((labels == k).astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    clean[m > 0] = k
holes = clean == 255
if holes.any():
    _, idx = cv2.distanceTransformWithLabels(holes.astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    ys, xs = np.nonzero(~holes)
    lut = np.zeros(idx.max() + 1, np.uint8)
    lut[idx[ys, xs]] = clean[ys, xs]
    clean[holes] = lut[idx[holes]]
labels = clean
bgr = cv2.cvtColor(centers.reshape(1, K, 3).astype(np.uint8), cv2.COLOR_LAB2BGR)[0]
bgr = np.where((bgr > 244).all(1, keepdims=True), 255, bgr).astype(np.uint8)
hexes = ['#%02x%02x%02x' % (int(c[2]), int(c[1]), int(c[0])) for c in bgr]

def enc(p):
    d = np.diff(p, axis=0)
    return 'M%d %d' % tuple(p[0]) + 'l' + ' '.join('%d %d' % (x, y) for x, y in d).replace(' -', '-') + 'z'

def path_soft(soft, eps, min_area):
    # contour the 0.5 level of a soft mask at 2x, so edges land between pixels
    big = cv2.resize(soft.astype(np.float32), (w * UP, h * UP), interpolation=cv2.INTER_CUBIC)
    big = cv2.GaussianBlur(big, (0, 0), 0.9)
    m = (big > 0.5).astype(np.uint8)
    m[:TOP * UP] = 0
    cs, _ = cv2.findContours(m, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    out = []
    for c in cs:
        if abs(cv2.contourArea(c)) < min_area * UP * UP:
            continue
        p = cv2.approxPolyDP(c, eps * UP, True).reshape(-1, 2)
        if len(p) >= 3:
            out.append(enc(p))
    return ''.join(out)

counts = np.bincount(labels.ravel(), minlength=K)
order = np.argsort(-counts)
layers = [[hexes[k], path_soft((labels == k).astype(np.float32), 0.6, 30)] for k in order]
inkd = path_soft(ink_soft, 0.45, 5)
core = ink & (gray < 30)
inkcol = np.median(ref[core], 0)
inkhex = '#%02x%02x%02x' % (int(inkcol[2]), int(inkcol[1]), int(inkcol[0]))
json.dump({'layers': layers, 'ink': inkd, 'inkColor': inkhex}, open(OUT, 'w'))
prev = bgr[labels].copy()
prev[ink] = (20, 20, 20)
cv2.imwrite(PREVIEW, prev)
print('palette:', ' '.join(hexes[k] + ':%d%%' % (100 * counts[k] // labels.size) for k in order))
print('ink', inkhex, '| bytes: layers %d, ink %d' % (sum(len(d) for _, d in layers), len(inkd)))
