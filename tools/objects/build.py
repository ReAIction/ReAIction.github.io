"""The five industry objects, rebuilt as one family.

Same chemistry and the same pipeline as the first pass — RDKit geometry,
PBE/def2-SVP density, marching cubes at the Bader edge for the glass shell
and at 0.20 for the bonding core. Nothing about the physics changes; the
PLYs from the first pass are simply gone, so they have to be made again
before the material and the framing can be fixed.
"""
import sys, time, numpy as np, vtk
from vtk.util import numpy_support
from rdkit import Chem
from rdkit.Chem import AllChem
from pyscf import gto, dft, tools

BOHR = 0.529177210903
MOL = {
    "battery":    ("C1COC(=O)O1",                              "ethylene carbonate"),
    "fine":       ("c1ccc(-c2ccccc2)cc1",                      "biphenyl"),
    "pharma":     ("CC(C)Cc1ccc(cc1)[C@@H](C)C(=O)O",          "(S)-ibuprofen"),
    "electronic": ("C=Cc1ccc(O)cc1",                           "4-vinylphenol"),
    "thermal":    ("C[Si](C)(C)O[Si](C)(C)O[Si](C)(C)C",       "trisiloxane"),
}

def read_cube(p):
    with open(p) as f:
        f.readline(); f.readline()
        q = f.readline().split(); n = int(q[0]); org = np.array(list(map(float, q[1:4])))
        sh, ax = [], []
        for _ in range(3):
            r = f.readline().split(); sh.append(int(r[0])); ax.append(list(map(float, r[1:4])))
        for _ in range(n): f.readline()
        d = np.array(f.read().split(), dtype=np.float64)
    return org, np.array(sh), np.array(ax), d.reshape(sh)

def iso(cube, val, out):
    org, sh, ax, rho = read_cube(cube)
    sp = np.linalg.norm(ax, axis=1)
    img = vtk.vtkImageData(); img.SetDimensions(*sh)
    img.SetOrigin(*(org * BOHR)); img.SetSpacing(*(sp * BOHR))
    a = numpy_support.numpy_to_vtk(rho.ravel(order="F"), deep=True, array_type=vtk.VTK_FLOAT)
    a.SetName("rho"); img.GetPointData().SetScalars(a)
    mc = vtk.vtkMarchingCubes(); mc.SetInputData(img); mc.SetValue(0, val)
    mc.ComputeNormalsOn(); mc.Update()
    sm = vtk.vtkWindowedSincPolyDataFilter(); sm.SetInputConnection(mc.GetOutputPort())
    sm.SetNumberOfIterations(12); sm.SetPassBand(0.10); sm.BoundarySmoothingOff()
    sm.NonManifoldSmoothingOn(); sm.NormalizeCoordinatesOn(); sm.Update()
    nf = vtk.vtkPolyDataNormals(); nf.SetInputConnection(sm.GetOutputPort())
    nf.SetFeatureAngle(100); nf.SplittingOff(); nf.ConsistencyOn(); nf.Update()
    w = vtk.vtkPLYWriter(); w.SetInputConnection(nf.GetOutputPort()); w.SetFileName(out)
    w.SetFileTypeToBinary(); w.Write()
    return nf.GetOutput().GetNumberOfPolys()

for key in (sys.argv[1:] or list(MOL)):
    smi, name = MOL[key]
    t = time.time()
    m = Chem.AddHs(Chem.MolFromSmiles(smi))
    AllChem.EmbedMolecule(m, randomSeed=0xC0FFEE)
    AllChem.MMFFOptimizeMolecule(m, maxIters=3000)
    c = m.GetConformer()
    spec = "; ".join(f"{a.GetSymbol()} {c.GetAtomPosition(i).x:.6f} "
                     f"{c.GetAtomPosition(i).y:.6f} {c.GetAtomPosition(i).z:.6f}"
                     for i, a in enumerate(m.GetAtoms()))
    mol = gto.M(atom=spec, charge=0, spin=0, basis="def2-svp", verbose=0, max_memory=6000)
    mf = dft.RKS(mol, xc="pbe").density_fit(); mf.conv_tol = 1e-7
    e = mf.kernel(); assert mf.converged, key
    print(f"{key:11s} {name:20s} {m.GetNumAtoms():3d} atoms  {mol.nao:4d} bf  "
          f"E={e:.4f}  [{time.time()-t:.0f}s]", flush=True)
    cube = f"{key}.cube"
    tools.cubegen.density(mol, cube, mf.make_rdm1(), nx=120, ny=120, nz=120, margin=3.2)
    o = iso(cube, 0.002, f"{key}_outer.ply")
    i = iso(cube, 0.20,  f"{key}_inner.ply")
    print(f"{key:11s} outer {o} tris  inner {i} tris  [{time.time()-t:.0f}s]", flush=True)
    import os; os.remove(cube)
print("BUILD_DONE")
