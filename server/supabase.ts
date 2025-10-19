import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import path from 'path';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket = process.env.SUPABASE_BUCKET || 'triageimages';

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase credentials not provided. Some functionality may be limited.');
}

// Create Supabase client with error handling
export const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : null;

/**
 * Upload a file to Supabase storage
 * @param fileBuffer - Buffer containing the file data
 * @param fileName - Original file name or desired name
 * @param contentType - MIME type of the file
 * @returns URL of the uploaded file or null if failed
 */
export async function uploadToSupabase(
  fileBuffer: Buffer | string | Readable,
  fileName: string,
  contentType: string = 'image/png'
): Promise<string | null> {
  if (!supabase) {
    console.warn('Supabase client not initialized. File upload skipped.');
    return null;
  }

  try {
    // Create a clean file name with extension
    const fileExtension = path.extname(fileName) || '.png';
    const cleanFileName = `${randomUUID()}${fileExtension}`;
    
    // Current date info for path
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Create a path like 2025/10/[uuid].png
    const filePath = `${year}/${month}/${cleanFileName}`;
    
    let data;

    // Handle different input types
    if (Buffer.isBuffer(fileBuffer)) {
      data = fileBuffer;
    } else if (typeof fileBuffer === 'string') {
      // If it's a base64 string, convert to buffer
      if (fileBuffer.startsWith('data:')) {
        const base64Data = fileBuffer.split(';base64,').pop();
        data = Buffer.from(base64Data || '', 'base64');
      } else {
        // If it's a file path
        data = createReadStream(fileBuffer);
      }
    } else {
      // It's already a Readable stream
      data = fileBuffer;
    }

    const { data: uploadData, error } = await supabase.storage
      .from(storageBucket)
      .upload(filePath, data, { contentType, upsert: true });

    if (error) {
      console.error('Error uploading to Supabase:', error.message);
      return null;
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(storageBucket)
      .getPublicUrl(filePath);
    
    console.log(`File uploaded successfully to Supabase: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('Exception in Supabase upload:', error);
    return null;
  }
}

/**
 * Get a public URL for a file in Supabase storage
 * @param filePath - Path of the file in the bucket
 * @returns Public URL of the file
 */
export function getPublicUrl(filePath: string): string | null {
  if (!supabase) {
    console.warn('Supabase client not initialized. Cannot get public URL.');
    return null;
  }

  const { data } = supabase.storage
    .from(storageBucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Upload base64 image data to Supabase
 * @param base64Image - Base64 encoded image string
 * @param prefix - Optional prefix for the file name
 * @returns Public URL of the uploaded image or null if failed
 */
export async function uploadBase64Image(
  base64Image: string, 
  prefix: string = 'nail_image'
): Promise<string | null> {
  if (!base64Image) {
    console.warn('No image data provided for upload.');
    return null;
  }

  try {
    // Extract content type and base64 data
    const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      console.error('Invalid base64 format');
      return null;
    }
    
    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate filename with timestamp
    const fileName = `${prefix}_${Date.now()}.${contentType.split('/')[1] || 'png'}`;
    
    return await uploadToSupabase(buffer, fileName, contentType);
  } catch (error) {
    console.error('Error processing base64 image:', error);
    return null;
  }
}

/**
 * Submit a webhook with image data to the portal
 * @param data - The consultation data to submit
 * @param imageData - Optional base64 image data
 * @returns Response from the webhook endpoint
 */
export async function submitWebhook(
  data: any, 
  imageData?: string
): Promise<{ success: boolean; message: string; response?: any }> {
  const portalWebhookUrl = process.env.PORTAL_WEBHOOK_URL || 'https://eteaportal.engageiobots.com/api/webhooks/nailsurgery';
  const webhookSecret = process.env.NAIL_WEBHOOK_SECRET || '';
  
  try {
    console.log('🔄 Submitting webhook to portal...');
    
    // Upload image to Supabase if provided and add URL to data
    if (imageData) {
      console.log('📸 Processing image for webhook...');
      const imageUrl = await uploadBase64Image(imageData);
      
      if (imageUrl) {
        data.image_url = imageUrl;
        console.log('✅ Image uploaded and URL added to payload');
      } else {
        console.warn('⚠️ Failed to upload image, continuing without image URL');
      }
    }

    // Create FormData using Node.js form-data package (Node 18 compatible)
    const FormData = require('form-data');
    const formData = new FormData();
    
    // Add the JSON data as a field
    formData.append('data', JSON.stringify(data));
    
    // If we have image data, add it as a file field
    if (imageData) {
      const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const base64Data = matches[2];
        const contentType = matches[1];
        const buffer = Buffer.from(base64Data, 'base64');
        formData.append('image', buffer, {
          filename: 'patient_image.png',
          contentType: contentType
        });
      }
    }
    
    // Make the request using fetch with FormData
    const response = await fetch(portalWebhookUrl, {
      method: 'POST',
      headers: {
        'X-Webhook-Secret': webhookSecret,
        ...formData.getHeaders()
      },
      body: formData
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { rawResponse: responseText.substring(0, 200) };
    }
    
    if (response.ok) {
      console.log('✅ Webhook submission successful');
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

/**
 * Test function to verify webhook submission
 */
export async function testWebhookSubmission(): Promise<void> {
  const testData = {
    name: 'Test Patient',
    email: 'test@example.com',
    phone: '07123456789',
    issue_category: 'nail_problem',
    issue_specifics: 'Test webhook submission',
    test_mode: true
  };
  
  console.log('🧪 Running webhook test with data:', testData);
  
  // Create a simple test image (a small red square)
  const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4xMK0KCsAAAAFCSURBVDhPtZS9TsMwFEa9gQMzA2JhYU8kYGEAqVKnSiUzO+9TsYLUggEWGGBg4MGYmBgRM1CWwrFCHH/FKfiTjuTY95x7HefaCl20t3Hdrx/zzDwiT/TMz+k1MKwvyevsZ57xLcvyO/K28V2v+Gkc5cWxOQ0tJ5RQmm6XqCyL3kq1uKXFtawSg1GwCd+mNTnVNV1UqNInbj6wZcbA+tu0IPgR31IZ7YHnMB+ZP6bFOGi28bMQOOQ/s0xn0lJT4DmYtIc6i0PSzh5GGrjl+8vXUk9JuXYKZu0V6pcCw5HvmkBaXO0MXPI/RVFcNYFZlj3SepdgcTz1vgnUXHDHt/JQWm0FQGGPfM8YalIGloLZtIsKbSEQzi4FbooT+ovUw/GDdKD5sT7KY5uQVraGLP2WaOWs/1j3/D/tSJj/3Ku3RP+u5L0LAAIqvyPw2IcAAAAASUVORK5CYII=';
  
  const result = await submitWebhook(testData, testImageBase64);
  
  console.log('🧪 Test result:', JSON.stringify(result, null, 2));
}

// Export a default object with all functions
export default {
  supabase,
  uploadToSupabase,
  getPublicUrl,
  uploadBase64Image,
  submitWebhook,
  testWebhookSubmission
};