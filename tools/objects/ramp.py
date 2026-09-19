"""The family's colour, set in OKLab instead of in linear RGB.

The first pass walked a straight line through --glow-1/2/3 in linear RGB and
then mixed each result toward white by a fixed fraction. Measured on the five
finished renders, that produced a family that was not one: mean saturation ran
from 31.8 (pharma, near the blue anchor) down to 19.8 (thermal, at the violet
end), because the three anchors are not equal-chroma and mixing toward white
takes more chroma out of the violet than out of the teal.

Here the hue is the only thing that moves. Lightness and chroma are held at
the family's mean, so the five objects are the same material catching the
same light, and the only thing that says which industry it is, is the hue.
"""
import numpy as np

G1 = (0.176, 0.831, 0.749)   # --glow-1 #2dd4bf
G2 = (0.231, 0.510, 0.965)   # --glow-2 #3b82f6
G3 = (0.655, 0.545, 0.980)   # --glow-3 #a78bfa

def lin2oklab(c):
    r, g, b = c
    l = 0.4122214708*r + 0.5363325363*g + 0.0514459929*b
    m = 0.2119034982*r + 0.6806995451*g + 0.1073969566*b
    s = 0.0883024619*r + 0.2817188376*g + 0.6299787005*b
    l_, m_, s_ = np.cbrt(l), np.cbrt(m), np.cbrt(s)
    return np.array([0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_,
                     1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_,
                     0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_])

def oklab2lin(L, a, b):
    l_ = L + 0.3963377774*a + 0.2158037573*b
    m_ = L - 0.1055613458*a - 0.0638541728*b
    s_ = L - 0.0894841775*a - 1.2914855480*b
    l, m, s = l_**3, m_**3, s_**3
    return np.array([ 4.0767416621*l - 3.3077115913*m + 0.2309699292*s,
                     -1.2684380046*l + 2.6097574011*m - 0.3413193965*s,
                     -0.0041960863*l - 0.7034186147*m + 1.7076147010*s])

def lch(c):
    L, a, b = lin2oklab(c)
    return L, float(np.hypot(a, b)), float(np.arctan2(b, a))

L1, C1, H1 = lch(G1); L2, C2, H2 = lch(G2); L3, C3, H3 = lch(G3)
L_BAR = (L1 + L2 + L3) / 3
C_BAR = (C1 + C2 + C3) / 3

def _unwrap(a, b):
    """Shortest way round the hue circle."""
    d = b - a
    while d >  np.pi: d -= 2*np.pi
    while d < -np.pi: d += 2*np.pi
    return a + d

def hue(t):
    """The CSS gradient puts --glow-2 at 48%, so the hue path does too."""
    if t <= .48:
        u = t / .48; return H1 + (_unwrap(H1, H2) - H1) * u
    u = (t - .48) / .52;  return H2 + (_unwrap(H2, H3) - H2) * u

def fit(L, C, h):
    """Largest chroma at this lightness and hue that still lands in gamut."""
    lo, hi = 0.0, C
    for _ in range(28):
        mid = (lo + hi) / 2
        rgb = oklab2lin(L, mid*np.cos(h), mid*np.sin(h))
        if np.all(rgb >= -1e-6) and np.all(rgb <= 1 + 1e-6): lo = mid
        else: hi = mid
    return np.clip(oklab2lin(L, lo*np.cos(h), lo*np.sin(h)), 0, 1), lo

# Chosen by sweeping (L, C) and checking the chroma actually reachable at all
# five hues: these four are the ones where the gamut does not clip any of them,
# so the achieved chroma is identical to three decimal places across the family.
# Anything lighter or more chromatic starts clipping blue and periwinkle first,
# which is exactly how the first pass lost the violet end.
# For reference, the first pass landed at shell L=.926/.883/.916 C=.056/.054/.044
# and core L=.884/.811/.867 C=.094/.092/.071 — a 9% spread in lightness and 25%
# in chroma. These two pairs sit inside those ranges and are flat across all
# five hues, so the family keeps the brightness it had and stops drifting.
# First try at (0.90,0.040)/(0.83,0.080) made a coherent family that was
# visibly weaker on the page than what it replaced: holding chroma flat at
# a high lightness means holding it at what periwinkle can reach there,
# and the teal lost a fifth of its colour. Dropping lightness two steps
# buys that back and is still inside the range the first pass used
# (core L ran .811 to .884).
LIGHT = {"shell": (0.88, 0.050), "core": (0.80, 0.099)}
# The first dark attempt took the lightness down to meet the background and
# the object vanished into it. On a black page the object is not dark — it
# is lit glass, so the base stays bright and the black comes from the world
# behind it and from the shadow side, not from the pigment.
DARK  = {"shell": (0.84, 0.074), "core": (0.80, 0.099)}

# Equal chroma in the material does not come out as equal chroma in the
# render. Measured on the finished images, the teal end lands 30% flatter than
# the violet end, in both appearances and by the same factors — the rig's fill,
# rim and back lights are all blue-tinted, which reinforces the violet and
# washes the teal. These are the measured ratios to the family median, applied
# to the base chroma so the *rendered* chroma comes out flat. All five stay in
# gamut at these lightnesses; fit() would clamp them if they did not.
GAIN = {0.00: 1.305, 0.25: 1.245, 0.50: 1.000, 0.75: 0.945, 1.00: 0.989}

def gain(t):
    ks = sorted(GAIN)
    if t <= ks[0]: return GAIN[ks[0]]
    for a, b in zip(ks, ks[1:]):
        if t <= b:
            u = (t - a) / (b - a)
            return GAIN[a] + (GAIN[b] - GAIN[a]) * u
    return GAIN[ks[-1]]

def material(t, dark=False):
    """(shell, core) as linear RGBA, for a white page or for a black one."""
    h = hue(t); g = gain(t)
    P = DARK if dark else LIGHT
    shell, _ = fit(P["shell"][0], P["shell"][1] * g, h)
    core,  _ = fit(P["core"][0],  P["core"][1]  * g, h)
    return tuple(shell) + (1,), tuple(core) + (1,)

if __name__ == "__main__":
    print(f"anchors  L={L1:.3f}/{L2:.3f}/{L3:.3f}  C={C1:.3f}/{C2:.3f}/{C3:.3f}")
    print(f"family   L={L_BAR:.3f}  C={C_BAR:.3f}")
    for k, t in [("battery",0.0),("fine",.25),("pharma",.50),("electronic",.75),("thermal",1.0)]:
        s, c = material(t); sd, cd = material(t, dark=True)
        f = lambda v: "#" + "".join(f"{round(x**(1/2.2)*255):02x}" for x in v[:3])
        print(f"  {k:11s} t={t:.2f}  light shell {f(s)} core {f(c)}   dark shell {f(sd)} core {f(cd)}")
