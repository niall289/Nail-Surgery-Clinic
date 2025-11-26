
import { db } from "../server/db";
import { consultations } from "../shared/schema";
import { ilike } from "drizzle-orm";

async function inspectToeny() {
  console.log("🔍 Searching for 'Toeny'...");

  try {
    const records = await db.select()
      .from(consultations)
      .where(ilike(consultations.name, '%Toeny%'));

    if (records.length === 0) {
      console.log("❌ No records found for 'Toeny'");
    } else {
      for (const r of records) {
        console.log(`\n🆔 ID: ${r.id}`);
        console.log(`👤 Name: ${r.name}`);
        console.log(`📅 Created: ${r.createdAt}`);
        console.log(`🖼️  Has Image: ${r.has_image}`);
        console.log(`🔗 Image URL: ${r.image_url}`);
        
        const pathPreview = r.image_path ? (r.image_path.length > 100 ? r.image_path.substring(0, 100) + "..." : r.image_path) : "null";
        console.log(`Vk Image Path (preview): ${pathPreview}`);
      }
    }
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

inspectToeny();
