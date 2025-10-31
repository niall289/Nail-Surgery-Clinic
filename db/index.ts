import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

let db: ReturnType<typeof drizzle> | null = null;
let supabase: ReturnType<typeof createClient> | null = null;

if (!process.env.DATABASE_URL || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "WARNING: Required database environment variables are not set. Database operations will not work. Running in mock/limited mode."
  );
} else {
  try {
    // Create Supabase client
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Create postgres client for Drizzle
    const client = postgres(process.env.DATABASE_URL);
    db = drizzle(client, { schema });

    console.log("✅ Successfully connected to Supabase database");
  } catch (error) {
    console.error("Failed to connect to Supabase database:", error);
    console.warn("Continuing to run in mock/limited mode due to database connection failure.");
    supabase = null;
    db = null;
  }
}

export { supabase, db };