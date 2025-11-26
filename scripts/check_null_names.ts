
import { db } from "./server/db";
import { consultations } from "./shared/schema";
import { desc } from "drizzle-orm";

async function checkNullNames() {
  console.log("Checking for consultations with null names...");
  
  const results = await db.select().from(consultations).orderBy(desc(consultations.createdAt)).limit(10);
  
  console.log(`Found ${results.length} recent consultations.`);
  
  for (const c of results) {
    console.log(`ID: ${c.id}, Name: ${c.name}, CreatedAt: ${c.createdAt}`);
    if (c.name === null) {
        console.error(`!!! ALERT: Consultation ${c.id} has NULL name !!!`);
    }
  }
  
  process.exit(0);
}

checkNullNames().catch(console.error);
