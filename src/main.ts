import "@/global-style.css";

import { Application } from "@/classes/Application";
// import { DirectionalLighting } from "@/classes/Lighting";
// import { RayCaster } from "@/classes/Raycaster";
import { STLLoader } from "@/classes/STLLoader";

document.querySelector("body")?.appendChild(STLLoader.createSTLInput());

const app = new Application();
// const lighting1 = new DirectionalLighting({
// 	color: 0xffffff,
// 	intensity: 5,
// 	position: { x: 3, y: 6, z: 2 },
// 	name: "Lighting 1",
// });
// const lighting2 = new DirectionalLighting({
// 	color: 0xffffff,
// 	intensity: 2,
// 	position: { x: -3, y: -4, z: -2 },
// 	name: "Lighting 2",
// });
// const raycaster = new RayCaster();
new STLLoader({
	app,
	controls: app.controls,
	camera: app.camera,
});

window.addEventListener("resize", () => {
	app.camera.aspect = window.innerWidth / window.innerHeight;
	app.camera.updateProjectionMatrix();
	app.renderer.setSize(window.innerWidth, window.innerHeight);
});

// raycaster.addObjectsToIntersect([cube.mesh, extrudeGeo.mesh]);

// window.addEventListener("pointermove", raycaster.onPointerMove(app.camera));

// app.addToScene(lighting1.directionalLight);
// app.addToScene(lighting2.directionalLight);

// if (import.meta.env.MODE === "development") {
// 	app.addToScene(lighting1.directionalLightHelper);
// 	app.addToScene(lighting2.directionalLightHelper);
// }
