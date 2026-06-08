# Database Schema (Dexie v23)

Defined in `src/db/db.ts`. Types in `src/db/types.ts`.

Four tables:

## formValues (key/value rows)

Stored as `KeyValueSetting` rows (`{ id, name, value }`). The logical shape (see `FormValues` type) is:

- `ipAddress` — printer IP
- `lockPosition` — "left" | "right"
- `cupSize` — `CupSize` object (innerDiameter, outerDiameter, height, name)
- `nozzleSize`
- `layerHeight`
- `activeMaterialProfile` — name of active material profile

## appSettings (key/value rows)

Stored as `KeyValueSetting` rows. The logical shape (see `ProvelPrintSettings` type) is:

- `lockDepth`
- `circularSegments`
- `translateX`, `translateY`, `translateZ`
- `rotateX`, `rotateY`, `rotateZ`
- `startingCupLayerHeight`
- `lineWidthAdjustment`
- `testCylinderHeight`
- `testCylinderInnerDiameter`
- `secondsPerLayer`
- `useSecondsPerLayer`
- `ePerRevolution`

## materialProfiles (object rows)

Indexed columns: `++id, name, nozzleTemp, cupTemp, shrinkFactor, outputFactor`.

`MaterialProfile` shape (`src/db/types.ts`):

- `name`
- `nozzleTemp`
- `cupTemp`
- `shrinkFactor`
- `outputFactor`
- `gramsPerRevolution`
- `density`

## savedFiles (object rows)

Indexed columns: `++id, name, file, type`.

`SavedFile` shape:

- `name`
- `type` — `PrintObjectType` enum
- `file` — Blob

## Enums

```typescript
enum PrintObjectType {
  TestCylinder = "TestCylinder",
  Socket = "Socket",
}
```
