// Import necessary libraries in Deno
import { PDFDocument, rgb } from "https://deno.land/x/pdf@1.4.0/mod.ts";
import { writeCSV } from "https://deno.land/x/csv/mod.ts";
import { ensureDirSync } from "https://deno.land/std/fs/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";

// Helper function to get downloads folder in Deno (cross-platform)
function getDownloadsFolder(): string {
	const home = Deno.env.get("HOME") || Deno.env.get("USERPROFILE");
	const downloadsPath = join(home!, "Downloads");
	ensureDirSync(downloadsPath); // Create downloads folder if it doesn't exist
	return downloadsPath;
}

// Function to generate a PDF file using pdf-lib
async function generatePDF(
	lngths: number[],
	perimeters: number[],
	CSA: number[],
	APW: number[],
	MLW: number[],
): Promise<string> {
	const downloadsPath = getDownloadsFolder();
	const outputPath = join(downloadsPath, "ampscanReport.pdf");

	// Load existing PDF templates
	const templateBytes = await Deno.readFile("Measurements Template.pdf");
	const outputTemplateBytes = await Deno.readFile("Output Template.pdf");

	const pdfDoc = await PDFDocument.load(templateBytes);
	const outputDoc = await PDFDocument.load(outputTemplateBytes);

	// Create a new page or modify the existing page
	const [templatePage] = await pdfDoc.copyPages(outputDoc, [0]);

	const page = pdfDoc.getPage(0);
	const font = await pdfDoc.embedFont("Courier-Bold");
	page.setFont(font);

	// Add custom drawings
	for (let i = 1; i < lngths.length - 1; i++) {
		const stringl = `${Math.abs(Math.round(lngths[i] * 10) / 10)}`;
		const stringp = `${Math.abs(Math.round(perimeters[i] * 10) / 10)}`;
		page.drawText(stringl, { x: 360 + (i - 1) * 27, y: 474 - (i - 1) * 41.5 });
		page.drawText(stringp, { x: 88, y: 524.5 - (i - 1) * 74.5 });
	}

	const stringMaxZ = `${Math.abs(Math.round(lngths[lngths.length - 1] * 10) / 10)}`;
	page.drawText(stringMaxZ, { x: 514, y: 419 });

	// Add images (you may need a compatible image processing method)
	const antImage = await pdfDoc.embedPng(await Deno.readFile("ant.png"));
	const latImage = await pdfDoc.embedPng(await Deno.readFile("lat.png"));
	const figureImage = await pdfDoc.embedPng(await Deno.readFile("figure.png"));

	page.drawImage(antImage, { x: 38, y: 225, width: 256, height: 256 });
	page.drawImage(latImage, { x: 300, y: 225, width: 256, height: 256 });
	page.drawImage(figureImage, { x: -2.5, y: -50, width: 334, height: 200 });

	for (let i = 1; i < CSA.length; i += 2) {
		const sCSA = `${Math.round(CSA[i] * 10) / 10}`;
		const sAPW = `${Math.round(APW[i] * 10) / 10}`;
		const sMLW = `${Math.round(MLW[i] * 10) / 10}`;
		page.drawText(sCSA, { x: 403, y: 145 - (i - 1) * 11.5 });
		page.drawText(sAPW, { x: 465, y: 145 - (i - 1) * 11.5 });
		page.drawText(sMLW, { x: 520, y: 145 - (i - 1) * 11.5 });
	}

	// Save the updated PDF
	const pdfBytes = await pdfDoc.save();
	await Deno.writeFile(outputPath, pdfBytes);

	return outputPath;
}

// Function to generate a CSV for regular bins
async function generateRegBinsCsv(
	file: string,
	regObject: any,
	numBins: number,
	scalarMin: number,
	scalarMax: number,
) {
	const binSize = (scalarMax - scalarMin) / numBins;
	const bins = new Array(numBins).fill(0);
	const binValues = Array.from(
		{ length: numBins },
		(_, i) => scalarMin + binSize * i,
	);

	regObject.values.forEach((point: number) => {
		const bin = Math.floor((point - scalarMin) / binSize);
		if (bin < 0) {
			bins[0]++;
		} else if (bin >= bins.length) {
			bins[bins.length - 1]++;
		} else {
			bins[bin]++;
		}
	});

	const totalValues = regObject.values.length;
	const csvData = binValues.map((val, i) => [val, bins[i] / totalValues]);

	const outputFilePath = join(Deno.cwd(), file);
	await writeCSV(outputFilePath, csvData);
}

// Function to generate a simple CSV for regObject values
async function generateRegCsv(file: string, regObject: any) {
	const csvData = regObject.values.map((value: number) => [value]);

	const outputFilePath = join(Deno.cwd(), file);
	await writeCSV(outputFilePath, csvData);
}

// Function to generate specific output for a registration object and write it to a CSV
async function generateSpec(file: string, regObject: any) {
	const absMean = Math.abs(
		regObject.values.reduce((a: number, b: number) => a + b) /
			regObject.values.length,
	);
	const absStd = Math.sqrt(
		regObject.values
			.map((x: number) => Math.pow(Math.abs(x) - absMean, 2))
			.reduce((a: number, b: number) => a + b) / regObject.values.length,
	);
	const mean =
		regObject.values.reduce((a: number, b: number) => a + b) /
		regObject.values.length;
	const std = Math.sqrt(
		regObject.values
			.map((x: number) => Math.pow(x - mean, 2))
			.reduce((a: number, b: number) => a + b) / regObject.values.length,
	);
	const valuemin = Math.min(...regObject.values);
	const valuemax = Math.max(...regObject.values);

	const outDict = {
		"mean distance": mean,
		"standard deviation": std,
		"minimum distance": valuemin,
		"maximum distance": valuemax,
		"mean absolute distance": absMean,
		"absolute standard deviation": absStd,
		// Add more properties as needed
	};

	const csvData = Object.entries(outDict).map(([key, value]) => [key, value]);

	const outputFilePath = join(Deno.cwd(), file);
	await writeCSV(outputFilePath, csvData);
}
