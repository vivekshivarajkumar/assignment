# Trace a reference screenshot into fill paths: flat colour layers, a grey
# brush layer, and the black pen, all as filled shapes. See ../SKILL.md.
#
# Ink is traced at the halfway tone between pen and paper, at 2x so edges fall
# between pixels. Colour comes only from clean fill, so the anti-aliased rims
# of lines never become colours of their own. Output paths are in half
# reference pixels, relative ("M x y l dx dy ... z").
import cv2, numpy as np, json

UP = 2  # trace at 2x: edges land on half pixels

DEFAULTS = {
    'status_bar': 0,  # rows at the top of the screenshot that aren't the page
    'colors': 16,  # k-means clusters before near-duplicates are merged
    'merge_below': 3.0,  # Lab distance under which two colours are one
    'erase': [],  # [{"circle": [x, y, r], "carry_vertical_lines": true}]
    'erase_fill_min_gray': 150,  # what counts as plain background around an erased thing
    'ink_smooth': 0.9,  # blur on the 2x ink mask before contouring
    'ink_eps': 0.45,  # polygon simplification for ink, in reference pixels
    'brush_min_dark': 38,  # a stroke whose darkest point stays above this is grey brush, not pen
}


def enc(p):
    d = np.diff(p, axis=0)
    return 'M%d %d' % tuple(p[0]) + 'l' + ' '.join('%d %d' % (x, y) for x, y in d).replace(' -', '-') + 'z'


def nconv(img, weight, k):
    # average of img over the pixels where weight is 1, in a k x k window
    num = cv2.boxFilter(img * weight[..., None] if img.ndim == 3 else img * weight, -1, (k, k), normalize=False)
    den = cv2.boxFilter(weight, -1, (k, k), normalize=False)
    return num / np.maximum(den, 1e-6)[..., None] if img.ndim == 3 else num / np.maximum(den, 1e-6), den


