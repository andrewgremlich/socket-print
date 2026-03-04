# Database Schema (Dexie v21)

Four main tables:

## formValues
- IP address
- Lock position (left/right)
- Cup size
- Nozzle size
- Layer height
- Active material profile

## appSettings
- Lock depth
- circularSegments
- Translations (X/Y/Z)
- Rotations (X/Y/Z)
- startingCupLayerHeight
- lineWidthAdjustment
- testCylinderHeight
- testCylinderInnerDiameter
- Seconds per layer
- E per revolution

## materialProfiles
- Name
- Nozzle temp
- Cup temp
- Shrink factor
- Output factor
- Grams per revolution
- Density

## savedFiles
- Name
- Type (Socket/TestCylinder)
- File blob

## Print Object Types

```typescript
enum PrintObjectType {
  TestCylinder = "TestCylinder",
  Socket = "Socket",
}
```

## Cup Size Configuration

```typescript
type CupSize = {
  innerDiameter: number;
  outerDiameter: number;
  height: number;
  name: string;
};
```
