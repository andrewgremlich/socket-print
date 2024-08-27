# -*- coding: utf-8 -*-
"""
Package for dealing with analysis methods of the ampObject and generating 
reports 
Copyright: Joshua Steer 2020, Joshua.Steer@soton.ac.uk
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as clr
import matplotlib.colorbar as clb
from mpl_toolkits.mplot3d import Axes3D
# from .output import getPDF  # Uncomment if PDF generation is needed
# from .cython_ext import planeEdgeIntersect_cy, logEuPath_cy  # Uncomment if using Cython versions
import os

# The file path used in doc examples
filename = os.path.join(os.getcwd(), "tests", "stl_file.stl")

def calc_volume_closed(amp_in, return_closed=False):
    amp = amp_in.close()
    v01 = amp.vert[amp.faces[:, 1], :].astype(np.float64) - amp.vert[amp.faces[:, 0], :].astype(np.float64)
    v02 = amp.vert[amp.faces[:, 2], :].astype(np.float64) - amp.vert[amp.faces[:, 0], :].astype(np.float64)
    cp = np.square(np.cross(v01, v02))
    area = 0.5 * np.sqrt(cp.sum(axis=1))
    sVC = area * amp.vert[amp.faces, 2].mean(axis=1) * amp.norm[:, 2]
    if return_closed:
        return sVC.sum(), amp
    return sVC.sum()

def create_slices(amp, *args, typ='slices', axis=2, order=True):
    if typ == 'slices':
        slices = np.asarray(args[0], dtype=np.float64)
    elif typ == 'real_intervals':
        lim = np.asarray(args[0], dtype=np.float64)
        intervals = np.float64(args[1])
        slices = np.arange(lim[0], lim[1], intervals, dtype=np.float64)
        slices = np.append(slices, lim[1])
    elif typ == 'norm_intervals':
        limb_min = np.float64(amp.vert[:, axis].min())
        limb_max = np.float64(amp.vert[:, axis].max())
        limb_len = limb_max - limb_min
        lim = np.asarray(args[0], dtype=np.float64)
        intervals = np.float64(args[1])
        slices = np.arange(lim[0], lim[1], intervals, dtype=np.float64)
        slices = np.append(slices, lim[1])
        slices = limb_min + (slices * limb_len)
    else:
        return []
    vE = amp.vert[:, axis][amp.edges].astype(np.float64)
    polys = []
    for plane in slices:
        try:
            ind = vE <= plane
            validEdgeInd = np.where(np.logical_xor(ind[:, 0], ind[:, 1]))[0]
            validfE = amp.faceEdges[validEdgeInd, :].astype(np.int64)
            faceOrder = logEuPath(validfE)
            validEdges = amp.edgesFace[faceOrder, :].astype(np.int64)
            edges = validEdges[np.isin(validEdges, validEdgeInd)].reshape([-1, 2])
            e = edges.flatten()
            sortE = []
            for ed in e:
                if ed not in sortE:
                    sortE.append(ed)
            sortE.append(sortE[0])
            sortE = np.asarray(sortE, dtype=np.int64)
            polyEdge = amp.edges[sortE].astype(np.int64)
            EdgePoints = np.c_[amp.vert[polyEdge[:, 0], :].astype(np.float64), amp.vert[polyEdge[:, 1], :].astype(np.float64)]
            polys.append(planeEdgeintersect(EdgePoints, plane, axis))
        except Exception:
            continue
    return polys

def calc_perimeter(polys):
    perimeter = np.zeros(len(polys), dtype=np.float64)
    for i, p in enumerate(polys):
        d = p[1:, :].astype(np.float64) - p[:-1, :].astype(np.float64)
        dist = np.linalg.norm(d, axis=1)
        perimeter[i] = dist.sum()
    return perimeter

def calc_widths(polys):
    cor_width = np.zeros(len(polys), dtype=np.float64)
    sag_width = np.zeros(len(polys), dtype=np.float64)
    ix = np.argmin(polys[0].max(axis=0) - polys[0].min(axis=0))
    ind = [0, 1, 2]
    ind.remove(ix)
    for i, p in enumerate(polys):
        cor_width[i], sag_width[i] = p[:, ind].max(axis=0) - p[:, ind].min(axis=0)
    return cor_width, sag_width

def calc_csa(polys):
    csa = np.zeros(len(polys), dtype=np.float64)
    ix = np.argmin(polys[0].max(axis=0) - polys[0].min(axis=0))
    ind = [0, 1, 2]
    ind.remove(ix)
    for i, p in enumerate(polys):
        csa[i] = 0.5 * np.abs(np.dot(p[:, ind[0]].astype(np.float64), np.roll(p[:, ind[1]].astype(np.float64), 1)) -
                              np.dot(p[:, ind[1]].astype(np.float64), np.roll(p[:, ind[0]].astype(np.float64), 1)))
    return csa

def est_volume(polys):
    ix = np.argmin(polys[0].max(axis=0) - polys[0].min(axis=0))
    ind = [0, 1, 2]
    ind.remove(ix)
    csa = calc_csa(polys)
    d = []
    for p in polys:
        d.append(p[:, ix].astype(np.float64).mean())
    d = np.asarray(d, dtype=np.float64)
    dist = np.abs(d[1:] - d[:-1])
    vol = np.c_[csa[1:], csa[:-1]]
    vol = np.mean(vol, axis=1) * dist
    return vol.sum()

def logEuPath(arr):
    vmax = arr.shape[0]
    rows = list(range(vmax))
    order = []
    i = 0
    val = arr[i, 0]
    nmax = vmax - 1
    for n in range(nmax):
        del rows[i]
        order.append(val)
        i = 0
        for x in rows:
            if arr[x, 0] == val:
                val = arr[x, 1]
                break
            if arr[x, 1] == val:
                val = arr[x, 0]
                break
            i += 1
    order.append(val)
    order = np.asarray(order, dtype=np.int64)
    return order

def planeEdgeintersect(edges, plane, axis=2):
    intersectPoints = np.zeros((edges.shape[0], 3), dtype=np.float64)
    intersectPoints[:, axis] = plane
    axesInd = np.array([0, 1, 2])[np.array([0, 1, 2]) != axis]
    for i in axesInd:
        intersectPoints[:, i] = (edges[:, i].astype(np.float64) +
                                 (plane - edges[:, axis].astype(np.float64)) *
                                 (edges[:, i + 3].astype(np.float64) - edges[:, i].astype(np.float64)) /
                                 (edges[:, axis + 3].astype(np.float64) - edges[:, axis].astype(np.float64)))
    return intersectPoints

def visualise_slices(amp):
    fig = plt.figure()
    fig.set_size_inches(8, 8)
    ax = plt.axes(projection="3d")
    X = amp.vert[:, 0].astype(np.float64)
    Y = amp.vert[:, 1].astype(np.float64)
    Z = amp.vert[:, 2].astype(np.float64)
    ax.view_init(elev=0., azim=-90)
    ax.axis('off')
    ax.set_proj_type('ortho')
    ax.set_aspect('equal')
    ax.plot_trisurf(X, Y, Z, triangles=amp.faces, color=(1.0, 1.0, 1.0), 
                    shade=False, edgecolor='none', linewidth=0, antialiased=False)
    plt.savefig('test1.png', dpi=600)
    plt.close(fig)

def plot_slices(amp, axis=2, slWidth=10):
    ind = np.where(amp.faceEdges[:, 1] == -99999)[0]
    maxZ = amp.vert[amp.edges[ind, :], 2].astype(np.float64).min()
    slices = np.arange(amp.vert[:, 2].astype(np.float64).min() + slWidth, maxZ, slWidth, dtype=np.float64)
    polys = create_slices(amp, slices, axis)
    fig = plt.figure()
    fig.set_size_inches(6, 4.5)
    ax1 = fig.add_subplot(221, projection='3d')
    for p in polys:
        ax1.plot(p[:, 0], p[:, 1], p[:, 2], c='b')
    extents = np.array([getattr(ax1, 'get_{}lim'.format(dim))() for dim in 'xyz'], dtype=np.float64)
    sz = extents[:, 1] - extents[:, 0]
    centers = np.mean(extents, axis=1)
    maxsize = max(abs(sz))
    r = maxsize / 2
    for ctr, dim in zip(centers, 'xyz'):
        getattr(ax1, 'set_{}lim'.format(dim))(ctr - r, ctr + r)
    ax1.set_axis_off()
    PolyArea = calc_csa(polys)
    ax2 = fig.add_subplot(222)
    ax2.plot(slices - slices[0], PolyArea)
    ax3 = fig.add_subplot(2, 2, 3)
    Im = amp.genIm()[0]
    ax3.imshow(Im, None)
    ax3.set_axis_off()
    ax4 = fig.add_subplot(2, 2, 4)
    amp.addActor(CMap=amp.CMapN2P)
    Im = amp.genIm()[0]
    ax4.imshow(Im, None)
    ax4.set_axis_off()
    plt.tight_layout()
    plt.show()
    return fig, (ax1, ax2, ax3, ax4)

def MeasurementsOut(amp, pos):
    maxZ = []
    for i in [0, 1, 2]:
        maxZ.append((amp.vert[:, i].astype(np.float64)).max() - (amp.vert[:, i].astype(np.float64)).min())
    axis = maxZ.index(max(maxZ))
    maxZ = np.float64(max(maxZ))
    zval = np.float64(pos[axis])
    slices = np.linspace(zval, (amp.vert[:, axis]).min() + 0.1, 6, dtype=np.float64)
    polys = create_slices(amp, slices, axis=axis)
    perimeter = calc_perimeter(polys)
    lngth = (slices - zval) / 10
    amp.genIm(out='fh', fh='lat.png', az=-90)
    amp.genIm(mag=1, out='fh', fh='ant.png')
    L = maxZ - ((amp.vert[:, axis]).max() - zval) - 10
    pL = np.linspace(0, 1.2, 13, dtype=np.float64)
    slices2 = []
    for i in pL:
        slices2.append((amp.vert[:, axis]).min() + 10 + (i * L))
    polys = create_slices(amp, slices2, axis=axis)
    PolyArea = calc_csa(polys)
    MLWidth, APWidth = calc_widths(polys)
    fig = plt.figure()
    fig.set_size_inches(7.5, 4.5)
    ax = fig.add_subplot(221)
    ax.plot(pL * 100, PolyArea)
    ax.set_xlabel("% length")
    ax.set_ylabel("Area (cm^2)")
    ax2 = fig.add_subplot(222)
    ax2.plot(pL * 100, MLWidth, 'ro', label='Medial-Lateral')
    ax2.plot(pL * 100, APWidth, 'b.', label='Anterior-Posterior')
    ax2.set_xlabel("% length")
    ax2.set_ylabel("Width (cm)")
    ax2.legend()
    fig.savefig("figure.png")
    return "figure.png"

def CMapOut(amp, colors):
    titles = ['Anterior', 'Medial', 'Proximal', 'Lateral']
    fig, axes = plt.subplots(ncols=5)
    cmap = clr.ListedColormap(colors, name='Amp')
    norm = clr.Normalize(vmin=-10, vmax=10)
    cb1 = clb.ColorbarBase(axes[-1], cmap=cmap, norm=norm)
    cb1.set_label('Shape deviation / mm')
    for i, ax in enumerate(axes[:-1]):
        im = amp.genIm(size=[3200, 8000], crop=True, az=i * 90)[0]
        ax.imshow(im)
        ax.set_title(titles[i])
        ax.set_axis_off()
    fig.set_size_inches([12.5, 4])
    plt.savefig("Limb Views.png", dpi=600)

