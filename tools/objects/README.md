# The objects

The five industry objects, the platform page's disc and the solutions arc are
not stock renders. Each one is the electron density of a real molecule, and
this directory is everything needed to make them again.

| file | molecule | atoms | basis fns | E (Ha) |
|---|---|---|---|---|
| `v-battery`    | ethylene carbonate | 10 | 104 | −341.7714 |
| `v-fine`       | biphenyl | 22 | 218 | −462.3703 |
| `v-pharma`     | (S)-ibuprofen | 33 | 300 | −655.3960 |
| `v-electronic` | 4-vinylphenol | 17 | 166 | −384.1083 |
| `v-thermal`    | trisiloxane | 37 | 314 | −1336.8018 |
| `v-coronene`   | coronene C24H12 | 36 | — | — |

RDKit embeds and MMFF-optimises the geometry, PySCF runs PBE/def2-SVP with
density fitting, `cubegen` writes the density on a 120³ grid, and VTK takes
two isosurfaces of it: 0.002 e/bohr³, which is where chemists put the edge of
a molecule, for the glass shell, and 0.20, which traces the bonds, for the
core. Blender renders both in Cycles.

## Running it

```sh
python3 build.py                     # geometry + density + two PLYs each, ~3 min
blender -b -P render.py -- battery 0.0 900 320 light
python3 normalize.py light           # one canvas, one optical size
python3 family.py light              # the solutions arc
```

`render.py` takes `<key> <ramp position> <resolution> <samples> <light|dark>`.
Ramp positions are battery 0.0, fine 0.25, pharma 0.50, electronic 0.75,
thermal 1.00, coronene 0.18.

## Why it is written this way

`ramp.py` holds the colour. The obvious way — walk a straight line through
`--glow-1/2/3` in linear RGB and mix each result toward white — is what the
first set did, and it produced a family that was not one: the three anchors
are not equal-chroma, and mixing toward white takes more out of the violet
than out of the teal. Hue is the only thing that moves here; lightness and
chroma are held flat, at a pair of values chosen so the sRGB gamut does not
clip any of the five.

Flat in the material is not flat in the render. The rig's fill, rim and back
lights are blue-tinted, which reinforces the violet end and washes the teal,
so `GAIN` carries the measured per-hue correction back into the base chroma.

`normalize.py` equalises apparent size on the square root of alpha-weighted
area, not on the bounding box: these shapes have very different aspect ratios,
and matching their heights would make the wide flat ones enormous.

There are two sets. Glass at 88% transmission in front of a white world
transmits white, which is why a render lit for a light page turns milky on a
dark one. The dark set is lit against a near-black world with the area lights
carrying the silhouette.

Measured across the five, first set → this one: apparent size 20.3% → 0.1%,
lightness 14.1% → 7.0%, chroma 25.4% → 6.5%.
