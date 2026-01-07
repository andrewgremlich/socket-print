# Service Worker Implementation

This app now uses an automated, offline-first service worker system.

## Features

### 1. Automated Version Management
- Version automatically generated from `package.json` version + build timestamp
- No more manual version bumping
- Each build gets a unique cache version

### 2. Dynamic Asset List Generation
- Build process automatically discovers all generated assets
- No more hardcoded asset paths that break when hashes change
- Includes all static assets from the public folder

### 3. Offline-First Strategy
- Cache-first approach: checks cache before network
- App works completely offline once all files are cached
- Background updates for HTML files when online
- Graceful fallback for network failures

## How It Works

1. **Build Time**: `vite-sw-plugin.ts` generates `dist/sw.js` from `public/sw-template.js`
2. **Template Replacement**: Replaces `__CACHE_VERSION__` and `__ASSETS_TO_CACHE__` placeholders
3. **Asset Discovery**: Automatically includes all build outputs and static assets
4. **Service Worker Registration**: Enhanced registration in HTML files with update handling

## Files

- `public/sw-template.js` - Service worker template with placeholders
- `vite-sw-plugin.ts` - Vite plugin that generates the final service worker
- `dist/sw.js` - Generated service worker (created during build)
- `src/web-components/OfflineIndicator/` - Web component that shows offline status to users

## Usage

```bash
# Build the app (generates service worker automatically)
npm run build

# Serve the built app
npm run preview
```

## Offline Indicator

The app shows an offline indicator web component (`<offline-indicator>`) in the top-right corner when:
- User goes offline
- Cached content is available (shows green indicator)
- No cached content (shows red indicator)

The component is automatically included in all HTML pages and provides:
- Smooth animations when appearing/disappearing
- Responsive design for mobile devices
- Automatic cache status detection
- Clean shadow DOM encapsulation

## Cache Strategy

- **Install**: Caches all assets in batches to avoid overwhelming the network
- **Activate**: Cleans up old cache versions automatically
- **Fetch**: Cache-first with network fallback and background updates for HTML

## Development

For development, the service worker registers on both HTTPS and localhost for testing.
