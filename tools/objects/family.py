"""The solutions cover: the same five objects, in a row, as one arc.

Composed from the finished card renders, so the cover and the cards below it
are literally the same five files at the same optical size. The old arc drew
them at five different sizes, which is the same problem the cards had.
"""
import sys, numpy as np
from PIL import Image

W, H = 1480, 347
KEYS = ["battery", "fine", "pharma", "electronic", "thermal"]
XS   = [150, 432, 715, 1000, 1290]     # evenly spaced, overlapping
AMP  = 46                              # how far the arc rises in the middle
BASE = 0.545                           # of the canvas height

def trim(p):
    im = Image.open(p).convert("RGBA")
    a = np.array(im)[..., 3]
    ys, xs = np.where(a > 6)
    return im.crop((xs.min(), ys.min(), xs.max()+1, ys.max()+1))

def build(suffix, out):
    ims = [trim(f"v-{k}{suffix}.png") for k in KEYS]
    # One scale for all five: they are already equal-area, so a single factor
    # keeps them equal and only has to clear the canvas at the arc's extremes.
    tallest = max(i.size[1] for i in ims)
    s = (H - 2*AMP - 16) / tallest
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for i, im in enumerate(ims):
        w, h = im.size
        r = im.resize((round(w*s), round(h*s)), Image.LANCZOS)
        y = round(H*BASE - AMP*np.sin(np.pi*i/4))
        canvas.alpha_composite(r, (XS[i] - r.size[0]//2, y - r.size[1]//2))
    canvas.save(out)
    a = np.array(canvas)[..., 3]
    ys, xs = np.where(a > 6)
    clip = (xs.min() <= 0, xs.max() >= W-1, ys.min() <= 0, ys.max() >= H-1)
    print(f"{out}: ink x {xs.min()}-{xs.max()} y {ys.min()}-{ys.max()} in {W}x{H}"
          f"  scale {s:.3f}  clipped L/R/T/B {clip}")

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "light"
    build("" if mode == "light" else "-dark",
          "v-family.png" if mode == "light" else "v-family-dark.png")
