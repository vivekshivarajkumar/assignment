# Split the tray into one region per piece, for the floor that shows once it's eaten.
import cv2, numpy as np, json, sys
REF, OUT, PREVIEW = sys.argv[1:4]
ref = cv2.imread(REF)
h, w = ref.shape[:2]
# rough silhouettes from the grid, back to front: a maki is a drum (top face
# plus side wall), a nigiri a slab. The watershed only has to find the real
# edge within a band around each of these.
MAKI = [(302, 1962, 88, 2080), (454, 1966, 88, 2072), (643, 1962, 86, 2076),
        (292, 2146, 88, 2246), (465, 2132, 90, 2246), (652, 2134, 88, 2246)]
N1 = [(700, 2010), (760, 1930), (870, 1893), (975, 1902), (988, 1960), (950, 2030), (880, 2072), (760, 2088), (704, 2066)]
N2 = [(728, 2172), (790, 2100), (900, 2060), (986, 2066), (988, 2142), (940, 2216), (830, 2244), (738, 2238)]
P = [('maki',) + m[:2] for m in MAKI] + [('nigiri', 842, 1990), ('nigiri', 858, 2150)]
shapes = []
for cx, cy, r, yb in MAKI:
    m = np.zeros((h, w), np.uint8)
    cv2.circle(m, (cx, cy), r, 1, -1)
    cv2.rectangle(m, (cx - r, cy), (cx + r, yb - 18), 1, -1)
    cv2.ellipse(m, (cx, yb - 18), (r, 18), 0, 0, 360, 1, -1)
    shapes.append(m)
for poly in (N1, N2):
    m = np.zeros((h, w), np.uint8)
    cv2.fillPoly(m, [np.array(poly, np.int32)], 1)
    shapes.append(m)
# z-order: back row, upper nigiri, front row, lower nigiri
ZORDER = [0, 1, 2, 6, 3, 4, 5, 7]
visible = np.zeros((h, w), np.int32)
for i in ZORDER:
    visible[shapes[i] > 0] = i + 2
markers = np.zeros((h, w), np.int32)
k = np.ones((25, 25), np.uint8)
for i in range(len(P)):
    markers[cv2.erode((visible == i + 2).astype(np.uint8), k) > 0] = i + 2
# background: the rim and beyond, and floor well clear of every piece
inside = np.zeros((h, w), np.uint8)
cv2.rectangle(inside, (198, 1852), (994, 2256), 1, -1)
near = cv2.dilate((visible > 0).astype(np.uint8), np.ones((29, 29), np.uint8))
markers[(inside == 0) | ((near == 0) & (inside > 0))] = 1
smooth = cv2.bilateralFilter(ref, 9, 60, 9)
cv2.watershed(smooth, markers)
ridge = markers == -1
grown = cv2.dilate(np.where(markers > 1, markers, 0).astype(np.uint8), np.ones((3, 3), np.uint8))
markers[ridge] = np.where(grown[ridge] > 1, grown[ridge], 1)

# the floor showing between pieces goes to the nearest piece, so eating them all
# leaves one clean empty tray; the rim line (black) and rim (grey) stay out
# (the well, inset from the rim line and rounded at the corners like it)
well = np.zeros((h, w), np.uint8)
L, T, R, B, r = 218, 1868, 980, 2246, 34
cv2.rectangle(well, (L + r, T), (R - r, B), 1, -1)
cv2.rectangle(well, (L, T + r), (R, B - r), 1, -1)
for cx, cy in ((L + r, T + r), (R - r, T + r), (L + r, B - r), (R - r, B - r)):
    cv2.circle(well, (cx, cy), r, 1, -1)
gap = (well > 0) & (markers == 1)
_, near_idx = cv2.distanceTransformWithLabels((markers <= 1).astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
ys, xs = np.nonzero(markers > 1)
lut = np.zeros(near_idx.max() + 1, np.int32)
lut[near_idx[ys, xs]] = markers[ys, xs]
markers[gap] = lut[near_idx[gap]]

def path(mask):
    # grown a pixel so neighbouring regions overlap rather than leave a sliver
    mask = cv2.dilate(mask, np.ones((3, 3), np.uint8))
    cs, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=cv2.contourArea)
    p = cv2.approxPolyDP(c, 0.7, True).reshape(-1, 2)
    d = np.diff(p, axis=0)
    return 'M%d %d' % tuple(p[0]) + 'l' + ' '.join('%d %d' % (x, y) for x, y in d).replace(' -', '-') + 'z'

regions = [path((markers == i + 2).astype(np.uint8)) for i in range(len(P))]
# the floor of the tray: dark plastic, the same at every depth where it shows
g = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY)
tray = np.zeros((h, w), bool); tray[1862:2252, 212:985] = True
floor = np.median(ref[tray & (g > 22) & (g < 115)], 0)
json.dump({'pieces': [[k, x, y, r] for (k, x, y), r in zip(P, regions)],
           'floor': '#%02x%02x%02x' % (int(floor[2]), int(floor[1]), int(floor[0]))}, open(OUT, 'w'))
prev = ref.copy()
rng = np.random.default_rng(4)
for i in range(len(P)):
    col = rng.integers(60, 255, 3)
    m = markers == i + 2
    prev[m] = (0.5 * prev[m] + 0.5 * col).astype(np.uint8)
cv2.imwrite(PREVIEW, prev[1820:2290, 150:1010])
print('floor', json.load(open(OUT))['floor'], '| region bytes', sum(len(r) for r in regions))
