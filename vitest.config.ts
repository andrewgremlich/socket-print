import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
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
});
