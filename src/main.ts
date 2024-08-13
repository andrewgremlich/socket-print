import "./style.css";

import { Application } from "./classes/Application";
import { Cube } from "./classes/Cube";
import { Lighting } from "./classes/Lighting";

const app = new Application();
const lighting = new Lighting();
const cube = new Cube({ x: 1, y: 1, z: 1 }, 0xd1383b);

app.addToScene(lighting.directionalLight);
app.addToScene(lighting.directionalLightHelper);
app.addToScene(cube.mesh);

// Function to handle mouse move
// function onMouseMove(event: MouseEvent) {
// Calculate mouse position in normalized device coordinates
//   app.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//   app.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
// }

// Add event listener for mouse move
// window.addEventListener("mousemove", onMouseMove, false);
