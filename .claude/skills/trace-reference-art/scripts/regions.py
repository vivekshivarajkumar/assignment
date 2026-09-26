# Split part of a traced picture into tappable regions, one per item (a piece of
# sushi, a toy, a letter...), for things the player removes or picks up. Each
# region covers exactly what the item covers in the reference, with the
# boundary down the middle of the ink line it shares with a neighbour, so
# removing one never cuts into the next. See ../SKILL.md.
#
# You give rough shapes (from a gridded crop of the reference); a seeded
# watershed finds the real inked edges within a band around them.
import cv2, numpy as np, json


def shape_mask(item, h, w, drum_ry):
    m = np.zeros((h, w), np.uint8)
    if 'circle' in item:
        x, y, r = item['circle']
        cv2.circle(m, (x, y), r, 1, -1)
    elif 'drum' in item:
        # a cylinder seen from above and in front: a round top, straight sides
        # down to a flatter bottom edge
        cx, cy, r, bottom = item['drum']
        cv2.circle(m, (cx, cy), r, 1, -1)
        cv2.rectangle(m, (cx - r, cy), (cx + r, bottom - drum_ry), 1, -1)
        cv2.ellipse(m, (cx, bottom - drum_ry), (r, drum_ry), 0, 0, 360, 1, -1)
    else:
        cv2.fillPoly(m, [np.array(item['polygon'], np.int32)], 1)
    return m


def rounded_rect(h, w, rect, r):
    m = np.zeros((h, w), np.uint8)
    L, T, R, B = rect
    cv2.rectangle(m, (L + r, T), (R - r, B), 1, -1)
    cv2.rectangle(m, (L, T + r), (R, B - r), 1, -1)
    for cx, cy in ((L + r, T + r), (R - r, T + r), (L + r, B - r), (R - r, B - r)):
        cv2.circle(m, (cx, cy), r, 1, -1)
    return m


def regions(ref, cfg):
    """ref: BGR image. cfg: the page config's "regions" block. Returns
    ({pieces: [[kind, x, y, path]], floor: '#rrggbb'}, preview image)."""
    h, w = ref.shape[:2]
    items = cfg['items']
    shapes = [shape_mask(it, h, w, cfg.get('drum_ry', 18)) for it in items]
    # which item is in front where they overlap: later in z_order wins
    visible = np.zeros((h, w), np.int32)
    for i in cfg.get('z_order', range(len(items))):
        visible[shapes[i] > 0] = i + 2
    # seeds: each item's visible part, shrunk well inside its edges
    markers = np.zeros((h, w), np.int32)
    k = np.ones((cfg.get('seed_erode', 25),) * 2, np.uint8)
    for i in range(len(items)):
        markers[cv2.erode((visible == i + 2).astype(np.uint8), k) > 0] = i + 2
    # background seed: outside the bounds, and anything inside well clear of every item
    L, T, R, B = cfg['bounds']
    inside = np.zeros((h, w), np.uint8)
    cv2.rectangle(inside, (L, T), (R, B), 1, -1)
    near = cv2.dilate((visible > 0).astype(np.uint8), np.ones((cfg.get('near', 29),) * 2, np.uint8))
    markers[(inside == 0) | ((near == 0) & (inside > 0))] = 1
    cv2.watershed(cv2.bilateralFilter(ref, 9, 60, 9), markers)
    ridge = markers == -1
    grown = cv2.dilate(np.where(markers > 1, markers, 0).astype(np.uint8), np.ones((3, 3), np.uint8))
    markers[ridge] = np.where(grown[ridge] > 1, grown[ridge], 1)

    # whatever shows between items inside the container (its floor) goes to the
    # nearest item, so removing them all leaves one clean empty container; the
    # container's own rim stays out
    if 'well' in cfg:
        well = rounded_rect(h, w, cfg['well']['rect'], cfg['well'].get('radius', 0))
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

    paths = [path((markers == i + 2).astype(np.uint8)) for i in range(len(items))]
    # what shows once an item is gone: the median of the reference's floor tones
    fs = cfg['floor_sample']
    x0, y0, x1, y1 = fs['rect']
    g = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY)
    box = np.zeros((h, w), bool)
    box[y0:y1, x0:x1] = True
    lo, hi = fs.get('gray', [22, 115])
    floor = np.median(ref[box & (g > lo) & (g < hi)], 0)
    out = {'pieces': [[it['kind'], it['center'][0], it['center'][1], p] for it, p in zip(items, paths)],
           'floor': '#%02x%02x%02x' % (int(floor[2]), int(floor[1]), int(floor[0]))}

    prev = ref.copy()
    rng = np.random.default_rng(4)
    for i in range(len(items)):
        col = rng.integers(60, 255, 3)
        m = markers == i + 2
        prev[m] = (0.5 * prev[m] + 0.5 * col).astype(np.uint8)
    return out, prev[max(0, T - 30):B + 30, max(0, L - 50):R + 20]


if __name__ == '__main__':
    import sys
    ref_path, cfg_path, out_path = sys.argv[1:4]
    data, _ = regions(cv2.imread(ref_path), json.load(open(cfg_path))['regions'])
    json.dump(data, open(out_path, 'w'))
    print('floor', data['floor'], '| region bytes', sum(len(p[3]) for p in data['pieces']))
