import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import FormData from 'form-data';

// TEMPLATE: Replace with clinic-specific values
const CLINIC_CONFIG = {
  name: '{{CLINIC_NAME}}',           // e.g. 'The Nail Surgery Clinic'
  source: '{{CLINIC_SOURCE}}',       // e.g. 'nailsurgery'
  chatbotSource: '{{CHATBOT_SOURCE}}', // e.g. 'nailsurgery'
  domain: '{{CLINIC_DOMAIN}}',       // e.g. 'nailsurgeryclinic.engageiobots.com'
  imagePrefix: '{{IMAGE_PREFIX}}',    // e.g. 'nail_image'
  webhookPath: '{{WEBHOOK_PATH}}'    // e.g. 'nailsurgery'
};

// Initialize Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

/**
 * Get a public URL for a file in Supabase storage
 */
export function getPublicUrl(bucket: string, filename: string): string {
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`;
}

/**
 * Upload an image file to Supabase storage
 */
export async function uploadToSupabase(
  file: Buffer,
  filename: string,
  contentType?: string
) {
  try {
    const { data, error } = await supabase
      .storage
      .from('consultation-images')
      .upload(filename, file, {
        contentType: contentType || 'image/png',
        upsert: false
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Supabase upload failed:', error);
    throw error;
  }
}

/**
 * Upload a base64 image to Supabase storage
 */
export async function uploadBase64Image(
  base64Image: string,
  prefix: string = CLINIC_CONFIG.imagePrefix
): Promise<string | null> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const filename = `${prefix}_${timestamp}_${random}.png`;

    // Extract actual base64 data if data URI
    let imageData = base64Image;
    if (base64Image.startsWith('data:')) {
      const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 image format');
      }
      imageData = matches[2];
    }

    // Upload to Supabase
    const { data, error } = await supabase
      .storage
      .from('consultation-images')
      .upload(filename, Buffer.from(imageData, 'base64'), {
        contentType: 'image/png',
        upsert: false
      });

    if (error) {
      console.error('❌ Supabase upload failed:', error.message);
      return null;
    }

    return getPublicUrl('consultation-images', filename);
  } catch (error) {
    console.error('❌ Upload exception:', error);
    return null;
  }
}

/**
 * Submit a webhook with image data to the portal
 */
export async function submitWebhook(
  data: any,
  imageData?: string
): Promise<{ success: boolean; message: string; response?: any }> {
  const portalUrl = (process.env.PORTAL_WEBHOOK_URL || `https://eteaportal.engageiobots.com/api/webhooks/${CLINIC_CONFIG.webhookPath}`).trim();
  const webhookSecret = (process.env.WEBHOOK_SECRET || '').trim();

  if (!webhookSecret) {
    console.error('❌ WEBHOOK_SECRET missing');
    return { success: false, message: 'WEBHOOK_SECRET missing' };
  }

  try {
    // Development logging
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 Submitting webhook to portal...');
      console.log('  Portal URL:', portalUrl);
      console.log('  Webhook Secret:', webhookSecret.slice(0, 3) + '…');
    }

    // Process image if provided
    if (imageData) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('📸 Processing image for webhook...');
      }
      const imageUrl = await uploadBase64Image(imageData);
      
      if (imageUrl) {
        data.image_url = imageUrl;
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ Image uploaded and URL added to payload');
        }
      }
    }

    // Enrich data with clinic information
    const enrichedData = {
      ...data,
      source: CLINIC_CONFIG.source,
      chatbotSource: CLINIC_CONFIG.chatbotSource,
      clinic_group: CLINIC_CONFIG.name,
      clinic_domain: CLINIC_CONFIG.domain
    };

    // Development logging
    if (process.env.NODE_ENV !== 'production') {
      console.log('📦 Webhook payload preparation:');
      console.log('Original data:', JSON.stringify(data, null, 2));
      console.log('Enriched data:', JSON.stringify(enrichedData, null, 2));
    }

    // Create FormData and add fields
    const formData = new FormData();
    Object.entries(enrichedData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
        if (process.env.NODE_ENV !== 'production') {
          console.log(`  - Adding field "${key}": ${typeof value === 'object' ? JSON.stringify(value) : value}`);
        }
      }
    });

    // Submit webhook
    const response = await fetch(portalUrl, {
      method: 'POST',
      headers: {
        'X-Webhook-Secret': webhookSecret,
        ...formData.getHeaders?.()
      },
      body: formData
    });

    // Parse response
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { rawResponse: responseText.substring(0, 200) };
    }

    if (response.ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Webhook submission successful');
      }
      return {
        success: true,
        message: 'Webhook submitted successfully',
        response: responseData
      };
    } else {
      console.error(`❌ Webhook submission failed: ${response.status} ${response.statusText}`);
      return {
        success: false,
        message: `Webhook failed: ${response.status} ${response.statusText}`,
        response: responseData
      };
    }
  } catch (error) {
    console.error('❌ Exception in webhook submission:', error);
    return {
      success: false,
      message: `Webhook exception: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Export all functions
export default {
  supabase,
  uploadToSupabase,
  getPublicUrl,
  uploadBase64Image,
  submitWebhook
};