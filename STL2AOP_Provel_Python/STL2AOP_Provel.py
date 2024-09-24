# -*- coding: utf-8 -*-

"""
This script is designed to handle operations on STL files and convert them into AOP format, including validation,
rotation, slicing, perimeter calculations, and in-memory handling of the AOP data. It is implemented using Python 3.8.16
on a 64-bit Windows system.

Modules and dependencies:
- 'logging' for logging messages at various levels of severity.
- 'os' for interacting with the file system.
- 'numpy' for numerical operations, particularly in handling arrays.
- 'math' for mathematical functions not covered by numpy.
- 'struct' for interpreting binary data packed as bytes.
- 'custom_amp1.custom_amp_object' for handling custom operations specific to the AMP object model.

Key Functionalities:
1. Rotate STL models: Provides functionalities for both clockwise (rotate_cw) and counterclockwise (rotate_ccw) rotation,
   pre-configured for easy integration into larger workflows or direct use in projects requiring 90-degree rotations.
2. Check STL file format: Determines if the STL file is in binary format.
3. Convert ASCII to Binary STL: Converts STL files from ASCII to binary format for compatibility or performance reasons.
4. Fix STL Files: Validates and fixes STL files by re-saving them in a valid format.
5. Calculate Perimeter: Computes the perimeter of polygons, essential in 3D modeling and manufacturing.
6. STL Processing: Main function orchestrates the loading, validating, rotating, slicing, and saving of the model in AOP format.
7. In-Memory AOP Handling: Optionally retains the AOP data in memory rather than saving it to a file, enabling further processing within the script or integration into larger applications.

Additional details:
- Configurable parameters such as the path to the STL file, slice height, number of spokes, adaptive slicing toggle, and whether to save the AOP file or keep it in memory.
- Extensive use of logging to capture the workflow and errors at various stages of file handling and processing.
- The script supports complex geometric operations such as slicing 3D models and calculating perimeters, crucial for applications in orthotics and prosthetics where precise measurements are vital.
- Adaptive slicing can be enabled for varying slice thickness based on model complexity.
- A flag (`save_aop_flag`) is provided to control whether the AOP file is saved to disk or retained in memory for further processing.

Example Usage:
To process an STL file and convert it to AOP format, adjust the parameters like 'stl_file_path', 'slice_height', 'spokes', 'adaptive_slicing', and 'save_aop_flag' as needed, then run the script in a Python environment where all dependencies are installed.

Note:
The custom module 'custom_amp1.custom_amp_object' should be properly installed and accessible in the Python environment where this script is executed. This module presumably contains specialized classes and functions for handling specific AMP objects, crucial for the script’s operations.

For detailed operation and integration into larger workflows, consider setting up appropriate environment variables, error handling mechanisms, and ensuring compatibility with other Python packages used in your project.
"""


# import sys
# sys.path.append('./custom_amp1')

import logging
import os
import numpy as np
import math
import struct
from custom_amp1.custom_amp_object import CustomAmpObject


# User Configurable Parameters
# Update the variable below with the absolute path to your STL file
stl_file_path = r"./test_stl_file.stl"
slice_height = 1.0  # Slice pitch in mm
spokes = 120  # Number of points per slice
adaptive_slicing = False  # Enable adaptive slicing most likely not needed for the application
save_aop_flag = False  # Set to False to keep AOP data in memory, True to save to file

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

def is_binary_stl(file_path):
    """Check if the STL file is binary."""
    try:
        with open(file_path, 'rb') as file:
            header = file.read(80)
            file_size = os.path.getsize(file_path)
            num_triangles = struct.unpack('I', file.read(4))[0]
            expected_size = 80 + 4 + num_triangles * 50
            return file_size == expected_size
    except struct.error as e:
        logging.error(f"Error reading STL file: {e}")
        return False
    except Exception as e:
        logging.error(f"Unexpected error reading STL file: {e}")
        return False

def convert_ascii_to_binary(input_file, output_file):
    """Convert an ASCII STL file to binary format."""
    try:
        with open(input_file, 'r') as ascii_stl, open(output_file, 'wb') as binary_stl:
            header = b'Converted from ASCII to binary' + b'\0' * (80 - len('Converted from ASCII to binary'))
            binary_stl.write(header)

            triangles = []
            for line in ascii_stl:
                if line.strip().startswith("vertex"):
                    vertex = list(map(float, line.strip().split()[1:]))
                    triangles.append(vertex)

            if len(triangles) % 3 != 0:
                logging.error("Error: STL file does not have a valid number of vertices (must be a multiple of 3).")
                return False

            num_triangles = len(triangles) // 3
            binary_stl.write(struct.pack('I', num_triangles))

            for i in range(num_triangles):
                normal = [0.0, 0.0, 0.0]
                v1 = triangles[i * 3]
                v2 = triangles[i * 3 + 1]
                v3 = triangles[i * 3 + 2]
                binary_stl.write(struct.pack('fff', *normal))
                binary_stl.write(struct.pack('fff', *v1))
                binary_stl.write(struct.pack('fff', *v2))
                binary_stl.write(struct.pack('fff', *v3))
                binary_stl.write(struct.pack('H', 0))

            logging.info("ASCII STL file converted to binary format.")
            return True
    except Exception as e:
        logging.error(f"Error converting STL file: {e}")
        return False


