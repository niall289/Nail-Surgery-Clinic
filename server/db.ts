import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "../shared/schema.js";

let dbInstance: any = null;

if (process.env.DATABASE_URL) {
  const client = postgres(process.env.DATABASE_URL);
  dbInstance = drizzle(client, { schema });
} else {
  console.warn("DATABASE_URL not set. Running in mock mode.");
}

export const db = dbInstance;
