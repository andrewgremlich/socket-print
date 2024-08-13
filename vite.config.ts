import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => ({
	plugins: [
		tsconfigPaths(),
		VitePWA({
			registerType: "autoUpdate",
			// includeAssets: ["/favicon.ico", "/robots.txt", "/safari-pinned-tab.svg"],
			manifest: {
				name: "Socket Print",
				short_name: "SP",
				description: "A simple CAD software to design socket prosthesis.",
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
