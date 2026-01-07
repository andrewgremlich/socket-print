import type { Plugin } from 'vite';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface ServiceWorkerPluginOptions {
  swSrc: string;
  swDest: string;
  staticAssets?: string[];
}

export function serviceWorkerPlugin(options: ServiceWorkerPluginOptions): Plugin {
  const { swSrc, swDest, staticAssets = [] } = options;
  
  return {
    name: 'service-worker-plugin',
    apply: 'build',
    writeBundle(outputOptions, bundle) {
      const assets = Object.keys(bundle).map(fileName => `/${fileName}`);
      const allAssets = [
        ...staticAssets,
        ...assets
      ];
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      const version = `${packageJson.version}-${Date.now()}`;
      const swTemplate = readFileSync(swSrc, 'utf-8');
      const swContent = swTemplate
        .replace('__CACHE_VERSION__', version)
        .replace('__ASSETS_TO_CACHE__', JSON.stringify(allAssets, null, 2));
      const outputDir = outputOptions.dir || 'dist';

      writeFileSync(resolve(outputDir, swDest), swContent);
      
      console.log(`✓ Generated service worker with ${allAssets.length} assets (version: ${version})`);
    }
  };
}