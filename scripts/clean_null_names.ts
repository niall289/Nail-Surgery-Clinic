
import { db } from "../server/db";
import { consultations } from "../shared/schema";
import { isNull } from "drizzle-orm";

async function cleanNullNames() {
  console.log("Cleaning consultations with null names...");
  
  const result = await db.delete(consultations).where(isNull(consultations.name)).returning();
  
  console.log(`Deleted ${result.length} consultations with null names.`);
  result.forEach(c => console.log(`Deleted ID: ${c.id}`));
  
  process.exit(0);
}

cleanNullNames().catch(console.error);
