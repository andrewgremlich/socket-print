import { resolve } from "node:path";
import { defineConfig } from "vite";
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
	plugins: [tsconfigPaths(), topLevelAwait()],
}));
