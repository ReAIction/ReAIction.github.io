"""One rig, five objects, two pages.

What changed from the first pass:

  colour   the shell and the core come from ramp.py, which holds lightness
           and chroma fixed and moves only the hue, so the five are the same
           material rather than five different ones.

  camera   one formula for all five instead of a framing tuned per molecule.
           The family resemblance is mostly the camera.

  world    the first pass lit everything against a white world at strength
           .75. That is why the objects went milky on the dark page: glass at
           88% transmission in front of a white world transmits white. The
           dark variant puts a near-black world behind them and lets the four
           area lights do the work, so the silhouette is specular and the
           body stays coloured.
"""
import bpy, sys, math, os, numpy as np
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ramp

A = sys.argv[sys.argv.index("--")+1:]
KEY, T, RES, SAMP, MODE = A[0], float(A[1]), int(A[2]), int(A[3]), A[4]
DARK = MODE == "dark"
HERE = os.path.dirname(os.path.abspath(__file__))

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
try:
    sc.cycles.device = "GPU"; pr = bpy.context.preferences.addons["cycles"].preferences
    pr.compute_device_type = "METAL"; pr.get_devices()
    for d in pr.devices: d.use = True
except Exception as e: print("CPU:", e)
sc.cycles.samples = SAMP; sc.cycles.use_denoising = True
sc.cycles.max_bounces = 32; sc.cycles.transmission_bounces = 24
sc.cycles.transparent_max_bounces = 32; sc.cycles.glossy_bounces = 8
sc.render.resolution_x = sc.render.resolution_y = RES
sc.render.film_transparent = True
sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGBA"
sc.view_settings.view_transform = "Standard"
sc.view_settings.exposure = 0.12 if DARK else -0.20

def load(p, n):
    bpy.ops.wm.ply_import(filepath=os.path.join(HERE, p))
    o = bpy.context.selected_objects[0]; o.name = n
    for f in o.data.polygons: f.use_smooth = True
    return o
outer = load(f"{KEY}_outer.ply", "outer"); inner = load(f"{KEY}_inner.ply", "inner")

# Principal axes: widest across the frame, thinnest toward the camera, so a
# flat molecule is seen face-on rather than edge-on.
V = np.array([v.co[:] for v in outer.data.vertices]); ctr = V.mean(axis=0)
_, _, Vt = np.linalg.svd(V - ctr, full_matrices=False)
e1, e2, e3 = Vt[0], Vt[1], Vt[2]
if np.dot(np.cross(e1, e2), e3) < 0: e3 = -e3
R = Matrix([[e1[0], e3[0], e2[0]],
            [e1[1], e3[1], e2[1]],
            [e1[2], e3[2], e2[2]]]).transposed().to_4x4()
for o in (outer, inner):
    o.matrix_world = R @ Matrix.Translation(-Vector(ctr.tolist())) @ o.matrix_world
bpy.context.view_layer.update()
bb = [outer.matrix_world @ Vector(c) for c in outer.bound_box]
ext = [max(v[i] for v in bb) - min(v[i] for v in bb) for i in range(3)]
mid = sum(bb, Vector()) / 8
for o in (outer, inner): o.location -= mid
size = max(ext[0], ext[2])
print(f"{KEY} extents {np.round(ext,2)} framing {size:.2f}", flush=True)

SHELL, CORE = ramp.material(T, dark=DARK)
def sv(n, k, v):
    if k in n.inputs: n.inputs[k].default_value = v
mo = bpy.data.materials.new("o"); mo.use_nodes = True
b = mo.node_tree.nodes["Principled BSDF"]
sv(b, "Base Color", SHELL); sv(b, "Roughness", .05); sv(b, "IOR", 1.52)
sv(b, "Transmission Weight", .90 if DARK else .88)
sv(b, "Coat Weight", .34 if DARK else .30); sv(b, "Coat Roughness", .04)
outer.data.materials.append(mo)
mi = bpy.data.materials.new("i"); mi.use_nodes = True
b2 = mi.node_tree.nodes["Principled BSDF"]
sv(b2, "Base Color", CORE); sv(b2, "Roughness", .26)
sv(b2, "Metallic", .10); sv(b2, "Coat Weight", .25)
if DARK: sv(b2, "Emission Color", CORE); sv(b2, "Emission Strength", .22)
inner.data.materials.append(mi)

sc.world = bpy.data.worlds.new("w"); sc.world.use_nodes = True
bgn = sc.world.node_tree.nodes["Background"]
bgn.inputs[0].default_value = (0.035, 0.042, 0.058, 1) if DARK else (1, 1, 1, 1)
bgn.inputs[1].default_value = 1.0 if DARK else .75

def area(n, loc, rot, s, e, c=(1, 1, 1)):
    d = bpy.data.lights.new(n, "AREA"); d.size = s; d.energy = e; d.color = c
    o = bpy.data.objects.new(n, d); sc.collection.objects.link(o)
    o.location = loc; o.rotation_euler = rot
# With no white world to fill in, the dark variant leans harder on the rig.
G = 2.45 if DARK else 1.0
R2 = size * 2.6
area("key",  ( R2*.9, -R2*.9,  R2*.8),  (math.radians(52),  0, math.radians(46)),  size*2.0, 1150*G)
area("fill", (-R2*1.1,-R2*.5,  R2*.1),  (math.radians(80),  0, math.radians(-64)), size*2.6,  520*G, (.88,.94,1))
area("rim",  ( 0,      R2*1.2, R2*.9),  (math.radians(-40), 0, 0),                 size*2.2,  820*G, (.84,.90,1))
area("back", (-R2*.3,  R2*1.6,-R2*.4),  (math.radians(-118),0, math.radians(-14)), size*3.0,  600*G, (.78,.96,1))

cd = bpy.data.cameras.new("c"); cd.lens = 70
cam = bpy.data.objects.new("c", cd); sc.collection.objects.link(cam); sc.camera = cam
# One three-quarter view for the whole family. Distance is generous because
# the frame is normalised afterwards by ink area, not by this number.
# Coronene is a flat disc and keeps the framing it was published with; a
# three-quarter view that suits a lobed cluster makes a disc look bent.
CAM = {"coronene": (0.85, -3.05, 1.05)}
cx, cy, cz = CAM.get(KEY, (0.55, -3.35, 0.80))
cam.location = (size*cx, size*cy, size*cz)
tt = cam.constraints.new("TRACK_TO"); tt.track_axis = "TRACK_NEGATIVE_Z"; tt.up_axis = "UP_Y"
tg = bpy.data.objects.new("t", None); sc.collection.objects.link(tg); tt.target = tg

sc.render.filepath = os.path.join(HERE, f"raw_{KEY}_{MODE}.png")
bpy.ops.render.render(write_still=True)
print("DONE", KEY, MODE, flush=True)
