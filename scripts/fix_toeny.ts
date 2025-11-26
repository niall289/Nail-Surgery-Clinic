
import { storage } from "../server/storage";
import { uploadBase64Image } from "../server/supabase";
import { db } from "../server/db";
import { consultations } from "../shared/schema";
import { eq } from "drizzle-orm";

async function fixToeny() {
  console.log("🔍 Inspecting Toeny record (ID 271)...");

  const id = 271;
  const consultation = await storage.getConsultationById(id);

  if (!consultation) {
    console.error("❌ Consultation 271 not found!");
    process.exit(1);
  }

  console.log(`👤 Name: ${consultation.name}`);
  console.log(`🖼️  Current has_image: ${consultation.has_image}`);
  console.log(`🔗 Current image_url: ${consultation.image_url}`);
  
  if (consultation.image_path && consultation.image_path.startsWith('data:image/')) {
    console.log("⚠️  Found Base64 data in image_path. Attempting to upload...");
    
    try {
      const publicUrl = await uploadBase64Image(consultation.image_path);
      
      if (publicUrl) {
        console.log(`✅ Image uploaded successfully: ${publicUrl}`);
        
        // Update the record
        await db.update(consultations)
          .set({ 
            image_path: publicUrl,
            image_url: publicUrl,
            has_image: true
          })
          .where(eq(consultations.id, id));
          
        console.log("💾 Database updated with new image URL.");
      } else {
        console.error("❌ Upload failed (returned null).");
      }
    } catch (error) {
      console.error("❌ Error during upload:", error);
    }
  } else {
    console.log("ℹ️  image_path is not a Base64 string. No action needed or data missing.");
    console.log(`   Value start: ${consultation.image_path?.substring(0, 50)}...`);
  }
  
  process.exit(0);
}

fixToeny().catch(console.error);
