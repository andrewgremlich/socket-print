import type { Plugin } from 'vite';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface ServiceWorkerPluginOptions {
  swSrc: string;
  swDest: string;
  staticAssets?: string[];
  /**
   * Extra URLs to precache, resolved at build time. `bundle` below only holds
   * Rollup output, so anything Vite copies verbatim out of `public/` has to be
   * contributed here or it will never be available offline.
   */
  extraAssets?: () => string[];
}

// Emitted into dist/ for the deploy tooling rather than for browsers.
// dist/.assetsignore excludes wrangler.json from Workers Assets, so requesting
// either one in production falls through to the SPA handler and caches
// index.html under the wrong key — and wrangler.json embeds absolute paths
// from the build machine.
const DEPLOY_ARTIFACTS = new Set(['wrangler.json', '.assetsignore', '.dev.vars']);

function isServable(fileName: string): boolean {
  return (
    !fileName.endsWith('.map') &&
    !DEPLOY_ARTIFACTS.has(fileName) &&
    !fileName.startsWith('.')
  );
}

export function serviceWorkerPlugin(options: ServiceWorkerPluginOptions): Plugin {
  const { swSrc, swDest, staticAssets = [], extraAssets } = options;

  return {
    name: 'service-worker-plugin',
    apply: 'build',
    writeBundle(outputOptions, bundle) {
      const assets = Object.keys(bundle)
        .filter(isServable)
        .map(fileName => `/${fileName}`);
      // Deduped: a missing asset now aborts the service worker install, so a
      // URL listed twice would be two chances to fail on the same file.
      const allAssets = [...new Set([
        ...staticAssets,
        ...(extraAssets?.() ?? []),
        ...assets
      ])];
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      const fingerprint = createHash('sha256')
        .update([...allAssets].sort().join('\n'))
        .digest('hex')
        .slice(0, 8);
      const version = `${packageJson.version}-${fingerprint}`;
      const swTemplate = readFileSync(swSrc, 'utf-8');
      const swContent = swTemplate
        .replaceAll('__CACHE_VERSION__', version)
        .replaceAll('__APP_VERSION__', packageJson.version)
        .replaceAll('__ASSETS_TO_CACHE__', JSON.stringify(allAssets, null, 2));
      const outputDir = outputOptions.dir || 'dist';

      writeFileSync(resolve(outputDir, swDest), swContent);
      
      console.log(`✓ Generated service worker with ${allAssets.length} assets (version: ${version})`);
    }
  };
}