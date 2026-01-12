import { db } from "./db";

export const getLockDepth = async () => {
	const lockDepth = await db.appSettings
		.where("name")
		.equals("lockDepth")
		.first();
	return Number(lockDepth.value);
};

export const getCircularSegments = async () => {
	const circularSegments = await db.appSettings
		.where("name")
		.equals("circularSegments")
		.first();

	return Number(circularSegments.value);
};

export const setCircularSegments = async (circularSegments: number) => {
	return await db.appSettings
		.where("name")
		.equals("circularSegments")
		.modify({ value: circularSegments });
};

export const updateTranslateValues = async (
	translateX: number,
	translateY: number,
	translateZ: number,
) => {
	await Promise.all([
		db.appSettings
			.where("name")
			.equals("translateX")
			.modify({ value: translateX }),
		db.appSettings
			.where("name")
			.equals("translateY")
			.modify({ value: translateY }),
		db.appSettings
			.where("name")
			.equals("translateZ")
			.modify({ value: translateZ }),
	]);
};

export const getTranslateValues = async () => {
	const translateX = await db.appSettings
		.where("name")
		.equals("translateX")
		.first();
	const translateY = await db.appSettings
		.where("name")
		.equals("translateY")
		.first();
	const translateZ = await db.appSettings
		.where("name")
		.equals("translateZ")
		.first();

	return {
		x: Number(translateX.value),
		y: Number(translateY.value),
		z: Number(translateZ.value),
	};
};

export const updateRotateValues = async (
	rotateCoronal: number,
	rotateSagittal: number,
	rotateTransverse: number,
) => {
	await Promise.all([
		db.appSettings
			.where("name")
			.equals("rotateCoronal")
			.modify({ value: rotateCoronal }),
		db.appSettings
			.where("name")
			.equals("rotateSagittal")
			.modify({ value: rotateSagittal }),
		db.appSettings
			.where("name")
			.equals("rotateTransverse")
			.modify({ value: rotateTransverse }),
	]);
};

export const getRotateValues = async () => {
	const rotateCoronal = await db.appSettings
		.where("name")
		.equals("rotateCoronal")
		.first();
	const rotateSagittal = await db.appSettings
		.where("name")
		.equals("rotateSagittal")
		.first();
	const rotateTransverse = await db.appSettings
		.where("name")
		.equals("rotateTransverse")
		.first();

	return {
		coronal: Number(rotateCoronal.value),
		sagittal: Number(rotateSagittal.value),
		transverse: Number(rotateTransverse.value),
	};
};

export const getStartingCupLayerHeight = async () => {
	const startingCupLayerHeight = await db.appSettings
		.where("name")
		.equals("startingCupLayerHeight")
		.first();
	return Number(startingCupLayerHeight.value);
};

export const getLineWidthAdjustment = async () => {
	const lineWidthAdjustment = await db.appSettings
		.where("name")
		.equals("lineWidthAdjustment")
		.first();
	return Number(lineWidthAdjustment.value);
};

export const setStartingCupLayerHeight = async (
	startingCupLayerHeight: number,
) => {
	return await db.appSettings
		.where("name")
		.equals("startingCupLayerHeight")
		.modify({ value: startingCupLayerHeight });
};

export const setLineWidthAdjustment = async (lineWidthAdjustment: number) => {
	return await db.appSettings
		.where("name")
		.equals("lineWidthAdjustment")
		.modify({ value: lineWidthAdjustment });
};

export const getTestCylinderHeight = async () => {
	const testCylinderHeight = await db.appSettings
		.where("name")
		.equals("testCylinderHeight")
		.first();
	return Number(testCylinderHeight.value);
};

export const setTestCylinderHeight = async (testCylinderHeight: number) => {
	return await db.appSettings
		.where("name")
		.equals("testCylinderHeight")
		.modify({ value: testCylinderHeight });
};

export const getTestCylinderDiameter = async () => {
	const testCylinderDiameter = await db.appSettings
		.where("name")
		.equals("testCylinderDiameter")
		.first();
	return Number(testCylinderDiameter.value);
};

export const settestCylinderDiameter = async (testCylinderDiameter: number) => {
	return await db.appSettings
		.where("name")
		.equals("testCylinderDiameter")
		.modify({ value: testCylinderDiameter });
};

export const getSecondsPerLayer = async (): Promise<number> => {
	const secondsPerLayer = await db.appSettings
		.where("name")
		.equals("secondsPerLayer")
		.first();
	return Number(secondsPerLayer.value);
};

export const setSecondsPerLayer = async (secondsPerLayer: number) => {
	return await db.appSettings
		.where("name")
		.equals("secondsPerLayer")
		.modify({ value: secondsPerLayer });
};

export const getEPerRevolution = async (): Promise<number> => {
	const ePerRevolution = await db.appSettings
		.where("name")
		.equals("ePerRevolution")
		.first();
	return Number(ePerRevolution.value);
};

export const setEPerRevolution = async (ePerRevolution: number) => {
	return await db.appSettings
		.where("name")
		.equals("ePerRevolution")
		.modify({ value: ePerRevolution });
};
