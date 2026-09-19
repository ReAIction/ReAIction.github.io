"""Put the five on one canvas at one optical size.

Measured on the first pass, the ink inside the shared 430x332 canvas ran from
236px tall (biphenyl) to 330px (ethylene carbonate) — a 40% difference in
apparent size between two cards sitting side by side, which is why the row
never looked like a set.

Bounding box is the wrong thing to equalise, because these shapes have very
different aspect ratios: matching heights would make the wide flat ones huge.
What the eye compares is how much object there is, so the normalisation is on
sqrt of the alpha-weighted area, with a cap so nothing overflows the canvas.
"""
import sys, numpy as np
from PIL import Image

CANVAS = (430, 332)
MARGIN = 0.020          # of the canvas, kept clear on every side
# The first pass ran from sqrt(ink area) 260.5 (trisiloxane) to 326.9 (ethylene
# carbonate) on a canvas of 377.8 — a 20% spread, with a median at 0.742 of the
# canvas. Holding every object at that median keeps the size the cards were
# designed around and takes the spread to nothing.
# 0.742 was the old median, but the two most elongated molecules cannot reach
# it inside a canvas of this aspect — they hit the width cap and come out 9%
# small, which is the spread all over again. 0.676 is what the widest of the
# five can hold, so every one of them lands on it exactly.
FILL   = 0.676

def load(p):
    im = Image.open(p).convert("RGBA")
    a = np.array(im)
    al = a[..., 3]
    ys, xs = np.where(al > 6)
    if len(xs) == 0: raise SystemExit(f"{p}: nothing rendered")
    im = im.crop((xs.min(), ys.min(), xs.max()+1, ys.max()+1))
    ink = float(np.array(im)[..., 3].sum()) / 255.0
    return im, ink

def place(paths, out_tpl):
    loaded = {k: load(p) for k, p in paths.items()}
    target = FILL * np.sqrt(CANVAS[0] * CANVAS[1])
    W = int(CANVAS[0] * (1 - 2*MARGIN)); H = int(CANVAS[1] * (1 - 2*MARGIN))
    rows = []
    for k, (im, ink) in loaded.items():
        s = target / np.sqrt(ink)
        w, h = im.size
        s = min(s, W / w, H / h)                      # never overflow the canvas
        nw, nh = max(1, round(w*s)), max(1, round(h*s))
        r = im.resize((nw, nh), Image.LANCZOS)
        c = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
        c.paste(r, ((CANVAS[0]-nw)//2, (CANVAS[1]-nh)//2), r)
        c.save(out_tpl % k)
        a = np.array(c); al = a[..., 3]
        ys, xs = np.where(al > 6)
        op = a[al > 128][:, :3].astype(float)/255
        mx, mn = op.max(1), op.min(1)
        sat = np.where(mx > 0, (mx-mn)/np.maximum(mx, 1e-6), 0)
        rows.append((k, xs.max()-xs.min()+1, ys.max()-ys.min()+1,
                     np.sqrt(al.sum()/255.0), op.mean()*100, sat.mean()*100))
    print(f"{'object':12s} {'ink w':>6s} {'ink h':>6s} {'sqrt area':>10s} {'L%':>6s} {'S%':>6s}")
    for r in rows: print(f"{r[0]:12s} {r[1]:6d} {r[2]:6d} {r[3]:10.1f} {r[4]:6.1f} {r[5]:6.1f}")
    sq = [r[3] for r in rows]; sa = [r[5] for r in rows]
    print(f"spread: size {(max(sq)-min(sq))/max(sq)*100:.1f}%   saturation "
          f"{(max(sa)-min(sa))/max(sa)*100:.1f}%")

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "light"
    keys = ["battery", "fine", "pharma", "electronic", "thermal"]
    suffix = "" if mode == "light" else "-dark"
    place({k: f"raw_{k}_{mode}.png" for k in keys}, f"v-%s{suffix}.png")
