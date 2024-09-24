# -*- coding: utf-8 -*-
import numpy as np
import os
import struct

from ampscan.trim import trimMixin
from ampscan.smooth import smoothMixin
from ampscan.vis import visMixin

class CustomAmpObject(trimMixin, smoothMixin, visMixin):
    def __init__(self, data=None, stype='limb', unify=True, struc=True):
        self.stype = stype
        self.createCMap()
        self.landmarks = {}
        try:
            if isinstance(data, str):
                if data.lower().endswith('.aop'):
                    self.read_aop(data, unify, struc)
                else:
                    self.read_stl(data, unify, struc)
            elif isinstance(data, dict):
                for k, v in data.items():
                    setattr(self, k, v)
                if struc:
                    self.calcStruct()
            elif isinstance(data, bytes):
                self.read_bytes(data, unify, struc)
        except Exception as e:
            raise RuntimeError(f"Failed to initialize CustomAmpObject: {e}")

    def read_stl(self, filename, unify=True, struc=True):
        """
        Function to read .stl file from filename and import data into 
        the AmpObj 
        
        Parameters
        -----------
        filename: str 
            file path of the .stl file to read 
        unify: boolean, default True
            unify the coincident vertices of each face
        struc: boolean, default True
            Calculate the underlying structure of the mesh, such as edges
        """
        try:
            with open(filename, 'rb') as fh:
                HEADER_SIZE = 80
                COUNT_SIZE = 4
                data_type = np.dtype([('normals', np.float32, (3, )),
                                      ('vertices', np.float32, (9, )),
                                      ('atttr', '<i2', (1, ))])
                head = fh.read(HEADER_SIZE).lower()
                NFaces, = struct.unpack('@i', fh.read(COUNT_SIZE))
                data = np.fromfile(fh, data_type)
    
            # Enhanced ASCII detection
            if str(head[:5], 'utf-8') == 'solid' and len(data) == 0:
                raise ValueError("ASCII files not supported")
    
            if len(data) == 0:
                raise ValueError("File is empty or corrupt")
            elif len(data) != NFaces:
                raise ValueError(f"File is corrupt: Number of faces mismatch (Expected: {NFaces}, Found: {len(data)})")
    
            vert = np.resize(np.array(data['vertices'], dtype=np.float64), (NFaces*3, 3))
            norm = np.array(data['normals'], dtype=np.float64)
            faces = np.reshape(np.arange(NFaces*3), [NFaces, 3])
            self.faces = faces
            self.vert = vert
            self.norm = norm
    
            if unify:
                self.unifyVert()
            if struc:
                self.calcStruct()
            self.values = np.zeros([len(self.vert)], dtype=np.float64)
            
            # Additional check for zero height
            if np.all(self.vert[:, 2] == 0):
                raise ValueError("Mesh height is zero. Possible invalid STL file. Ensure units are in millimeters.")
    
        except Exception as e:
            raise RuntimeError(f"Error reading STL file '{filename}': {e}")

    def read_bytes(self, data, unify=True, struc=True):
        try:
            HEADER_SIZE = 80
            COUNT_SIZE = 4
            data_type = np.dtype([('normals', np.float32, (3, )),
                                  ('vertices', np.float32, (9, )),
                                  ('atttr', '<i2', (1, ))])
            head = data[:HEADER_SIZE].lower()
            NFaces, = struct.unpack('@i', data[HEADER_SIZE:HEADER_SIZE+COUNT_SIZE])
            data = np.frombuffer(data[COUNT_SIZE+HEADER_SIZE:], data_type)

            if str(head[:5], 'utf-8') == 'solid' and len(data) == 0:
                raise ValueError("ASCII files not supported")

            if len(data) == 0:
                raise ValueError("File is empty or corrupt")
            elif len(data) != NFaces:
                raise ValueError(f"File is corrupt: Number of faces mismatch (Expected: {NFaces}, Found: {len(data)})")

            vert = np.resize(np.array(data['vertices'], dtype=np.float64), (NFaces*3, 3))
            norm = np.array(data['normals'], dtype=np.float64)
            faces = np.reshape(np.arange(NFaces*3), [NFaces, 3])
            self.faces = faces
            self.vert = vert
            self.norm = norm

            if unify:
                self.unifyVert()
            if struc:
                self.calcStruct()
            self.values = np.zeros([len(self.vert)], dtype=np.float64)

            # Additional check for zero height
            if np.all(self.vert[:, 2] == 0):
                raise ValueError("Mesh height is zero. Possible invalid STL file.")

        except Exception as e:
            raise RuntimeError(f"Error reading STL data from bytes: {e}")

    def calcStruct(self, norm=True, edges=True, edgeFaces=True, faceEdges=True, vNorm=False):
        if norm:
            self.calcNorm()
        if edges:
            self.calcEdges()
        if edgeFaces:
            self.calcEdgeFaces()
        if faceEdges:
            self.calcFaceEdges()
        if vNorm:
            self.calcVNorm()

    def getVert(self):
        return self.vert

    def unifyVert(self):
        self.vert, indC = np.unique(self.vert, return_inverse=True, axis=0)
        self.faces = np.resize(indC[self.faces], (len(self.norm), 3)).astype(np.int64)

    def calcEdges(self):
        self.edges = np.reshape(self.faces[:, [0, 1, 0, 2, 1, 2]], [-1, 2])
        self.edges = np.sort(self.edges, 1)
        self.edges, indC = np.unique(self.edges, return_inverse=True, axis=0)

    def calcEdgeFaces(self):
        edges = np.reshape(self.faces[:, [0, 1, 0, 2, 1, 2]], [-1, 2])
        edges = np.sort(edges, 1)
        edges, indC = np.unique(edges, return_inverse=True, axis=0)
        self.edgesFace = np.reshape(np.arange(len(self.faces)*3), [-1, 3])
        self.edgesFace = indC[self.edgesFace].astype(np.int64)

    def calcFaceEdges(self):
        self.faceEdges = np.empty([len(self.edges), 2], dtype=np.int64)
        self.faceEdges.fill(-99999)
        fInd = np.repeat(np.arange(len(self.faces)), 3)
        eF = np.reshape(self.edgesFace, [-1])
        eFInd = np.unique(eF, return_index=True)[1]
        logic = np.zeros([len(eF)], dtype=bool)
        logic[eFInd] = True
        self.faceEdges[eF[logic], 0] = fInd[logic]
        self.faceEdges[eF[~logic], 1] = fInd[~logic]

    def calcNorm(self):
        norms = np.cross(self.vert[self.faces[:,1]].astype(np.float64) - self.vert[self.faces[:,0]].astype(np.float64),
                         self.vert[self.faces[:,2]].astype(np.float64) - self.vert[self.faces[:,0]].astype(np.float64))
        mag = np.linalg.norm(norms, axis=1)
        self.norm = np.divide(norms, mag[:, None])

    def fixNorm(self):
        fC = self.vert[self.faces].mean(axis=1)
        cent = self.vert.mean(axis=0)
        polarity = np.einsum('ij, ij->i', fC - cent, self.norm) < 0
        for i, f in enumerate(self.faces):
            if polarity[i]:
                self.faces[i, :] = [f[0], f[2], f[1]]

        self.calcNorm()
        if hasattr(self, 'vNorm'):
            self.calcVNorm()

    def calcVNorm(self):
        f = self.faces.flatten()
        o_idx = f.argsort()
        row, col = np.unravel_index(o_idx, self.faces.shape)
        ndx = np.searchsorted(f[o_idx], np.arange(self.vert.shape[0]), side='right')
        ndx = np.r_[0, ndx]
        norms = self.norm[row, :]
        self.vNorm = np.zeros(self.vert.shape, dtype=np.float64)
        for i in range(self.vert.shape[0]):
            self.vNorm[i, :] = np.nanmean(norms[ndx[i]:ndx[i+1], :], axis=0)

    def save(self, filename):
        self.calcNorm()
        fv = self.vert[np.reshape(self.faces, len(self.faces)*3)]
        with open(filename, 'wb') as fh:
            header = '%s' % (filename)
            header = header.split('/')[-1].encode('utf-8')
            header = header[:80].ljust(80, b' ')
            packed = struct.pack('@i', len(self.faces))
            fh.write(header)
            fh.write(packed)
            data_type = np.dtype([('normals', np.float64, (3, )),
                                  ('vertices', np.float64, (9, )),
                                  ('atttr', '<i2', (1, ))])
            data_write = np.zeros(len(self.faces), dtype=data_type)
            data_write['normals'] = self.norm
            data_write['vertices'] = np.reshape(fv, (len(self.faces), 9))
            data_write.tofile(fh)

    @staticmethod
    def rotMatrix(rot, ang='rad'):
        if not isinstance(rot, (tuple, list, np.ndarray)):
            raise TypeError("Expecting array-like rotation, but found: "+type(rot))
        elif len(rot) != 3:
            raise ValueError("Expecting 3 arguments but found: {}".format(len(rot)))

        if ang not in ('rad', 'deg'):
            raise ValueError("Ang expected 'rad' or 'deg' but {} was found".format(ang))

        if ang == 'deg':
            rot = np.deg2rad(rot)

        [angx, angy, angz] = rot
        Rx = np.array([[1, 0, 0],
                       [0, np.cos(angx), -np.sin(angx)],
                       [0, np.sin(angx), np.cos(angx)]], dtype=np.float64)
        Ry = np.array([[np.cos(angy), 0, np.sin(angy)],
                       [0, 1, 0],
                       [-np.sin(angy), 0, np.cos(angy)]], dtype=np.float64)
        Rz = np.array([[np.cos(angz), -np.sin(angz), 0],
                       [np.sin(angz), np.cos(angz), 0],
                       [0, 0, 1]], dtype=np.float64)
        R = np.dot(np.dot(Rz, Ry), Rx)
        return R

    def translate(self, trans):
        if isinstance(trans, (list, np.ndarray, tuple)):
            if len(trans) == 3:
                self.vert[:] += np.array(trans, dtype=np.float64)
            else:
                raise ValueError("Translation has incorrect dimensions. Expected 3 but found: " + str(len(trans)))
        else:
            raise TypeError("Translation is not array_like: " + trans)

    def rotateAng(self, rot, ang='rad', norms=True):
        if ang not in ('rad', 'deg'):
            raise ValueError("Ang expected 'rad' or 'deg' but {} was found".format(ang))

        if isinstance(rot, (tuple, list, np.ndarray)):
            R = self.rotMatrix(rot, ang)
            self.rotate(R, norms)
        else:
            raise TypeError("rotateAng requires a list")

    def rotate(self, R, norms=True):
        if isinstance(R, (list, tuple)):
            R = np.array(R, np.float64)
        elif not isinstance(R, np.ndarray):
            raise TypeError("Expected R to be array-like but found: " + str(type(R)))
        if len(R) != 3 or len(R[0]) != 3:
            if isinstance(R, np.ndarray):
                raise ValueError("Expected 3x3 array, but found: {}".format(R.shape))
            else:
                raise ValueError("Expected 3x3 array, but found: 3x"+str(len(R)))
        self.vert[:, :] = np.dot(self.vert, R.T)
        if norms:
            self.norm[:, :] = np.dot(self.norm, R.T)
            if hasattr(self, 'vNorm'):
                self.vNorm[:, :] = np.dot(self.vNorm, R.T)