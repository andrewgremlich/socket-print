export const getExtrusionCalculation = (
	distance: number,
	layerHeight: number,
	lineWidth: number,
	extrusionAdjustment: number,
	outputFactor: number,
): number => {
	return (
		((distance * layerHeight * lineWidth) / extrusionAdjustment) * outputFactor
	);
};
