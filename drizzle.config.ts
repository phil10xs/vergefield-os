import { defineConfig } from "drizzle-kit";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const require = createRequire(import.meta.url);
try {
  const { config } = require("dotenv") as typeof import("dotenv");
  config({ path: resolve(__dirname, ".env.local") });
  config({ path: resolve(__dirname, ".env") });
} catch {
  // dotenv optional when DATABASE_URL is already exported
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
