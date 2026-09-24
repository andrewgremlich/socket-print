/// <reference types="vitest/config" />
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		dedupe: ["three"],
		alias: {
			three: resolve(import.meta.dirname, "node_modules/three"),
		},
		tsconfigPaths: true
	},
	test: {
		globals: true,
		environment: "jsdom",
		include: ["**/*.{test,spec}.{js,ts}"],
		server: {
			deps: {
				inline: ["three"],
			},
		},
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
			exclude: ["node_modules/"],
		},
	},
});