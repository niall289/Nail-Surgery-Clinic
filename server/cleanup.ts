
import { db } from "./db.js";
import { consultations } from "../shared/schema.js";
import { uploadBase64Image } from "./supabase.js";
import { eq, like, and, isNotNull } from "drizzle-orm";

/**
 * Scans the database for records with raw Base64 image paths
 * and converts them to Supabase URLs.
 */
export async function cleanupBase64Images() {
  console.log("🧹 [Cleanup] Starting Base64 image cleanup scan...");
  
  try {
    // Find records where image_path starts with "data:image/"
    // Note: 'like' is case-sensitive in some DBs, but data URIs are usually lowercase.
    const records = await db.select()
      .from(consultations)
      .where(like(consultations.image_path, 'data:image/%'));

    if (records.length === 0) {
      console.log("✨ [Cleanup] No stuck Base64 images found.");
      return;
    }

    console.log(`⚠️ [Cleanup] Found ${records.length} records with raw Base64 images.`);

    for (const record of records) {
      console.log(`   Processing ID ${record.id} (${record.name})...`);
      
      if (!record.image_path) continue;

      try {
        const publicUrl = await uploadBase64Image(record.image_path);
        
        if (publicUrl) {
          await db.update(consultations)
            .set({ 
              image_path: publicUrl,
              image_url: publicUrl,
              has_image: true
            })
            .where(eq(consultations.id, record.id));
            
          console.log(`   ✅ Fixed ID ${record.id}: ${publicUrl}`);
        } else {
          console.error(`   ❌ Failed to upload image for ID ${record.id}`);
        }
      } catch (err) {
        console.error(`   ❌ Error processing ID ${record.id}:`, err);
      }
    }
    
    console.log("🧹 [Cleanup] Scan complete.");
  } catch (error) {
    console.error("❌ [Cleanup] Fatal error during scan:", error);
  }
}
