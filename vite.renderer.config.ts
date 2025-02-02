import { resolve } from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import topLevelAwait from "vite-plugin-top-level-await";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => ({
	build: {
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html"),
			},
			output: {
				manualChunks: {
					three: ["three"],
				},
			},
		},
	},
	plugins: [
		tsconfigPaths(),
		topLevelAwait(),
		VitePWA({
			registerType: "autoUpdate",
			// includeAssets: ["/favicon.ico", "/robots.txt", "/safari-pinned-tab.svg"],
			manifest: {
				name: "Provel Print",
				display: "standalone",
				short_name: "PP",
				description:
					"A simple CAD software to join socket prosthesis with distal cups.",
				theme_color: "#ffffff",
				// icons: [
				//   {
				//     src: "/android-chrome-192x192.png",
				//     sizes: "192x192",
				//     type: "image/png",
				//   },
				//   {
				//     src: "/android-chrome-512x512.png",
				//     sizes: "512x512",
				//     type: "image/png",
				//   },
				// ],
			},
		}),
	],
}));