def calc_perimeter(polys):
    """Calculate the perimeter of polygons."""
    perimeter = np.zeros(len(polys))
    for i, p in enumerate(polys):
        if p.size == 0:
            continue
        d = p[1:, :] - p[:-1, :]
        dist = np.linalg.norm(d, axis=1)
        loop_dist = np.linalg.norm(p[0, :] - p[-1, :])
        perimeter[i] = dist.sum() + loop_dist
    return perimeter

def align_distal_centroid(base):
    """Align the distal centroid to the center."""
    minZ = base.getVert()[:, 2].min()
    maxZ = base.getVert()[:, 2].max()
    totZ = maxZ - minZ

    # Calculate shifts for distal centroid alignment
    distVLog = base.getVert()[:, 2] < (minZ + (totZ * 0.05))
    if len(base.getVert()[distVLog, 0]) > 0:
        xShift = base.getVert()[distVLog, 0].mean()
    else:
        xShift = 0

    if len(base.getVert()[distVLog, 1]) > 0:
        yShift = base.getVert()[distVLog, 1].mean()
    else:
        yShift = 0

    # Translate the model so that the distal centroid is centered at (0, 0)
    base.translate([-xShift, -yShift, -minZ])

class CustomAmpObject(CustomAmpObject):

    def save_aop(self, filename=None, slices=100, spokes=72, sliceInterval=None, 
                 spokeInterval=None, closeEnd=True, side=None, 
                 adaptive=False, comments=None, landmarks=False, returnVerts=False, save_aop_flag=True):
        
        minZ = self.getVert()[:, 2].min()
        maxZ = self.getVert()[:, 2].max()
        totZ = maxZ - minZ
    
        if sliceInterval is not None:
            slices = math.floor(totZ / sliceInterval)
    
        if spokeInterval is not None:
            spokes = math.floor(360 / spokeInterval)
    
        # Always perform the alignment
        distVLog = self.getVert()[:, 2] < (minZ + (totZ * 0.05))
        if len(self.getVert()[distVLog, 0]) > 0:
            xShift = self.getVert()[distVLog, 0].mean()
        else:
            xShift = 0
        
        if len(self.getVert()[distVLog, 1]) > 0:
            yShift = self.getVert()[distVLog, 1].mean()
        else:
            yShift = 0
    
        # Continue with the rest of the method
        delta = 0.001
        ind = 0
        polys = []
        while not polys:
            minSl = minZ + (totZ * ind * delta)
            polys = create_slices(self, [minSl], typ='slices', axis=2)
            ind += 1
            if ind > 1000:
                raise RuntimeError(
                    "Error loop detected after 1000 iterations. Recommended action: "
                    "open the STL file in a 3D modeling tool and export (or resave) it, "
                    "and try again.\n"
                )
        ind = 0
        polys = []
        while not polys:
            maxSl = maxZ - (totZ * ind * delta)
            polys = create_slices(self, [maxSl], typ='slices', axis=2)
            ind += 1
            if ind > 1000:
                raise RuntimeError(
                    "Error loop detected after 1000 iterations. Recommended action: "
                    "open the STL file in a 3D modeling tool like Meshmixer, export (or resave) it, "
                    "and try again.\n"
                )
                
        lines = [
            "AAOP1\n",
            "Copyright © 2024 Provel Inc.\n",
            "This software utilizes various libraries, from Python and Ampscan, to convert STL files to the AOP format.\n",
            "For detailed license information and acknowledgments, please refer to the license section of this software installation.\n",
            "If you have any questions or concerns, please visit our website at Provel.us.\n",
            "END COMMENTS\n",
            "CYLINDRICAL\n",
        ]
        if side is None:
            lines.append("NONE\n")
        else:
            lines.append("%s\n" % side)
        if landmarks is True:
            landmarks = self.getLandmarks()
        elif landmarks is False:
            landmarks = {}
        nLand = len(landmarks)
        lines.append("%i\n" % nLand)
        for landmark, points in landmarks.items():
            lines.append("%s\n" % landmark)
            nPoints = points.shape[0]
            lines.append("%i\n" % nPoints)
            for x, y, z in points:
                r = ((x ** 2) + (y ** 2)) ** 0.5
                t = np.rad2deg(np.atan2(y, x))
                z -= minZ
                lines.append("%f\n" % r)
                lines.append("%f\n" % t)
                lines.append("%f\n" % z)

        if isinstance(spokes, int):
            spacing = (360) / spokes
            spokes = np.arange(-90, 270, spacing)
            nSpokes = len(spokes)
            lines.append("%i\n" % nSpokes)
            lines.append("%f\n" % spacing)
        else:
            spacing = 0
            nSpokes = len(spokes)
            lines.append("%i\n" % nSpokes)
            lines.append("%i\n" % spacing)
            for spoke in spokes:
                lines.append("%f\n" % spoke)

        if isinstance(slices, int):
            slices, spacing = np.linspace(minSl, maxSl, slices, retstep=True)
            nSlices = len(slices)
        else:
            spacing = 0
            nSlices = len(slices)

        if adaptive:
            minSliceDiff = 0.1
            maxDelta = 0.02
            maxiter = 20
            spacing = 0
            polys = create_slices(self, slices, typ='slices', axis=2)
            csa = calc_perimeter(polys)
            sliceSpacing = np.diff(slices)
            delta = np.abs(np.diff(csa) / csa[1:])
            iteration = 0
            while (delta > maxDelta).any() and (sliceSpacing > minSliceDiff).all() and iteration < maxiter:
                idx = np.argmax(delta)
                slices = np.insert(slices, idx + 1, (slices[idx] + slices[idx + 1]) / 2)
                polys = create_slices(self, slices, typ='slices', axis=2)
                csa = calc_perimeter(polys)
                sliceSpacing = np.diff(slices)
                delta = np.abs(np.diff(csa) / csa[1:])
                iteration += 1

        nSlices = len(slices)

        lines.append("%i\n" % nSlices)
        if spacing == 0:
            lines.append("%i\n" % spacing)
            for sl in slices:
                lines.append("%f\n" % (sl - slices[0]))
        else:
            lines.append("%f\n" % spacing)

        polys = create_slices(self, slices, typ='slices', axis=2)

        totPoints = len(spokes) * len(slices)
        vId = 0
        verts = np.zeros([totPoints, 3])

        if closeEnd:
            polys.pop(0)
            for i in range(len(spokes)):
                lines.append("%f\n" % 0)
                verts[vId, :] = [0, spokes[i], 0]
                vId += 1

        for i, p in enumerate(polys):
            x = p[:-1, 0] - xShift
            y = p[:-1, 1] - yShift
            z = slices[i] - minSl
            rPoly = ((x ** 2) + (y ** 2)) ** 0.5
            tPoly = np.rad2deg(np.arctan2(y, x))
            idx = tPoly < 0
            rPoly = np.append(rPoly, rPoly[idx])
            tPoly = np.append(tPoly, tPoly[idx] + 360)
            idx = np.argsort(tPoly)
            rPoly = rPoly[idx]
            tPoly = tPoly[idx]
            rs = np.interp(spokes, tPoly, rPoly)
            rs = np.flip(rs)
            for j, r in enumerate(rs):
                lines.append("%f\n" % r)
                verts[vId, :] = [r, spokes[j], z]
                vId += 1

        if save_aop_flag:
            with open(filename, 'w') as f:
                f.writelines(lines)
            logging.info(f"File saved successfully as {filename}")
        else:
            return lines  # Return the AOP data in-memory

        if returnVerts:
            return verts


