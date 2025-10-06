import { getDb } from "./getDb";

export const getLockDepth = async () => {
	const db = await getDb();
	const lockDepth = await db.appSettings
		.where("name")
		.equals("lockDepth")
		.first();
	return Number(lockDepth.value);
};

export const getCircularSegments = async () => {
	const db = await getDb();
	const circularSegments = await db.appSettings
		.where("name")
		.equals("circularSegments")
		.first();

	return Number(circularSegments.value);
};

export const setCircularSegments = async (circularSegments: number) => {
	const db = await getDb();

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
	const db = await getDb();

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
	const db = await getDb();
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
	const db = await getDb();

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
	const db = await getDb();
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

export const getIsTestSTLCylinder = async () => {
	const db = await getDb();
	const isTestSTLCylinder = await db.appSettings
		.where("name")
		.equals("isTestSTLCylinder")
		.first();
	return isTestSTLCylinder.value as boolean;
};

export const setIsTestSTLCylinder = async (isTestSTLCylinder: boolean) => {
	const db = await getDb();

	return await db.appSettings
		.where("name")
		.equals("isTestSTLCylinder")
		.modify({ value: isTestSTLCylinder });
};

export const getStartingCupLayerHeight = async () => {
	const db = await getDb();
	const startingCupLayerHeight = await db.appSettings
		.where("name")
		.equals("startingCupLayerHeight")
		.first();
	return Number(startingCupLayerHeight.value);
};

export const getExtrusionAdjustment = async () => {
	const db = await getDb();
	const extrusionAdjustment = await db.appSettings
		.where("name")
		.equals("extrusionAdjustment")
		.first();
	return Number(extrusionAdjustment.value);
};

export const getLineWidthAdjustment = async () => {
	const db = await getDb();
	const lineWidthAdjustment = await db.appSettings
		.where("name")
		.equals("lineWidthAdjustment")
		.first();
	return Number(lineWidthAdjustment.value);
};

export const setStartingCupLayerHeight = async (
	startingCupLayerHeight: number,
) => {
	const db = await getDb();

	return await db.appSettings
		.where("name")
		.equals("startingCupLayerHeight")
		.modify({ value: startingCupLayerHeight });
};

export const setExtrusionAdjustment = async (extrusionAdjustment: number) => {
	const db = await getDb();

	return await db.appSettings
		.where("name")
		.equals("extrusionAdjustment")
		.modify({ value: extrusionAdjustment });
};

export const setLineWidthAdjustment = async (lineWidthAdjustment: number) => {
	const db = await getDb();

	return await db.appSettings
		.where("name")
		.equals("lineWidthAdjustment")
		.modify({ value: lineWidthAdjustment });
};

export const getTestCylinderHeight = async () => {
	const db = await getDb();
	const testCylinderHeight = await db.appSettings
		.where("name")
		.equals("testCylinderHeight")
		.first();
	return Number(testCylinderHeight.value);
};

export const setTestCylinderHeight = async (testCylinderHeight: number) => {
	const db = await getDb();

	return await db.appSettings
		.where("name")
		.equals("testCylinderHeight")
		.modify({ value: testCylinderHeight });
};

export const getTestCylinderDiameter = async () => {
	const db = await getDb();
	const testCylinderDiameter = await db.appSettings
		.where("name")
		.equals("testCylinderDiameter")
		.first();
	return Number(testCylinderDiameter.value);
};

export const setTestCylinderDiameter = async (testCylinderDiameter: number) => {
	const db = await getDb();

	return await db.appSettings
		.where("name")
		.equals("testCylinderDiameter")
		.modify({ value: testCylinderDiameter });
};

export const getSecondsPerLayer = async () => {
	const db = await getDb();
	const secondsPerLayer = await db.appSettings
		.where("name")
		.equals("secondsPerLayer")
		.first();
	return Number(secondsPerLayer.value);
};

export const setSecondsPerLayer = async (secondsPerLayer: number) => {
	const db = await getDb();

	return await db.appSettings
		.where("name")
		.equals("secondsPerLayer")
		.modify({ value: secondsPerLayer });
};
