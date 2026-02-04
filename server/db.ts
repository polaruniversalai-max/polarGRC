import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

if (databaseUrl) {
  const pool = new Pool({
    connectionString: databaseUrl,
  });
  db = drizzle(pool, { schema });
}

export { db };