def rotate_all(models, rotation_angles, ang='deg'):
    """Rotate all models by the specified angles."""
    for model in models:
        model.rotateAng(rotation_angles, ang)

def create_slices(amp, *args, typ='slices', axis=2, order=True):
    """Create slices from the model."""
    if typ == 'slices':
        slices = args[0]
    elif typ == 'real_intervals':
        lim = args[0]
        intervals = args[1]
        slices = np.arange(lim[0], lim[1], intervals)
        slices = np.append(slices, lim[1])

    elif typ == 'norm_intervals':
        limb_min = amp.vert[:, axis].min()
        limb_max = amp.vert[:, axis].max()
        limb_len = limb_max - limb_min
        lim = args[0]
        intervals = args[1]
        slices = np.arange(lim[0], lim[1], intervals)
        slices = np.append(slices, lim[1])
        slices = limb_min + (slices * limb_len)
    else:
        return []

    vE = amp.vert[:, axis][amp.edges]
    polys = []
    for plane in slices:
        try:
            if vE.size == 0:
                continue

            ind = vE <= plane
            validEdgeInd = np.where(np.logical_xor(ind[:, 0], ind[:, 1]))[0]
            if validEdgeInd.size == 0:
                continue

            validfE = amp.faceEdges[validEdgeInd, :].astype(np.int64)
            faceOrder = logEuPath(validfE)
            validEdges = amp.edgesFace[faceOrder, :]
            edges = validEdges[np.isin(validEdges, validEdgeInd)].reshape([-1, 2])
            e = edges.flatten()
            sortE = []
            for ed in e:
                if ed not in sortE:
                    sortE.append(ed)
            sortE.append(sortE[0])
            sortE = np.asarray(sortE, dtype=np.int64)
            polyEdge = amp.edges[sortE]
            EdgePoints = np.c_[amp.vert[polyEdge[:, 0], :], amp.vert[polyEdge[:, 1], :]]
            polys.append(planeEdgeintersect(EdgePoints, plane, axis))
        except IndexError:
            continue
        except Exception as e:
            logging.error(f"Error creating slices: {e}")
            continue
    return polys

