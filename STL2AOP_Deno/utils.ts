export async function isBinarySTL(filePath: string): Promise<boolean> {
  try {
    const fileInfo = await Deno.stat(filePath);
    const fileSize = fileInfo.size;

    const file = await Deno.open(filePath, { read: true });
    const header = new Uint8Array(80);
    await file.read(header);

    const numTrianglesBuf = new Uint8Array(4);
    await file.read(numTrianglesBuf);
    const numTriangles = new DataView(numTrianglesBuf.buffer).getUint32(
      0,
      true
    );

    const expectedSize = 80 + 4 + numTriangles * 50;
    file.close();

    return fileSize === expectedSize;
  } catch (e) {
    console.error(`Error reading STL file: ${e}`);
    return false;
  }
}
