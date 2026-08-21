import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for migrations");
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

await client.connect();
try {
  await client.query(`
    create table if not exists schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const version = "0001_init";
  const exists = await client.query("select 1 from schema_migrations where version = $1", [version]);
  if (exists.rowCount === 0) {
    const sql = await readFile(path.join(process.cwd(), "migrations", "0001_init.sql"), "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into schema_migrations(version) values ($1)", [version]);
      await client.query("commit");
      console.log(`applied ${version}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  } else {
    console.log(`${version} already applied`);
  }
} finally {
  await client.end();
}
