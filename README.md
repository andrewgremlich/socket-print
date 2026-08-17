# Socket Print (Provel Print)

A utility CAD-like application to apply modifications to a prosthetic limb socket STL file, and output the modifications to a GCode file.

## Getting Started

Requires Node.js 24+ (see `.nvmrc`).

```bash
git clone https://github.com/andrewgremlich/socket-print.git
cd socket-print
npm install
npm run dev
```

Open <http://localhost:4200>.

### Other commands

```bash
npm run build            # Production build (runs tests first)
npm run test             # Run Vitest
npm run check            # TypeScript + Biome
npm run knip             # Find unused files/exports/deps
```

## Deployment

The app is a fully static site deployed to **Cloudflare Workers** via [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/). No Worker script is required — Cloudflare serves the `dist/` build directly from the edge. Config lives in [wrangler.jsonc](wrangler.jsonc); edge caching/header rules live in [public/\_headers](public/_headers).

```bash
npm run deploy        # Build, then `wrangler deploy`
npm run cf:preview    # Build, then serve the production bundle locally via `wrangler dev`
```

### CI deploys

[.github/workflows/deploy-cloudflare.yml](.github/workflows/deploy-cloudflare.yml) deploys on every push to `main`. Set these repository secrets:

- `CLOUDFLARE_API_TOKEN` — a token with the **Edit Cloudflare Workers** permission
- `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID

The first deploy (locally via `npm run deploy`) creates the Worker and prints its `*.workers.dev` URL; attach a custom domain in the Cloudflare dashboard or via a `routes` entry in `wrangler.jsonc`.

## Offline Support

The app installs a service worker for offline use. See [SERVICE_WORKER.md](SERVICE_WORKER.md).

## Testing GCode Output

To inspect a generated GCode file, use [NCViewer](https://ncviewer.com/).

## Coordinate System Transformation

This application bridges two different coordinate system conventions:

- **Three.js (3D visualization)**: Y-up coordinate system where Y is the vertical axis
- **3D Printing / GCode**: Z-up coordinate system where Z is the vertical axis

### Why This Matters

When generating GCode from Three.js geometries, coordinate transformations are necessary to convert between these systems:

1. **In Three.js**: Objects are positioned with Y representing height
2. **In GCode**: The Z axis represents height (vertical movement)

### Where Transformations Occur

- **[src/3d/generateGCode.ts](src/3d/generateGCode.ts)** — `makeGCodePoint()` and `flipVerticalAxis()` handle the Y↔Z swap when emitting GCode points
- **[src/3d/sliceWorker.ts](src/3d/sliceWorker.ts)** — points are collected in Three.js (Y-up) space and later transformed during GCode generation

Variables like `verticalAxis` and `flipHeight` carry this transformation through the pipeline.

## References

- Pellet extruder flow / RPM: https://dyzedesign.com/2024/05/flow-to-rpm-factor-optimize-your-3d-printing-with-pellet-extruders/
- Clipper polygon-clipping library (under evaluation): https://github.com/junmer/clipper-lib
