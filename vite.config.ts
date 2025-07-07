import { resolve } from "node:path";
import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
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
	server: {
		port: 4200,
		host: "localhost",
	},
	preview: {
		port: 4300,
		host: "localhost",
	},
	build: {
		minify: true,
		target: "es2022",
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html"),
				help: resolve(__dirname, "help.html"),
			},
			output: {
				entryFileNames: "assets/[name].js",
				chunkFileNames: "assets/[name].js",
				assetFileNames: "assets/[name][extname]",
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
	plugins: [tsconfigPaths(), topLevelAwait()],
});
