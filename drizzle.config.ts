import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  schema: ["./src/db/schema.ts", "./src/db/catalog-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Migrations need DDL rights: prefer the admin/owner connection so the
    // app's DATABASE_URL can be a least-privilege role.
    url: (process.env.DATABASE_URL_ADMIN ?? process.env.DATABASE_URL)!,
  },
});
