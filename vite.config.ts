import { resolve } from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
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
	build: {
		minify: true,
		target: "es2022",
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html"),
				help: resolve(__dirname, "help.html"),
			},
			output: {
				manualChunks: {
					three: ["three"],
					"three-mesh-bvh": ["three-mesh-bvh"],
				},
			},
		},
	},
	plugins: [
		tsconfigPaths(),
		topLevelAwait(),
		VitePWA({
			registerType: "autoUpdate",
			manifest: {
				name: "Provel Print",
				display: "standalone",
				short_name: "PP",
				description:
					"A simple CAD software to join socket prosthesis with distal cups.",
				theme_color: "#ffffff",
			},
		}),
	],
});
