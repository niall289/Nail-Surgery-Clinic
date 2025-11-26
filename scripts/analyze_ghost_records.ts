
import { db } from "../server/db";
import { consultations } from "../shared/schema";
import { isNull, or, isNotNull, and } from "drizzle-orm";

async function analyzeGhostRecords() {
  console.log("🔍 Analyzing records with NULL names...");

  // 1. Total count of null names
  const nullNameRecords = await db.select().from(consultations).where(isNull(consultations.name));
  console.log(`\n📊 Total records with missing names: ${nullNameRecords.length}`);

  // 2. Check for valuable data within these records
  const valuableGhosts = nullNameRecords.filter(c => c.email || c.phone);
  
  if (valuableGhosts.length > 0) {
    console.log(`\n⚠️ WARNING: ${valuableGhosts.length} of these records contain an Email or Phone number!`);
    console.log("Examples:");
    valuableGhosts.slice(0, 3).forEach(c => {
      console.log(` - ID: ${c.id} | Email: ${c.email} | Phone: ${c.phone}`);
    });
  } else {
    console.log("\n✅ GOOD NEWS: None of these records contain an email or phone number.");
    console.log("They appear to be completely empty 'ghost' sessions.");
  }

  // 3. Show a few examples of what we would delete
  console.log("\n📝 Sample of records to be deleted:");
  nullNameRecords.slice(0, 5).forEach(c => {
    console.log(` - ID: ${c.id} | Created: ${c.createdAt} | Category: ${c.issue_category}`);
  });

  process.exit(0);
}

analyzeGhostRecords().catch(console.error);
