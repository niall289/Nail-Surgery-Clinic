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
      const { field, value, consultationData } = req.body;

      if (!field || typeof value === "undefined") {
        return res.status(400).json({ error: "Missing field or value" });
      }

      console.log(`ðŸ“¥ [Partial Sync] ${field}: ${value}`);

      // If this is a final submission with complete consultation data
      if (consultationData && field === 'final_submission') {
        console.log("ðŸ“ [Final Submission] Saving complete consultation to database");

        const validatedData = schema.insertConsultationSchema.parse(consultationData);
        const newConsultation = await storage.createConsultation(validatedData);

        console.log(`âœ… Consultation saved with ID: ${newConsultation.id}`);
        
        // Forward to portal webhook
        try {
          const imageData = validatedData.image_path?.startsWith('data:image/') ? validatedData.image_path : undefined;
          const webhookResult = await submitWebhook(validatedData, imageData);
          
          if (webhookResult.success) {
            console.log("✅ Portal webhook forwarding successful");
          } else {
            console.warn("⚠️ Portal webhook forwarding failed:", webhookResult.message);
          }
        } catch (webhookError) {
          console.error("❌ Portal webhook error:", webhookError);
          // Continue anyway - local save succeeded
        }
        return res.status(201).json({
          success: true,
          consultation: newConsultation,
          message: "Consultation saved successfully"
        });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("âŒ Error in /webhook/partial:", error);
      res.status(500).json({ error: "Failed to sync partial field" });
    }
  });

  app.patch(`${apiPrefix}/consultations/:id`, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID format" });

    const consultation = await storage.getConsultationById(id);
    if (!consultation) return res.status(404).json({ error: "Consultation not found" });

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

  const server = createServer(app);
  return server;
}
