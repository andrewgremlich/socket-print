// import "./style.css";

import { primitives } from "@jscad/modeling";
import {
	cameras,
	controls,
	drawCommands,
	entitiesFromSolids,
	prepareRender,
} from "@jscad/regl-renderer";

import { hello } from "@/control";

hello();

const app = document.getElementById("app");

if (app === null) {
	throw new Error("Element with id 'app' not found");
}

prepareRender({ glOptions: { container: app } });

const { cube } = primitives;

const main = () => {
	const myCube = cube({ size: 10 });
	return myCube;
};

console.log(main());
