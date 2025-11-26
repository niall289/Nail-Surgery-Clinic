import postgres from 'postgres';
import 'dotenv/config';
import { FormData } from 'formdata-node'; // We might need to use node-fetch or similar if native fetch isn't fully compatible with FormData in this env, but let's try native first.
import { fileFromPath } from 'formdata-node/file-from-path';

// Configuration
const PORTAL_URL = process.env.PORTAL_WEBHOOK_URL || 'https://eteaportal.engageiobots.com/api/webhooks/nailsurgery';
const WEBHOOK_SECRET = process.env.NAIL_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

if (!WEBHOOK_SECRET) {
  console.error("❌ NAIL_WEBHOOK_SECRET is not set");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function resyncConsultations() {
  try {
    console.log("🔄 Starting Portal Resync...");
    console.log(`🎯 Target: ${PORTAL_URL}`);

    // Fetch recent consultations (last 20)
    // You can adjust the LIMIT or remove the WHERE clause to sync everything
    const consultations = await sql`
      SELECT * FROM consultations 
      ORDER BY created_at DESC 
      LIMIT 20;
    `;

    console.log(`📋 Found ${consultations.length} consultations to process.`);

    for (const consultation of consultations) {
      console.log(`\n--------------------------------------------------`);
      console.log(`Processing ID: ${consultation.id} - Name: ${consultation.name || '(No Name)'}`);

      // Skip empty records (progressive saves that didn't get a name yet)
      if (!consultation.name) {
        console.log("⚠️ Skipping: No name provided.");
        continue;
      }

      // Prepare the payload
      // We need to match the structure in server/supabase.ts enrichConsultationData
      const payload: any = {
        ...consultation,
        source: 'nailsurgery',
        chatbotSource: 'nailsurgery',
        clinic_group: 'The Nail Surgery Clinic',
        clinic_domain: 'nailsurgeryclinic.engageiobots.com',
        preferred_clinic: consultation.preferred_clinic || 'Nail Surgery Clinic',
        clinic: 'nailsurgery',
        // Ensure dates are strings
        created_at: consultation.created_at ? new Date(consultation.created_at).toISOString() : new Date().toISOString(),
      };

      // Handle Image
      // If image_path is a URL (from Supabase), send it as image_url
      if (consultation.image_path && consultation.image_path.startsWith('http')) {
        payload.image_url = consultation.image_path;
      }
      // Note: If image_path is base64, we might want to upload it or send it. 
      // But usually progressive save stores it in DB. 
      // For now, we assume if it's in DB it might be a path or URL.

      // Construct FormData
      const formData = new FormData();
      
      // Add fields
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined && key !== 'conversation_log' && key !== 'completed_steps') {
           // Convert objects/arrays to string
           if (typeof value === 'object') {
             formData.append(key, JSON.stringify(value));
           } else {
             formData.append(key, String(value));
           }
        }
      });

      // Send to Portal
      try {
        const response = await fetch(PORTAL_URL, {
          method: 'POST',
          headers: {
            'X-Webhook-Secret': WEBHOOK_SECRET || ''
          },
          // @ts-ignore - FormData compatibility
          body: formData
        });

        const responseText = await response.text();
        
        if (response.ok) {
          console.log(`✅ Success! Portal responded: ${response.status}`);
        } else {
          console.error(`❌ Failed: ${response.status} - ${responseText.substring(0, 100)}`);
        }

      } catch (err) {
        console.error(`❌ Network Error:`, err);
      }
    }

  } catch (error) {
    console.error("❌ Script Error:", error);
  } finally {
    await sql.end();
  }
}

resyncConsultations();
