export interface ExtrusionParams {
	distance: number;
	layerHeight: number;
	lineWidth: number;
	gramsPerRevolution: number;
	density: number;
	ePerRevolution: number;
	outputFactor: number;
}

export const getExtrusionCalculation = ({
	distance,
	layerHeight,
	lineWidth,
	gramsPerRevolution,
	density,
	ePerRevolution,
	outputFactor,
}: ExtrusionParams): number => {
	const extrusion =
		((distance * layerHeight * lineWidth) /
			(gramsPerRevolution / density / ePerRevolution)) *
		outputFactor;

	return extrusion;
};
