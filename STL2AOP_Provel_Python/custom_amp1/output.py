from PyPDF2 import PdfFileReader, PdfFileWriter
import pathlib
from pathlib import Path
from reportlab.pdfgen import canvas
import io
import os
import csv
import numpy as np

def getPDF(lngths, perimeters, CSA, APW, MLW):
    """
    Creates a PDF file containing information about the limb in correct
    locations on the page, then merges the PDF file with the existing template
    to create the output file.

    Returns
    -------
    The file path to the PDF
    """
    path = pathlib.Path(__file__).parent.absolute()
    my_file = Path(path, "Measurements Template.pdf")
    try:
        my_abs_path = my_file.resolve(strict=True)
    except FileNotFoundError:
        return 1 

    packet = io.BytesIO()
    c = canvas.Canvas(packet)
    for i in range(1, len(lngths) - 1):
        stringl = "{}".format(abs(round(lngths[i], 1)))
        stringp = "{}".format(abs(round(perimeters[i], 1)))
        c.drawString(360 + ((i - 1) * 27), 474 - ((i - 1) * 41.5), stringl)
        c.drawString(88, 524.5 - ((i - 1) * 74.5), stringp)

    stringmaxZ = "{}".format(abs(round(lngths[len(lngths) - 1], 1)))
    c.drawString(514, 419, stringmaxZ)
    c.setFont("Courier-Bold", 12)
    c.drawString(65, 575, "Perimeter / cm")
    c.drawString(400, 520, "Distance / cm")
    c.showPage()
    c.drawImage("ant.png", 38, 225, 256, 256)
    c.drawImage("lat.png", 300, 225, 256, 256)
    c.drawImage("figure.png", -2.5, -50, 334, 200)
    for i in range(1, len(CSA), 2):
        sCSA = "{}".format(round(CSA[i], 1))
        sAPW = "{}".format(round(APW[i], 1))
        sMLW = "{}".format(round(MLW[i], 1))
        c.drawString(403, 145 - ((i - 1) * 11.5), sCSA)
        c.drawString(465, 145 - ((i - 1) * 11.5), sAPW)
        c.drawString(520, 145 - ((i - 1) * 11.5), sMLW)
    c.save()
    packet.seek(0)
    newpdf = PdfFileReader(packet)

    template = PdfFileReader(open(os.path.join(path, "Measurements Template.pdf"), "rb"))
    t2 = PdfFileReader(open(os.path.join(path, "Output Template.pdf"), "rb"))
    output = PdfFileWriter()
    page = t2.getPage(0)
    page.mergePage(newpdf.getPage(1))
    page2 = template.getPage(0)
    page2.mergePage(newpdf.getPage(0))
    output.addPage(page)
    output.addPage(page2)

    output_file_path = os.path.join(get_downloads_folder(), "ampscanReport.pdf")
    with open(output_file_path, "wb") as outputStream:
        output.write(outputStream)

    return output_file_path

def get_downloads_folder():
    """Gets the downloads folder in a relatively platform independent way"""
    downloads_path = os.path.join(os.path.expanduser("~"), "Downloads")
    if not os.path.exists(downloads_path):  # If downloads folder doesn't exist, create it
        os.mkdir(downloads_path)
    return downloads_path

def generateRegBinsCsv(file, regObject, numBins, scalarMin, scalarMax):
    """
    Generates a CSV file output of scalar values put into bins
    :param file: The open file to save csv output to. Should be open with newline=''
    :param regObject: The reg object with scalar values
    :param numBins: Number of bins for scalar values
    :param scalarMin: The min scalar value to look for
    :param scalarMax: The max scalar value to look for
    :return: None
    """
    writer = csv.writer(file)

    binSize = (scalarMax - scalarMin) / numBins
    bins = np.zeros(numBins, dtype=np.int32)
    binValues = np.linspace(scalarMin, scalarMax, numBins, endpoint=False)
    
    for point in regObject.values:
        bin = int((point - scalarMin) / binSize)
        if bin < 0:
            bins[0] += 1
        elif bin >= len(bins):
            bins[-1] += 1
        else:
            bins[bin] += 1

    total_values = len(regObject.values)

    for i in range(numBins):
        writer.writerow([scalarMin + binSize * i, bins[i] / total_values])

def generateRegCsv(file, regObject):
    """
    Generates a CSV file output of scalar values put into bins
    :param file: The open file to save csv output to. Should be open with newline=''
    :param regObject: The reg object with scalar values
    :return: None
    """
    writer = csv.writer(file)
    for value in regObject.values:
        writer.writerow([value])

def generate_spec(file, regObject):
    """
    This function automatically generates specific output for the specified
    registration object.
    
    Parameters
    ----------
    regObject: AmpObject
        The registration object.

    Returns
    -------
    None    
    """
    absmean = np.mean(np.abs(regObject.values), dtype=np.float64)
    absstd = np.std(np.abs(regObject.values), dtype=np.float64)
    mean = np.mean(regObject.values, dtype=np.float64)
    std = np.std(regObject.values, dtype=np.float64)
    valuemin = np.min(regObject.values, dtype=np.float64)
    valuemax = np.max(regObject.values, dtype=np.float64)

    idxleft = np.where(regObject.vert[:, 0] >= 0)
    idxright = np.where(regObject.vert[:, 0] <= 0)
    valueleft = regObject.values[idxleft]
    valueright = regObject.values[idxright]
    meanleft = np.mean(valueleft, dtype=np.float64)
    stdleft = np.std(valueleft, dtype=np.float64)
    meanright = np.mean(valueright, dtype=np.float64)
    stdright = np.std(valueright, dtype=np.float64)

    gap = np.where(regObject.values > 0)[0]
    integratedgap = np.sum(regObject.values[gap], dtype=np.float64) / regObject.values.shape[0]
    gap_percentage = (gap.shape[0]) / (regObject.values.shape[0]) * 100
    pressure = np.where(regObject.values < -3)[0]
    integratedHP = np.sum(regObject.values[pressure], dtype=np.float64) / regObject.values.shape[0]
    pressure_percentage = (pressure.shape[0]) / (regObject.values.shape[0]) * 100

    outdict = {
        'mean distance': mean,
        'standard deviation': std,
        'minimum distance': valuemin,
        'maximum distance': valuemax,
        'mean absolute distance': absmean,
        'absolute standard deviation': absstd,
        'Left mean distance': meanleft,
        'Left standard deviation': stdleft,
        'Right mean distance': meanright,
        'Right standard deviation': stdright,
        'percentage of gap area': gap_percentage,
        'percentage of high pressure area': pressure_percentage,
        'percentage of area within range': 100 - pressure_percentage - gap_percentage,
        'integrated value of gap area': integratedgap,
        'integrated value of high pressure area': integratedHP
    }

    with open(os.getcwd() + file, 'w', newline='') as myfile:
        writer = csv.DictWriter(myfile, fieldnames=['Name', 'Value'])
        for key, value in outdict.items():
            writer.writerow({'Name': key, 'Value': value})

