import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// This is the correct way neon config - DO NOT change this
neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (!process.env.DATABASE_URL) {
  console.warn(
    "WARNING: DATABASE_URL is not set for chatbot-nailsurgery-client1. Database operations will not work. Running in mock/limited mode."
  );
} else {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    // @ts-ignore schema might not be fully compatible if db is null, but this is for a simplified test
    db = drizzle({ client: pool, schema });
  } catch (error) {
    console.error("Failed to connect to the database for chatbot-nailsurgery-client1:", error);
    console.warn("Continuing to run chatbot-nailsurgery-client1 in mock/limited mode due to database connection failure.");
    pool = null;
    db = null;
  }
}

export { pool, db };