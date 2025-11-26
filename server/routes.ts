import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import * as schema from "../shared/schema.js";
import { z } from "zod";
import { generateNurseImage } from "./services/imageGeneration.js";
import { analyzeFootImage } from "./services/openai.js";
import { analyzeSymptoms } from "./services/symptomAnalysis.js";
import { exportConsultationsToCSV, exportSingleConsultationToCSV } from "./services/csvExport.js";
import { submitWebhook, uploadBase64Image, testWebhookSubmission } from "./supabase.js";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiPrefix = "/api";

  // Helper to handle base64 image uploads
  async function handleImageUpload(data: any) {
    if (data.image_path && typeof data.image_path === 'string' && data.image_path.startsWith('data:image/')) {
      try {
        console.log(`[Image Handler] Uploading base64 image...`);
        const publicUrl = await uploadBase64Image(data.image_path);
        if (publicUrl) {
          console.log(`[Image Handler] Image uploaded successfully: ${publicUrl}`);
          data.image_path = publicUrl;
          data.image_url = publicUrl;
          data.has_image = true;
        }
      } catch (error) {
        console.error(`[Image Handler] Error uploading image:`, error);
      }
    }
    return data;
  }

    // Test endpoint for webhook submission with payload inspection
    app.post(`${apiPrefix}/test-webhook`, async (_req, res) => {
      try {
        const testData = {
          name: 'Test Patient',
          email: 'test@example.com',
          phone: '07123456789',
          issue_category: 'nail_problem',
          issue_specifics: 'Test webhook submission',
          test_mode: true
        };

        console.log('🧪 Test webhook preparation:');
        console.log('1. Original test data:', testData);
        // Create a mock submission without actually sending
        const enrichedData = {
          ...testData,
          source: 'nailsurgery',
          chatbotSource: 'nailsurgery',
          clinic_group: 'The Nail Surgery Clinic',
          clinic_domain: 'nailsurgeryclinic.engageiobots.com',
        };
        console.log('2. Enriched data:', enrichedData);
        // Now actually send the webhook
        const result = await submitWebhook(enrichedData);
        res.status(200).json({ 
          message: "Webhook test completed",
          testData,
          enrichedData,
          webhook_url: process.env.PORTAL_WEBHOOK_URL,
          result
        });
      } catch (error) {
        console.error("❌ Test webhook error:", error);
        res.status(500).json({ error: "Test webhook failed", details: error instanceof Error ? error.message : String(error) });
      }
    });

  app.get(`${apiPrefix}/health`, async (_req, res) => {
    res.json({ ok: true, service: "nail-surgery-bot" });
  });

  app.get(`${apiPrefix}/chatbot-settings`, async (req, res) => {
    try {
      const domain = process.env.PUBLIC_BOT_DOMAIN || 'nailsurgeryclinic.engageiobots.com';
      const portalUrl = process.env.PORTAL_URL || 'https://etea-multi-clinic-portal-nialldmcdowell.replit.app';
      const response = await fetch(`${portalUrl}/api/chatbot/settings?domain=${domain}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Failed to fetch chatbot settings:', error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.get(`${apiPrefix}/nurse-image`, async (_req, res) => {
    try {
      const imageBase64 = await generateNurseImage();
      res.json({ imageBase64 });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate nurse image" });
    }
  });

  app.post(`${apiPrefix}/consultations`, async (req, res) => {
    try {
      const validatedData = schema.insertConsultationSchema.parse(req.body);
      
      // Ensure image is uploaded if present as base64
      await handleImageUpload(validatedData);
      
      const newConsultation = await storage.createConsultation(validatedData);
      res.status(201).json(newConsultation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Webhook alias for consultation creation
  app.post(`${apiPrefix}/webhook/consultation`, async (req, res) => {
    try {
      const validatedData = schema.insertConsultationSchema.parse(req.body);
      
      // Ensure image is uploaded if present as base64
      await handleImageUpload(validatedData);
      
      const newConsultation = await storage.createConsultation(validatedData);
      res.status(201).json(newConsultation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // âœ… NEW: Partial sync route to support chatbot field syncing
  app.post(`${apiPrefix}/webhook/partial`, async (req, res) => {
    try {
      const { field, value, consultationData, consultationId } = req.body;

      if (!field || typeof value === "undefined") {
        return res.status(400).json({ error: "Missing field or value" });
      }

      console.log(`[Partial Sync] ${field}: ${value}`);

      // Final submission logic (unchanged)
      if (consultationData && field === 'final_submission') {
        console.log("[Final Submission] Saving complete consultation to database");
        const validatedData = schema.insertConsultationSchema.parse(consultationData);
        
        // Capture base64 image for webhook submission before we convert it to URL
        const originalImage = (validatedData.image_path && typeof validatedData.image_path === 'string' && validatedData.image_path.startsWith('data:image/')) 
          ? validatedData.image_path 
          : undefined;

        // Ensure image is uploaded to our storage and data updated with URL
        await handleImageUpload(validatedData);
        
        const newConsultation = await storage.createConsultation(validatedData);
        console.log(`Consultation saved with ID: ${newConsultation.id}`);
        try {
          // Pass the original base64 so it can be attached as a file to the webhook
          // The validatedData now contains the image_url from handleImageUpload
          const webhookResult = await submitWebhook(validatedData, originalImage);
          if (webhookResult.success) {
            console.log("✅ Portal webhook forwarding successful");
          } else {
            console.warn("⚠️ Portal webhook forwarding failed:", webhookResult.message);
          }
        } catch (webhookError) {
          console.error("❌ Portal webhook error:", webhookError);
        }
        return res.status(201).json({
          success: true,
          consultation: newConsultation,
          message: "Consultation saved successfully"
        });
      }

      // Progressive save logic: upsert (create or update) consultation record
      let upsertedConsultation = null;
      
      // Handle image upload if present in partial update
      let updateData: any = { [field]: value };
      if (field === 'image_path' && typeof value === 'string' && value.startsWith('data:image/')) {
        try {
          console.log(`[Partial Sync] Uploading image...`);
          const publicUrl = await uploadBase64Image(value);
          if (publicUrl) {
            console.log(`[Partial Sync] Image uploaded successfully: ${publicUrl}`);
            updateData = { 
              image_path: publicUrl,
              image_url: publicUrl,
              has_image: true
            };

            // NEW: Send to portal immediately if we have enough context
            // This ensures the portal gets the image even if the user drops off later
            if (consultationData) {
              console.log("[Partial Sync] Attempting to sync image to portal immediately...");
              
              // Construct a payload with the new image URL
              const webhookPayload = {
                ...consultationData,
                ...updateData // This overrides image_path with the URL
              };

              // We call submitWebhook. Since we already have the URL in webhookPayload.image_url (via updateData),
              // we don't need to pass the base64 as the second argument.
              // submitWebhook will see the URL and use it.
              submitWebhook(webhookPayload).then(result => {
                if (result.success) {
                  console.log("✅ [Partial Sync] Image synced to portal successfully");
                } else {
                  console.warn("⚠️ [Partial Sync] Failed to sync image to portal:", result.message);
                }
              }).catch(err => {
                console.error("❌ [Partial Sync] Error syncing image to portal:", err);
              });
            }
          }
        } catch (error) {
          console.error(`[Partial Sync] Error uploading image:`, error);
        }
      }

      if (consultationId) {
        // Update existing consultation (non-destructive)
        try {
          upsertedConsultation = await storage.updateConsultation(Number(consultationId), updateData);
          console.log(`[Progressive Save] Updated consultation ID: ${consultationId} with { ${field}: ${JSON.stringify(value).substring(0, 50)}... }`);
        } catch (err) {
          console.error(`[Progressive Save] Failed to update consultation ID: ${consultationId}`, err);
        }
      } else if (consultationData) {
        // Create new consultation if no ID (first milestone)
        try {
          // Accept partial/incomplete data for progressive save (no strict validation)
          upsertedConsultation = await storage.createConsultation({ ...consultationData, ...updateData });
          console.log(`[Progressive Save] Created new consultation with { ${field}: ${JSON.stringify(value).substring(0, 50)}... }`);
        } catch (err) {
          console.error(`[Progressive Save] Failed to create consultation`, err);
        }
      }

      res.status(200).json({ success: true, consultation: upsertedConsultation });
    } catch (error) {
      console.error("Error in /webhook/partial:", error);
      res.status(500).json({ error: "Failed to sync partial field" });
    }
  });

  app.patch(`${apiPrefix}/consultations/:id`, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID format" });

    const consultation = await storage.getConsultationById(id);
    if (!consultation) return res.status(404).json({ error: "Consultation not found" });

    // Handle image upload if present
    if (req.body.image_path && req.body.image_path.startsWith('data:image/')) {
      try {
        console.log(`[PATCH] Uploading image for consultation ${id}...`);
        const publicUrl = await uploadBase64Image(req.body.image_path);
        if (publicUrl) {
          console.log(`[PATCH] Image uploaded successfully: ${publicUrl}`);
          req.body.image_url = publicUrl;
          // Update image_path to be the URL as well, to avoid storing base64 in DB
          req.body.image_path = publicUrl; 
          req.body.has_image = true;
        } else {
          console.error(`[PATCH] Failed to upload image for consultation ${id}`);
        }
      } catch (error) {
        console.error(`[PATCH] Error uploading image:`, error);
      }
    }

    const updated = await storage.updateConsultation(id, req.body);
    res.status(200).json(updated);
  });

  app.get(`${apiPrefix}/consultations`, async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const consultations = await storage.getAllConsultations(page, limit);
    res.status(200).json(consultations);
  });

  app.get(`${apiPrefix}/consultations/:id`, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID format" });

    const consultation = await storage.getConsultationById(id);
    if (!consultation) return res.status(404).json({ error: "Consultation not found" });

    res.status(200).json(consultation);
  });

  app.post(`${apiPrefix}/analyze-foot-image`, async (req, res) => {
    const TIMEOUT_MS = 15000;
    let sent = false;

    const timeout = setTimeout(() => {
      if (!sent) {
        sent = true;
        console.log("Image analysis timeout reached");
        res.status(408).json({
          error: "Image analysis timeout",
          fallback: {
            condition: "Analysis taking too long",
            severity: "unknown",
            recommendations: ["Please describe your symptoms instead"],
          },
        });
      }
    }, TIMEOUT_MS);

    try {
      console.log("Processing image analysis request...");
      const { imageBase64, consultationId } = req.body;

      if (!imageBase64) {
        console.error("No image data provided");
        throw new Error("Image data required");
      }

      console.log("Image data received, length:", imageBase64.length);
      console.log("Cleaned image data, calling analyzeFootImage...");

      const analysis = await analyzeFootImage(imageBase64);

      console.log("Analysis result from OpenAI service:", analysis);

      if (consultationId && !isNaN(parseInt(consultationId))) {
        await storage.updateConsultation(parseInt(consultationId), {
          image_analysis: JSON.stringify(analysis),
        });
      }

      if (!sent) {
        clearTimeout(timeout);
        sent = true;
        res.status(200).json(analysis);
      }
    } catch (error) {
      console.error("Image analysis error in route:", error);
      if (!sent) {
        clearTimeout(timeout);
        sent = true;
        res.status(500).json({
          error: "Failed to analyze image",
          details: error instanceof Error ? error.message : String(error),
          fallback: {
            condition: "Unable to analyze image",
            severity: "unknown",
            recommendations: [
              "Describe symptoms in detail",
              "Visit a clinic for assessment"
            ],
          },
        });
      }
    }
  });

  app.post(`${apiPrefix}/analyze-symptoms`, async (req, res) => {
    const TIMEOUT_MS = 15000;
    let sent = false;

    const timeout = setTimeout(() => {
      if (!sent) {
        sent = true;
        res.status(408).json({
          error: "Request timeout",
          fallback: {
            potentialConditions: ["Unable to analyze symptoms"],
            recommendation: "Visit the clinic",
          },
        });
      }
    }, TIMEOUT_MS);

    try {
      const { symptoms, consultationId } = req.body;
      if (!symptoms) throw new Error("Symptoms required");

      const analysis = await analyzeSymptoms(symptoms);

      if (consultationId && !isNaN(parseInt(consultationId))) {
        await storage.updateConsultation(parseInt(consultationId), {
          symptom_analysis: JSON.stringify(analysis),
        });
      }

      if (!sent) {
        clearTimeout(timeout);
        sent = true;
        res.status(200).json(analysis);
      }
    } catch (error) {
      if (!sent) {
        clearTimeout(timeout);
        sent = true;
        res.status(500).json({
          error: "Failed to analyze symptoms",
          fallback: {
            potentialConditions: ["Unable to analyze symptoms"],
            recommendation: "Visit the clinic",
          },
        });
      }
    }
  });

  app.get(`${apiPrefix}/consultations/export/csv`, async (_req, res) => {
    try {
      const consultations = await storage.getAllConsultations();
      if (!consultations.length) {
        return res.status(404).json({ error: "No consultations found" });
      }

      const pathToFile = await exportConsultationsToCSV(consultations);
      res.download(pathToFile, path.basename(pathToFile));
    } catch (error) {
      res.status(500).json({ error: "CSV export failed" });
    }
  });

  app.get(`${apiPrefix}/consultations/:id/export/csv`, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const consultation = await storage.getConsultationById(id);
    if (!consultation) return res.status(404).json({ error: "Consultation not found" });

    try {
      const pathToFile = await exportSingleConsultationToCSV(consultation);
      res.download(pathToFile, path.basename(pathToFile));
    } catch (error) {
      res.status(500).json({ error: "CSV export failed" });
    }
  });

  // Webhook proxy to avoid CORS issues - Updated to use Supabase
  app.post(`${apiPrefix}/webhook-proxy`, async (req, res) => {
    try {
      // Validate payload against schema
      const validatedData = schema.insertConsultationSchema.parse(req.body);

      console.log("ðŸ”„ Proxying webhook to external server using Supabase...");
      
      // Check if we have image data to include
      let imageBase64: string | undefined = undefined;
      if (validatedData.has_image && validatedData.image_path) {
        try {
          // If image_path is base64 data, use it directly
          if (validatedData.image_path.startsWith('data:image/')) {
            imageBase64 = validatedData.image_path;
          } else {
            // Otherwise, try to read the file
            console.log("ðŸ“¸ Processing local image for webhook...");
            // We'll keep the image_path in the payload for reference
          }
        } catch (imageError) {
          console.error("âš ï¸ Error processing image:", imageError);
          // Continue without the image
        }
      }

      // Submit the webhook with the validated data and image (if available)
      const webhookResult = await submitWebhook(validatedData, imageBase64);
      
      if (webhookResult.success) {
        console.log("âœ… External webhook success");
        res.status(200).json({
          message: "Webhook submitted successfully",
          response: webhookResult.response
        });
      } else {
        console.error("âŒ External webhook failed:", webhookResult.message);
        res.status(200).json({
          message: "Webhook attempted",
          warning: webhookResult.message,
          details: webhookResult.response
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("âŒ Webhook proxy error:", error);
      res.status(200).json({
        message: "Webhook attempted",
        warning: "External server connection failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Test endpoint for webhook submission
  app.post(`${apiPrefix}/test-webhook`, async (_req, res) => {
    try {
      await testWebhookSubmission();
      res.status(200).json({ message: "Webhook test completed, check server logs for details" });
    } catch (error) {
      console.error("âŒ Test webhook error:", error);
      res.status(500).json({ error: "Test webhook failed", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Dev-only debug endpoint for webhook testing
  app.get(`${apiPrefix}/debug/test-webhook`, async (_req, res) => {
    // Allow in development or when ENABLE_DEBUG is set
    if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG) {
      return res.status(404).json({ error: "Not found" });
    }

    try {
      console.log('🧪 Debug webhook test initiated...');
      
      const testData = {
        // Required fields
        name: 'Debug Test Patient',
        email: 'debug-test@example.com',
        phone: '07999123456',
        
        // Core consultation data
        issue_category: 'Ingrown Toenail',
        symptom_description: 'Debug webhook test - patient experiencing pain and swelling around toenail',
        issue_specifics: 'Debug webhook test from GET endpoint',
        
        // Clinical data
        previous_treatment: 'None attempted',
        pain_severity: '7/10',
        pain_duration: '2 weeks',
        
        // Clinic routing 
        source: 'nailsurgery',
        chatbotSource: 'nailsurgery',
        clinic_group: 'The Nail Surgery Clinic',
        clinic_domain: 'nailsurgeryclinic.engageiobots.com',
        preferred_clinic: 'Main Office',
        
        // Internal tracking
        test_mode: true
      };

      // Create a simple test image (small red square)
      const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4xMK0KCsAAAAFCSURBVDhPtZS9TsMwFEa9gQMzA2JhYU8kYGEAqVKnSiUzO+9TsYLUggEWGGBg4MGYmBgRM1CWwrFCHH/FKfiTjuTY95x7HefaCl20t3Hdrx/zzDwiT/TMz+k1MKwvyevsZ57xLcvyO/K28V2v+Gkc5cWxOQ0tJ5RQmm6XqCyL3kq1uKXFtawSg1GwCd+mNTnVNV1UqNInbj6wZcbA+tu0IPgR31IZ7YHnMB+ZP6bFOGi28bMQOOQ/s0xn0lJT4DmYtIc6i0PSzh5GGrjl+8vXUk9JuXYKZu0V6pcCw5HvmkBaXO0MXPI/RVFcNYFZlj3SepdgcTz1vgnUXHDHt/JQWm0FQGGPfM8YalIGloLZtIsKbSEQzi4FbooT+ovUw/GDdKD5sT7KY5uQVraGLP2WaOWs/1j3/D/tSJj/3Ku3RP+u5L0LAAIqvyPw2IcAAAAASUVORK5CYII=';

      // Call the updated submitWebhook function
      const result = await submitWebhook(testData, testImageBase64);
      
      console.log('🧪 Debug test result:', JSON.stringify(result, null, 2));
      
      // Return the raw webhook response JSON for easier debugging
      res.status(200).json({
        message: "Debug webhook test completed",
        testData,
        webhookResponse: result.response,  // Raw response from webhook
        result,  // Full result object
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("❌ Debug webhook test error:", error);
      res.status(500).json({ 
        error: "Debug webhook test failed", 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  const server = createServer(app);
  return server;
}
