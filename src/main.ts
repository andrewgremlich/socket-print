import "./style.css";

import { Application } from "./classes/Application";
import { Cube } from "./classes/Cube";
import { DirectionalLighting } from "./classes/Lighting";
import { RayCaster } from "./classes/Raycaster";
import { Socket } from "./classes/Socket";

const app = new Application();
const lighting1 = new DirectionalLighting({
	color: 0xffffff,
	intensity: 5,
	position: { x: 3, y: 6, z: 2 },
	name: "Lighting 1",
});
const lighting2 = new DirectionalLighting({
	color: 0xffffff,
	intensity: 2,
	position: { x: -3, y: -4, z: -2 },
	name: "Lighting 2",
});
const cube = new Cube({ size: { x: 1, y: 1, z: 1 }, color: 0xd1383b });
const socket = new Socket();
const raycaster = new RayCaster();

raycaster.addObjectsToIntersect([cube.mesh, socket.mesh]);

window.addEventListener("pointermove", raycaster.onPointerMove(app.camera));

app.addToScene(lighting1.directionalLight);
app.addToScene(lighting2.directionalLight);
// app.addToScene(cube.mesh);
app.addToScene(socket.mesh);

if (import.meta.env.MODE === "development") {
	app.addToScene(lighting1.directionalLightHelper);
	app.addToScene(lighting2.directionalLightHelper);
}
