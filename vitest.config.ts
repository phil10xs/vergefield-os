import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: { "@": resolve("./src") },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