def planeEdgeintersect(edges, plane, axis=2):
    """Find intersection points between the plane and edges."""
    intersectPoints = np.zeros((edges.shape[0], 3))
    intersectPoints[:, axis] = plane
    axesInd = np.array([0, 1, 2])[np.array([0, 1, 2]) != axis]
    for i in axesInd:
        intersectPoints[:, i] = (edges[:, i] +
                                 (plane - edges[:, axis]) *
                                 (edges[:, i + 3] - edges[:, i]) /
                                 (edges[:, axis + 3] - edges[:, axis]))
    return intersectPoints

def logEuPath(arr):
    """Determine the order of faces based on their edges."""
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


# Main function for STL processing
def process_stl_file(stl_file_path, slice_height=1.0, spokes=120, adaptive_slicing=False, save_aop_flag=False):
    """Main processing function for STL files."""
    if not os.path.exists(stl_file_path):
        logging.error("STL file not found at the specified path.")
        return

    if not is_binary_stl(stl_file_path):
        logging.error("Error: The ASCII STL file is empty or corrupt. Skipping conversion to binary.")
        return  # Stop processing if the file is not valid

    try:
        base = CustomAmpObject(stl_file_path)
        logging.info("STL file loaded successfully.")
    except ValueError as e:
        logging.error(f"Failed to initialize CustomAmpObject: {e}")
        return
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        return

    # Align the distal centroid before processing
    align_distal_centroid(base)

    rotate_all([base], [0, 0, 90], ang='deg')  # Example of applying a 90-degree rotation

    minZ = base.getVert()[:, 2].min()
    maxZ = base.getVert()[:, 2].max()
    total_model_height = maxZ - minZ

    if slice_height > total_model_height:
        logging.error(f"Error: Slice pitch ({slice_height:.2f} mm) exceeds the total model height ({total_model_height:.2f} mm).")
        return

    # Fine slicing check
    finer_resolution = 0.1  # in mm
    fine_slicing_height = 5.0  # in mm
    fine_slices = np.arange(minZ, minZ + fine_slicing_height, finer_resolution)
    valid_fine_slices = []
    desired_start_height = minZ

    initial_slice = create_slices(base, [minZ], typ='slices', axis=2)
    if len(initial_slice) > 0:
        valid_fine_slices.append(minZ)
    else:
        for z in fine_slices:
            slice = create_slices(base, [z], typ='slices', axis=2)
            if len(slice) > 0:
                valid_fine_slices.append(z)
                desired_start_height = z
                break
    
        if not valid_fine_slices:
            desired_start_height = minZ + fine_slicing_height

    num_slices = int((maxZ - desired_start_height) // slice_height)
    regular_slices = np.arange(desired_start_height, desired_start_height + num_slices * slice_height + slice_height, slice_height)

    if regular_slices[-1] > maxZ:
        regular_slices = regular_slices[:-1]

    slices = np.concatenate((valid_fine_slices, regular_slices))

    valid_slices = []
    for z in slices:
        slice = create_slices(base, [z], typ='slices', axis=2)
        if len(slice) > 0:
            valid_slices.append(z)

    valid_slices = np.unique(valid_slices)

    # Extract base name and output directory
    base_name = os.path.splitext(os.path.basename(stl_file_path))[0]
    output_dir = os.path.dirname(stl_file_path)

    # Capture the AOP data in memory or save to file based on the flag
    aop_data = base.save_aop(filename=f"{output_dir}/{base_name}_CONV.aop" if save_aop_flag else None, 
                             slices=valid_slices, spokes=spokes, closeEnd=False, adaptive=adaptive_slicing, 
                             save_aop_flag=save_aop_flag)
    
    if not save_aop_flag:
        # AOP data is now in memory and can be further processed
        logging.info("AOP data is being handled in memory.")
        # Do something with aop_data here if needed

    logging.info(f"Process completed for {stl_file_path}")

if __name__ == "__main__":
    process_stl_file(stl_file_path, slice_height, spokes, adaptive_slicing, save_aop_flag)

