import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { createReadStream, statSync } from 'fs';
import { Readable } from 'stream';
import path from 'path';

/**
 * Enriches consultation data with proper clinic routing information
 * @param data - The consultation data to enrich
 * @returns Enriched data with clinic routing fields
 */
/**
 * Enriches consultation data with proper clinic routing information
 * Ensures all submissions have the correct routing fields for Nail Surgery Clinic
 */
function enrichConsultationData(data: any) {
  return {
    ...data,
    // Core routing fields
    source: 'nailsurgery',
    chatbotSource: 'nailsurgery',
    clinic_group: 'The Nail Surgery Clinic',
    clinic_domain: 'nailsurgeryclinic.engageiobots.com',
    
    // Set preferred clinic if not already set
    preferred_clinic: data.preferred_clinic || 'Nail Surgery Clinic',
    
    // Additional routing identifiers
    clinic: 'nailsurgery',
  };
}

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

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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
    let fileSize = 0;

    // Handle different input types
    if (Buffer.isBuffer(fileBuffer)) {
      data = fileBuffer;
      fileSize = fileBuffer.length;
    } else if (typeof fileBuffer === 'string') {
      // If it's a base64 string, convert to buffer
      if (fileBuffer.startsWith('data:')) {
        const base64Data = fileBuffer.split(';base64,').pop();
        data = Buffer.from(base64Data || '', 'base64');
        fileSize = data.length;
      } else {
        // If it's a file path
        try {
          const stats = statSync(fileBuffer);
          fileSize = stats.size;
        } catch (e) {
          console.warn('Could not determine file size for path:', fileBuffer);
        }
        data = createReadStream(fileBuffer);
      }
    } else {
      // It's already a Readable stream
      data = fileBuffer;
      console.warn('Uploading stream: Size validation skipped before upload.');
    }

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      console.error(`❌ Upload rejected: File size ${(fileSize / (1024 * 1024)).toFixed(2)}MB exceeds 50MB limit.`);
      return null;
    }

    const { data: uploadData, error } = await supabase.storage
      .from(storageBucket)
      .upload(filePath, data, { contentType, upsert: true });

    if (error) {
      if (error.message.includes('413') || error.message.includes('Payload Too Large')) {
         console.error('❌ Upload failed: Payload Too Large (413). File exceeds Supabase limits.');
      } else {
         console.error('Error uploading to Supabase:', error.message);
      }
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
  const portalUrl = (process.env.PORTAL_WEBHOOK_URL || 'https://eteaportal.engageiobots.com/api/webhooks/nailsurgery').trim();
  const webhookSecret = (process.env.NAIL_WEBHOOK_SECRET ?? process.env.WEBHOOK_SECRET ?? '').trim();
  
  // Check for missing webhook secret
  if (!webhookSecret) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ NAIL_WEBHOOK_SECRET missing');
    }
    return { 
      success: false, 
      message: 'NAIL_WEBHOOK_SECRET missing' 
    };
  }
  
  try {
    // Dev-only logging
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 Submitting webhook to portal...');
      console.log('  Portal URL:', portalUrl);
      console.log('  Webhook Secret:', webhookSecret.slice(0, 3) + '…');
    }
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
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('⚠️ Failed to upload image, continuing without image URL');
        }
      }
    }

    // Create FormData using Node 18 built-in FormData
    const formData = new FormData();
    
    // Enrich the data with clinic routing information
    const enrichedData = enrichConsultationData(data);

    // Log the data being sent (dev only)
    if (process.env.NODE_ENV !== 'production') {
      console.log('📤 Webhook Payload:');
      console.log('Original data:', JSON.stringify(data, null, 2));
      console.log('Enriched data:', JSON.stringify(enrichedData, null, 2));
    }
    
    // Add each field individually to the root of the FormData
    console.log('🔍 FormData Construction:');
    Object.entries(enrichedData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
        console.log(`  - Adding field "${key}": ${typeof value === 'object' ? JSON.stringify(value) : value}`);
      }
    });
    
    // Log the final FormData entries
    console.log('📦 Final FormData fields:');
    console.log('  Fields added:', Object.keys(enrichedData).filter(key => enrichedData[key] != null));
    
    // If we have image data, add it as a file field
    if (imageData) {
      const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const base64Data = matches[2];
        const contentType = matches[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Create a Blob from the buffer for the FormData
        const blob = new Blob([buffer], { type: contentType });
        formData.append('image', blob, 'patient_image.png');
      }
    }
    
    // Make the request using fetch with FormData
    const response = await fetch(portalUrl, {
      method: 'POST',
      headers: {
        'X-Webhook-Secret': webhookSecret
        // Don't set Content-Type header - let fetch set it automatically for FormData
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

/**
 * Test function to verify webhook submission
 */
export async function testWebhookSubmission(): Promise<void> {
  const testData = {
    // Patient Information
    name: 'test patient',
    email: 'test@nailsurgery.test',
    phone: '07123456789',
    
    // Consultation Details
    issue_category: 'Ingrown Toenail',
    issue_specifics: 'webhook test submission',
    symptom_description: 'webhook test submission - testing clinic group routing',
    preferred_clinic: 'Nail Surgery Clinic',
    
    // Routing Information
    source: 'nailsurgery',
    chatbotSource: 'nailsurgery',
    clinic_group: 'The Nail Surgery Clinic',
    clinic_domain: 'nailsurgeryclinic.engageiobots.com',
    
    // Test Flags
    test_mode: true,
    is_test: true
  };
  
  console.log('\n🧪 STARTING WEBHOOK TEST');
  console.log('📅 Test Timestamp:', new Date().toISOString());
  console.log('\n📋 Test Data:');
  Object.entries(testData).forEach(([key, value]) => {
    console.log(`  ${key.padEnd(20)}: ${value}`);
  });
  
  // Create a simple test image (a small red square)
  // We'll include a unique timestamp in the test image name
  const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
  const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RjlCOUI0QjAwRDY2MTFFNThCOThDMUVBNjk1RkE4MDIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RjlCOUI0QjEwRDY2MTFFNThCOThDMUVBNjk1RkE4MDIiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpGOUI5QjRBRTBENjYxMUU1OEI5OEMxRUE2OTVGQTgwMiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpGOUI5QjRBRjBENjYxMUU1OEI5OEMxRUE2OTVGQTgwMiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PgH//v38+/r5+Pf29fTz8vHw7+7t7Ovq6ejn5uXk4+Lh4N/e3dzb2tnY19bV1NPS0dDPzs3My8rJyMfGxcTDwsHAv769vLu6ubi3trW0s7KxsK+urayrqqmop6alpKOioaCfnp2cm5qZmJeWlZSTkpGQj46NjIuKiYiHhoWEg4KBgH9+fXx7enl4d3Z1dHNycXBvbm1sa2ppaGdmZWRjYmFgX15dXFtaWVhXVlVUU1JRUE9OTUxLSklIR0ZFRENCQUA/Pj08Ozo5ODc2NTQzMjEwLy4tLCsqKSgnJiUkIyIhIB8eHRwbGhkYFxYVFBMSERAPDg0MCwoJCAcGBQQDAgEAACH5BAEAAAAALAAAAAAUABQAAAaQQIBwSCwaj8ikcslsOp/QqHRKrVqv2Kx2y+16v+CweEwum8/otHrNbrvf8Lh8Tq/b7/i8fs/v+/+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/wADChxIsKDBgwgTKlzIsKHDhxAjSpxIsaLFixgzatzIsaPHjyBDihxJsqTJkyhTqlzJsqXLlzBjypxJs6bNmzhz6tzJs6fPn0CDCh1KtKjRo0iTKl3KtKnTp1CjSp1KtarVq1izat3KtavXr2DDih1LtqzZs2jTql3Ltq3bt3Djyp1Lt67du3jz6t3Lt6/fv4ADCx5MuLDhw4gTK17MuLHjx5AjS55MubLly5gza97MubPnz6BDix5NurTp06hTq17NurXr17Bjy55Nu7bt27hz697Nu7fv38CDCx9OvLjx48iTK1/OvLnz59CjS59Ovbr169iza9/Ovbv37+DDix9Pvrz58+jTq1/Pvr379/Djy59Pv779+/jz69/Pv7///wAGKOCABBZo4IEIJqjgggw26OCDEEYo4YQUVmjhhRhmqOGGHHbo4YcghijiiCSWaOKJKKao4oostujiizDGKOOMNNZo44045qjjjjz26OOPQAYp5JBEFmnkkUgmqeSSTDbp5JNQRinllFRWaeWVWGap5ZZcdunll2CGKeaYZJZp5plopqnmmmy26eabcMYp55x01mnnnXjmqeeefPbp55+ABirooIQWauihiCaq6KKMNuroo5BGKumklFZq6aWYZqrpppx26umnoIYq6qiklmrqqaimquqqrLbq6quwxirrrLTWauutuOaq66689urrr8AGK+ywxBZr7LHIJqvsssw26+yz0EYr7bTUVmvttdhmq+223Hbr7bfghivuuOSWa+656Kar7rrstuvuu/DGK++89NZr77345qvvvvz26++/AAcs8MAEF2zwwQgnrPDCDDfs8MMQRyzxxBRXbPHFGGes8cYcd+zxxyCHLPLIJJds8skop6zyyiy37PLLMMcs88w012zzzTjnrPPOPPfs889ABy300EQXbfTRSCet9NJMN+3001BHLfXUVFdt9dVYZ6311lx37fXXYIct9thkl2322WinrfbabLft9ttwxy333HTXbffdeOet99589+3334AHLvjghBdu+OGIJ6744ow37vjjkEcu+eSUV2755ZhnrvnmnHfu+eeghy766KSXbvrpqKeu+uqst+7667DHLvvstNdu++2456777rz37vvvwAcv/PDEF2/88cgnr/zyzDfv/PPQRy/99NRXb/312Gev/fbcd+/99+CHL/745Jdv/vnop6/++uy37/778Mcv//z012///fjnr//+/Pfv//8ADKAAB0jAAhrwgAhMoAIXyMAGOvCBEIygBCdIwQpa8IIYzKAGN8jBDnrwgyAMoQhHSMISmvCEKEyhClfIwha68IUwjKEMZ0jDGtrwhjjMoQ53yMMe+vCHQAyiEIdIxCIa8YhITKISl8jEJjrxiVCMohSnSMUqWvGKWMyiFrfIxS568YtgDKMYx0jGMprxjGhMoxrXyMY2uvGNcIyjHOdIxzra8Y54zKMe98jHPvrxj4AMpCAHSchCGvKQiEykIhfJyEY68pGQjKQkJ0nJSlrykpjMpCY3yclOevKToAylKEdJylKa8pSoTKUqV8nKVrrylbCMpSxnScta2vKWuMylLnfJy1768pfADKYwh0nMYhrzmMhMpjKXycxmOvOZ0IymNKdJzWpa85rYzKY2t8nNbnrzm+AMpzjHSc5ymvOc6EynOtfJzna6853wjKc850nPetrznvjMpz73yc9++vOfAA2oQAdK0IIa9KAITahCF8rQhjr0oRCNqEQnStGKWvSiGM2oRjfK0Y569KMgDalIR0rSkpr0pChNqUpXytKWuvSlMI2pTGdK05ra9KY4zalOd8rTnvr0p0ANqlCHStSiGvWoSE2qUpfK1KY69alQjapUp0rVqlr1qljNqla3ytWuevWrYA2rWMdK1rKa9axoTata18rWtrr1rXCNq1znSte62vWueM2rXvfK17769a+ADaxgB0vYwhr2sIhNrGIXy9jGOvaxkI2sZCdL2cpa9rKYzaxmN8vZznr2s6ANrWhHS9rSmva0qE2talfL2ta69rWwja1sZ0vb2tr2trjNrW53y9ve+va3wA2ucIdL3OIa97jITa5yl8vc5jr3udCNrnSnS93qWve62M2udrfL3e5697vgDa94x0ve8pr3vOhNr3rXy972uve98I2vfOdL3/ra9774za9+98vf/vr3vwAOsIAHTOACG/jACE6wghfM4AY7+MEQjrCEJ0zhClv4whjOsIY3zOEOe/jDIA6xiEdM4hKb+MQoTrGKV8ziFrv4xTCOsYxnTOMa2/jGOM6xjnfM4x77+MdADrKQh0zkIhv5yEhOspKXzOQmO/nJUI6ylKdM5Spb+cpYzrKWt8zlLnv5y2AOs5jHTOYym/nMaE6zmtfM5ja7+c1wjrOc50znOtv5znjOs573zOc++/nPgA60oAdN6EIb+tCITrSiF83oRjv60ZCOtKQnTelKW/rSmM60pjfN6U57+tOgDrWoR03qUpv61KhOtapXzepWu/rVsI61rGdN61rb+ta4zrWud83rXvv618AOtrCHTexiG/vYyE62spfN7GY7+9nQjra0p03talv72tjOtra3ze1ue/vb4A63uMdN7nKb+9zoTre6183udrv73fCOt7znTe962/ve+M63vvfN7377+98AD7jAB07wghv84AhPuMIXzvCGO/zhEI+4xCdO8Ypb/OIYz7jGN87xjnv84yAPuchHTvKSm/zkKE+5ylfO8pa7/OUwj7nMZ07zmtv85jjPuc53zvOe+/znQA+60IdO9KIb/ehIT7rSl870pjv96VCPutSnTvWqW/3qWM+61rfO9a57/etgD7vYx072spv97GhPu9rXzva2u/3tcI+73OdO97rb/e54z7ve9873vvv974APvOAHT/jCG/7wiE+84hfP+MY7/vGQj7zkJ0/5ylv+8pjPvOY3z/nOe/7zoA+96EdP+tKb/vSoT73qV8/61rv+9bCPvexnT/va2/72uM+97nfP+977/vfAD77wh0/84hv/+MhPvvKXz/zmO//50I++9KdP/epb//rYz772t8/97nv/++APv/jHT/7ym//86E+/+tfP/va7//3wj7/850//+tv//vjPv/73z//++///ABiAApiACliACJiACriADNiADviAEBiBEjiBFFiBFniBGJiBGriBHNiBHviBIBiCIjiCJFiCJniCKJiCKriCLNiCLviCMBiDMjiDNFiDNniDOJiDOriDPNiDPviDQBiEQjiERFiERniESJiESriETNiETviEUBiFUjiFVFiFVniFWJiFWriFXNiFXviFYBiGYjiGZFiGZniGaJiGariGbNiGbviGcBiHcjiHdFiHdniHeJiHeriHfNiHfviHgBiIgjiIhFiIhniIiJiIiriIjNiIjviIkBiJkjiJlFiJlniJmJiJmriJnNiJnviJoBiKojiKpFiKpniKqJiKqriKrNiKrviKsBiLsjiLtFiLtniLuJiLuriLvNiLvviLwBiMwjiMxFiMxniMyJiMyriMzNiMzviM0BiN0jiN1FiN1niN2JiN2riN3NiN3viN4BiO4jiO5FiO5niO6JiO6riO7NiO7viO8BiP8jiP9FiP9niP+JiP+riP/NiP/viPABmQAjmQBFmQBnmQCJmQCrmQDNmQDvmQEBmREjmRFFmRFnmRGJmRGrmRHNmRHvmRIBmSIjmSJFmSJnmSKJmSKrmSLNmSLvmSMBmTMjmTNFmTNnmTOJmTOrmTPNmTPvmTQBmUQjmURFmURnmUSJmUSrmUTNmUTvmUUBmVUjmVVFmVVnmVWJmVWrmVXNmVXvmVYBmWYjmWZFmWZnmWaJmWarmWbNmWbvmWcBmXcjmXdFmXdnmXeJmXermXfNmXfvmXgBmYgjmYhFmYhnmYiJmYirmYjNmYjvmYkBmZkjmZlFmZlnmZmJmZmrmZnNmZnvmZoBmaohmZCQAAOw==';
  
  const result = await submitWebhook(testData, testImageBase64);
  
  console.log('\n📊 Test Results:');
  console.log('Success:', result.success ? '✅' : '❌');
  console.log('Message:', result.message);
  if (result.response) {
    console.log('\nResponse Details:');
    console.log(JSON.stringify(result.response, null, 2));
  }
  
  console.log('\n🏁 TEST COMPLETE\n');
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