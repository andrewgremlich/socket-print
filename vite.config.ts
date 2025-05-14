import { resolve } from "node:path";
import { isTauri } from "@tauri-apps/api/core";
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
		},
	},
	plugins: [
		tsconfigPaths(),
		topLevelAwait(),
		!isTauri()
			? VitePWA({
					registerType: "autoUpdate",
					manifest: {
						name: "Provel Print",
						display: "standalone",
						short_name: "PP",
						description:
							"A simple CAD software to join socket prosthesis with distal cups.",
						theme_color: "#00e1ee",
						icons: [
							{
								src: "64x64.png",
								sizes: "64x64",
								type: "image/png",
							},
							{
								src: "128x128@2x.png",
								sizes: "128x128",
								type: "image/png",
							},
							{
								src: "Square310x310Logo.png",
								sizes: "310x310",
								type: "image/png",
							},
							{
								src: "AppIcon-512@2x.png",
								sizes: "512x512",
								type: "image/png",
							},
						],
					},
				})
			: null,
	],
	test: {
		globals: true,
		environment: "jsdom",
		include: ["**/*.{test,spec}.{js,ts}"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
			exclude: ["node_modules/", "src-tauri/"],
		},
	},
});
