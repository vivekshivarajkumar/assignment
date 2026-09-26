# Crop part of a reference and rule a labelled grid over it, to read positions
# off: erase circles, item shapes and centres, a bar's rectangle. Coordinates
# are reference pixels; bold lines every 100, faint every 50.
#   python3 grid.py ref.png x0,y0,x1,y1 out.png [--scale 2]
import argparse
import cv2

ap = argparse.ArgumentParser()
ap.add_argument('ref'); ap.add_argument('box'); ap.add_argument('out')
ap.add_argument('--scale', type=float, default=1)
a = ap.parse_args()
x0, y0, x1, y1 = (int(v) for v in a.box.split(','))
crop = cv2.imread(a.ref)[y0:y1, x0:x1].copy()
crop = cv2.resize(crop, None, fx=a.scale, fy=a.scale, interpolation=cv2.INTER_NEAREST)
s = a.scale
for x in range((x0 // 50 + 1) * 50, x1, 50):
    bold = x % 100 == 0
    cv2.line(crop, (int((x - x0) * s), 0), (int((x - x0) * s), crop.shape[0]), (0, 0, 255) if bold else (140, 140, 255), 1)
    if bold:
        cv2.putText(crop, str(x), (int((x - x0) * s) + 2, 14), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 255), 1)
for y in range((y0 // 50 + 1) * 50, y1, 50):
    bold = y % 100 == 0
    cv2.line(crop, (0, int((y - y0) * s)), (crop.shape[1], int((y - y0) * s)), (0, 0, 255) if bold else (140, 140, 255), 1)
    if bold:
        cv2.putText(crop, str(y), (2, int((y - y0) * s) - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 255), 1)
cv2.imwrite(a.out, crop)
print('wrote', a.out)
