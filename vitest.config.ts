import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    testTimeout: 30000,
    // .opencode/node_modules is a nested dependency install (the CLI's own
    // workspace); its bundled zod tests must not run with the project suite.
    exclude: [
      "node_modules/**",
      ".opencode/**",
      ".next/**",
      "app/**",
      "**/*.d.ts",
    ],
  },
  resolve: {
    alias: {
      "@": root,
    },
  },
});
