import "./style.css";

import { Application } from "./classes/Application";
import { Cube } from "./classes/Cube";
import { Lighting } from "./classes/Lighting";

const app = new Application();
const lighting1 = new Lighting({
	color: 0xffffff,
	intensity: 5,
	position: { x: 2, y: 2, z: 2 },
	name: "Lighting 1",
});
const lighting2 = new Lighting({
	color: 0xffffff,
	intensity: 2,
	position: { x: -2, y: -2, z: -2 },
	name: "Lighting 2",
});
const cube = new Cube({ size: { x: 1, y: 1, z: 1 }, color: 0xd1383b });

app.addToScene(lighting1.directionalLight);
app.addToScene(lighting1.directionalLightHelper);
app.addToScene(lighting2.directionalLight);
app.addToScene(lighting2.directionalLightHelper);
app.addToScene(cube.mesh);

// Function to handle mouse move
// function onMouseMove(event: MouseEvent) {
// Calculate mouse position in normalized device coordinates
//   app.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//   app.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
// }

// Add event listener for mouse move
// window.addEventListener("mousemove", onMouseMove, false);
