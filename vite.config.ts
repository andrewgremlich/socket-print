/// <reference types="vitest/config" />
import { resolve } from "node:path";
import { defineConfig } from 'vite'
import { serviceWorkerPlugin } from "./vite-sw-plugin";

export default defineConfig({
	resolve: {
		dedupe: ["three"],
		alias: {
			three: resolve(__dirname, "node_modules/three"),
		},
		tsconfigPaths: true
	},
	optimizeDeps: {
		include: ["three", "three/examples/jsm/Addons.js"],
	},
	css: {
		transformer: "lightningcss",
		lightningcss: {
			targets: {
				chrome: 100,
				firefox: 100,
				safari: 14,
				edge: 100,
			},
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
		include: ["**/*.{test,spec}.{js,ts}"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
			exclude: ["node_modules/"],
		},
	},
	server: {
		port: 4200,
		host: "localhost",
	},
	preview: {
		port: 4300,
		host: "localhost",
	},
	worker: {
		format: "es",
	},
	build: {
		chunkSizeWarningLimit: 1000,
		sourcemap: "hidden",
		minify: true,
		target: "es2022",
		// modulePreload: false,
		rolldownOptions: {
			input: {
				main: resolve(import.meta.dirname, "index.html"),
				help: resolve(import.meta.dirname, "help.html"),
				licenses: resolve(import.meta.dirname, "licenses.html"),
			},
			output: {
				entryFileNames: "assets/[name].[hash].js",
				chunkFileNames: "assets/[name].[hash].js",
				assetFileNames: "assets/[name].[hash][extname]",
				manualChunks(id) {
					if (id.includes("node_modules/three/")) {
						return "three";
					}
					if (id.includes("node_modules/three-mesh-bvh/")) {
						return "three-mesh-bvh";
					}
				},
			},
		},
	},
	plugins: [
		serviceWorkerPlugin({
			swSrc: 'public/sw-template.js',
			swDest: 'sw.js',
			staticAssets: [
				'/test_stl_file.stl',
				'/TF-IschialContainment.stl',
				'/Crosswalk.stl',
				'/acme_J_needs-trimming.stl',
				'/helvetiker_regular.typeface.json',
				'/manifest.webmanifest',
				'/favicon.ico',
				'/64x64.png',
				'/128x128@2x.png',
				'/AppIcon-512@2x.png',
				'/Square310x310Logo.png'
			]
		})
	],
});
