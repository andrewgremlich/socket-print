import GUI from "lil-gui";

let gui: GUI;

export const getGui = () => {
	if (!gui) {
		gui = new GUI();
	}

	return gui;
};
