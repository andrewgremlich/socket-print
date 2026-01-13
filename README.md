# Socket Print

A utility CAD-like application to apply modifications to a prosthetic limb socket STL file, and output the modifications to a GCode file.

## Testing

In order to test GCode files, use the [NCViewer](https://ncviewer.com/) website.

## Coordinate System Transformation

This application bridges two different coordinate system conventions:

- **Three.js (3D visualization)**: Y-up coordinate system where Y is the vertical axis
- **3D Printing/GCode**: Z-up coordinate system where Z is the vertical axis

### Why This Matters

When generating GCode from Three.js geometries, coordinate transformations are necessary to convert between these systems:

1. **In Three.js**: Objects are positioned with Y representing height
2. **In GCode**: The Z axis represents height (vertical movement)

### Where Transformations Occur

- **[generateGCode.ts](src/3d/generateGCode.ts)**: The `makeGCodePoint()` function (line 42-50) and `flipVerticalAxis()` function (line 38-40) handle the Y↔Z axis transformations when converting Three.js Vector3 points to GCode coordinates
- **[sliceWorker.ts](src/3d/sliceWorker.ts)**: Points are collected in Three.js coordinate space (Y-up) and later transformed during GCode generation

When reading the code, keep in mind that variables like `verticalAxis` and `flipHeight` are used to manage this coordinate system transformation throughout the pipeline.

## Notes

https://dyzedesign.com/2024/05/flow-to-rpm-factor-optimize-your-3d-printing-with-pellet-extruders/

Signing Windows
- https://www.josephguadagno.net/2024/07/17/ev-code-signing-certificates-with-azure-key-vault-and-digicert
- https://codesigningstore.com/azure-key-vault-set-up-and-code-signing-tutorial-with-faqs
- https://dev.to/obinnaijoma/how-to-create-a-key-vault-and-add-key-secret-and-certificate-on-microsoft-azure-2fe5
- https://tauri.app/distribute/sign/windows/#azure-code-signing
- code signing on windows
  - https://melatonin.dev/blog/code-signing-on-windows-with-azure-trusted-signing/

## Clipping Library

https://www.npmjs.com/search?q=clipper-lib

https://www.npmjs.com/package/clipper-lib

https://github.com/junmer/clipper-lib?tab=readme-ov-file

