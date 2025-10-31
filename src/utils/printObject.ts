import { stlFileInput } from "./htmlElements";

export const setStlFileInputAndDispatch = (file: File) => {
	const dataTransfer = new DataTransfer();
	dataTransfer.items.add(file);
	stlFileInput.files = dataTransfer.files;
	const changeEvent = new Event("change", { bubbles: true });
	stlFileInput.dispatchEvent(changeEvent);
};

export const fetchStlFile = (name: string) => async () => {
	const response = await fetch(name);
	const arrayBuffer = await response.arrayBuffer();
	const file = new File([arrayBuffer], name, {
		type: "model/stl",
	});

	setStlFileInputAndDispatch(file);
};
