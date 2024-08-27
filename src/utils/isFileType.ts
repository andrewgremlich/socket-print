export function isBinaryFile(file: File): boolean {
	const reader = new FileReader();
	reader.readAsArrayBuffer(file);
	return reader.result instanceof ArrayBuffer;
}

export function isAsciiFile(file: File): boolean {
	const reader = new FileReader();
	reader.readAsText(file);
	return reader.result instanceof ArrayBuffer;
}
