/* Run migrations against Neon database.
 * Usage:
 *   npm run db:migrate           (applies pending migrations)
 *   npm run db:migrate -- --reset (wipes database clean first, then applies all migrations)
 */
import "dotenv/config";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../src/db/schema";
import path from "node:path";

const databaseUrl = process.env.DATABASE_URL;
const isReset = process.argv.includes("--reset");

if (!databaseUrl) {
  console.error("❌ Error: DATABASE_URL is not set in .env.");
  process.exit(1);
}

async function runMigration() {
  const client = neon(databaseUrl!);

  if (isReset) {
    console.log("🧹 Wiping database clean (dropping public and drizzle schemas)...");
    try {
      await client`DROP SCHEMA IF EXISTS "public" CASCADE;`;
      await client`DROP SCHEMA IF EXISTS "drizzle" CASCADE;`;
      await client`CREATE SCHEMA "public";`;
      console.log("✨ Schemas reset successfully.");
    } catch (err) {
      console.error("⚠️ Warning while resetting schema:", err);
    }
  }

  console.log("🚀 Applying migrations to database...");

  try {
    await client`CREATE EXTENSION IF NOT EXISTS pgcrypto;`;
  } catch {
    // Ignore if already installed or restricted
  }

  const db = drizzle({ client, schema });
  const migrationsFolder = path.resolve(process.cwd(), "drizzle");

  try {
    await migrate(db, { migrationsFolder });
    console.log("✅ Migrations applied successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

runMigration();
