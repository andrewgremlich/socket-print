import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			globals: true,
			environment: "jsdom",
			include: ["**/*.{test,spec}.{js,ts}"],
			coverage: {
				provider: "v8",
				reporter: ["text", "json", "html", "lcov"],
				exclude: [
					"node_modules/",
					"src-tauri/",
					"**/*.d.ts",
					"**/*.test.ts",
					"**/*.spec.ts",
					"**/types/**",
					"**/mocks/**",
				],
				all: true,
				thresholds: {
					lines: 0,
					functions: 0,
					branches: 0,
					statements: 0,
				},
			},
		},
	}),
);
