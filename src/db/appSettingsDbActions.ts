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
	rotateX: number,
	rotateY: number,
	rotateZ: number,
) => {
	await Promise.all([
		db.appSettings.where("name").equals("rotateX").modify({ value: rotateX }),
		db.appSettings.where("name").equals("rotateY").modify({ value: rotateY }),
		db.appSettings.where("name").equals("rotateZ").modify({ value: rotateZ }),
	]);
};

export const getRotateValues = async () => {
	const rotateX = await db.appSettings.where("name").equals("rotateX").first();
	const rotateY = await db.appSettings.where("name").equals("rotateY").first();
	const rotateZ = await db.appSettings.where("name").equals("rotateZ").first();

	return {
		x: Number(rotateX.value),
		y: Number(rotateY.value),
		z: Number(rotateZ.value),
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

export const getTestCylinderInnerDiameter = async () => {
	const testCylinderInnerDiameter = await db.appSettings
		.where("name")
		.equals("testCylinderInnerDiameter")
		.first();
	return Number(testCylinderInnerDiameter.value);
};

export const setTestCylinderInnerDiameter = async (
	testCylinderInnerDiameter: number,
) => {
	return await db.appSettings
		.where("name")
		.equals("testCylinderInnerDiameter")
		.modify({ value: testCylinderInnerDiameter });
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
