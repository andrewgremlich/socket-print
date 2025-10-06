import { floor, max, min } from "mathjs";
import { getCircularSegments } from "@/db/appSettingsDbActions";

export const getRadialSegments = async (): Promise<number> => {
	const circularSegments = await getCircularSegments();

	const radialSegments =
		Number.isFinite(circularSegments) && circularSegments >= 3
			? min(512, max(3, floor(circularSegments)))
			: 128; // clamp + fallback

	return radialSegments;
};
