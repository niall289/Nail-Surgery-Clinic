
import { db } from "../server/db";
import { consultations } from "../shared/schema";
import { uploadBase64Image } from "../server/supabase";
import { eq, like, and, isNull } from "drizzle-orm";

async function processPendingImages() {
  console.log("🔍 Checking for consultations with pending base64 images...");

  try {
    // Find consultations where image_path starts with 'data:image' (base64)
    // and image_url might be null or empty
    const pendingImages = await db.select()
      .from(consultations)
      .where(like(consultations.image_path, 'data:image%'));

    console.log(`Found ${pendingImages.length} records with base64 image data.`);

    for (const record of pendingImages) {
      console.log(`\nProcessing ID ${record.id} (${record.name})...`);
      
      if (!record.image_path) {
        console.log("  - No image path, skipping.");
        continue;
      }

      try {
        // Upload to Supabase
        console.log("  - Uploading to Supabase...");
        const publicUrl = await uploadBase64Image(record.image_path, `restored_image_${record.id}`);

        if (publicUrl) {
          console.log(`  - Upload successful: ${publicUrl}`);
          
          // Update the record
          await db.update(consultations)
            .set({
              image_url: publicUrl,
              image_path: publicUrl, // Replace base64 with URL to save space
              has_image: true
            })
            .where(eq(consultations.id, record.id));
            
          console.log("  - Database updated.");
        } else {
          console.error("  - Failed to upload image.");
        }
      } catch (err) {
        console.error(`  - Error processing record ${record.id}:`, err);
      }
    }

    console.log("\n✅ Image processing complete.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }
}

processPendingImages();