def trace(ref, cfg):
    """ref: BGR image. Returns ({layers, brush, ink, inkColor}, preview image, report)."""
    c = {**DEFAULTS, **cfg}
    K, TOP = c['colors'], c['status_bar']
    h, w = ref.shape[:2]
    gray = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY).astype(np.float32)

    # things in the screenshot that aren't the page (the game's own buttons):
    # fill them with the plain tone around them; lines running behind them are
    # carried straight through by the ink pass below
    hole = np.zeros((h, w), np.uint8)
    src = ref.copy()
    for e in c['erase']:
        x, y, r = e['circle']
        one = np.zeros((h, w), np.uint8)
        cv2.circle(one, (x, y), r, 255, -1)
        ring = cv2.dilate(one, np.ones((31, 31), np.uint8)) & ~one
        src[one > 0] = np.median(ref[(ring > 0) & (gray > c['erase_fill_min_gray'])], 0)
        hole |= one

    # hair, clothing and shadowed areas are solid mid-dark regions; a black line
    # only passes through that tone at its 1-2 px anti-aliased rim, so an
    # opening keeps the areas and drops the rims
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
    for e in c['erase']:
        if not e.get('carry_vertical_lines'):
            continue
        x0, y0, r = e['circle']
        above, below = y0 - r - 3, y0 + r + 3
        for x in range(x0 - r, x0 + r + 1):
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
    under = np.where(pure[..., None], cv2.medianBlur(src, 3).astype(np.float32), col).astype(np.uint8)
    under = cv2.medianBlur(under, 3)
    lab = cv2.cvtColor(under, cv2.COLOR_BGR2LAB).reshape(-1, 3).astype(np.float32)
    sample = lab[np.random.default_rng(1).choice(len(lab), 60000, replace=False)]
    _, _, centers = cv2.kmeans(sample, K, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 60, 0.5), 4, cv2.KMEANS_PP_CENTERS)
    labels = np.zeros(h * w, np.uint8)
    for s in range(0, h * w, 400000):
        d = ((lab[s:s + 400000, None, :] - centers[None]) ** 2).sum(-1)
        labels[s:s + 400000] = d.argmin(1)
    labels = labels.reshape(h, w)
    # drop specks (a 3 x 3 opening; 5 x 5 erased the white inside chopsticks),
    # and give the gaps to whatever surrounds them
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
    # each layer's colour is the median of the reference's own clean pixels
    # inside it, not the cluster centre, which was found on a blurred copy and
    # rounded through 8-bit Lab (that gave the greys a cool cast)
    bgr = cv2.cvtColor(centers.reshape(1, K, 3).astype(np.uint8), cv2.COLOR_LAB2BGR)[0]
    for k in range(K):
        core = cv2.erode((labels == k).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
        sel = core & pure & ~ink
        if sel.sum() > 200:
            bgr[k] = np.median(ref[sel], 0)

    # clusters closer than a just-noticeable difference are one colour: merge
    # them, so spare clusters only survive where the reference has distinct tones
    def labof(v):
        return cv2.cvtColor(np.uint8([[v]]), cv2.COLOR_BGR2LAB)[0, 0].astype(float) * [100 / 255, 1, 1]

    while True:
        alive = [k for k in range(K) if (labels == k).any()]
        pairs = [(np.linalg.norm(labof(bgr[a]) - labof(bgr[b])), a, b) for i, a in enumerate(alive) for b in alive[i + 1:]]
        if not pairs:
            break
        d, a, b = min(pairs)
        if d >= c['merge_below']:
            break
        labels[labels == b] = a
        sel = (labels == a) & pure & ~ink
        bgr[a] = np.median(ref[sel], 0) if sel.sum() > 200 else bgr[a]
    bgr = np.where((bgr > 244).all(1, keepdims=True), 255, bgr).astype(np.uint8)
    hexes = ['#%02x%02x%02x' % (int(v[2]), int(v[1]), int(v[0])) for v in bgr]

    def path_soft(soft, eps, min_area, smooth=0.9):
        # contour the 0.5 level of a soft mask at 2x, so edges land between pixels
        big = cv2.resize(soft.astype(np.float32), (w * UP, h * UP), interpolation=cv2.INTER_CUBIC)
        big = cv2.GaussianBlur(big, (0, 0), smooth)
        m = (big > 0.5).astype(np.uint8)
        m[:TOP * UP] = 0
        cs, _ = cv2.findContours(m, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
        out = []
        for ct in cs:
            if abs(cv2.contourArea(ct)) < min_area * UP * UP:
                continue
            p = cv2.approxPolyDP(ct, eps * UP, True).reshape(-1, 2)
            if len(p) >= 3:
                out.append(enc(p))
        return ''.join(out)

    counts = np.bincount(labels.ravel(), minlength=K)
    order = np.argsort(-counts)
    # each layer overlaps its neighbours by half a pixel, so no paper shows
    # through the anti-aliased seam where two colours meet (drawn in order, the
    # later layer wins the overlap); this replaces stroking every layer
    grow = lambda m: cv2.dilate(m.astype(np.uint8), np.ones((2, 2), np.uint8)).astype(np.float32)
    layers = [[hexes[k], path_soft(grow(labels == k), 0.6, 30)] for k in order if counts[k]]
    # two inks: the black pen, and a dark grey brush for hatching. A stroke whose
    # darkest point never reaches black is brush; the pen's anti-aliased rims
    # are not, because their neighbourhood includes the black core
    darkest = cv2.erode(gray, np.ones((5, 5), np.uint8))
    brush = ink & (darkest > c['brush_min_dark'])
    pen_soft = np.where(brush, 0, ink_soft)
    brush_soft = np.where(brush, ink_soft, 0)
    inkd = path_soft(pen_soft, c['ink_eps'], 5, c['ink_smooth'])
    brushd = path_soft(brush_soft, 0.45, 4)
    hexof = lambda v: '#%02x%02x%02x' % (int(v[2]), int(v[1]), int(v[0]))
    inkhex = hexof(np.median(ref[ink & (gray < 30)], 0))
    brushhex = hexof(np.median(ref[brush & (gray < np.percentile(gray[brush], 50))], 0)) if brush.any() else inkhex

    preview = bgr[labels].copy()
    preview[ink & ~brush] = (3, 3, 3)
    preview[brush] = ref[brush]
    report = ('palette: ' + ' '.join(hexes[k] + ':%d%%' % (100 * counts[k] // labels.size) for k in order if counts[k]) +
              '\nink %s brush %s (%d px) | bytes: layers %d, brush %d, ink %d'
              % (inkhex, brushhex, brush.sum(), sum(len(d) for _, d in layers), len(brushd), len(inkd)))
    return {'layers': layers, 'brush': [brushhex, brushd], 'ink': inkd, 'inkColor': inkhex}, preview, report


if __name__ == '__main__':
    import sys
    ref_path, cfg_path, out = sys.argv[1:4]
    data, prev, rep = trace(cv2.imread(ref_path), json.load(open(cfg_path)).get('trace', {}))
    json.dump(data, open(out, 'w'))
    print(rep)
