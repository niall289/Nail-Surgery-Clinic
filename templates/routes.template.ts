import { Express, Request, Response } from 'express';
import { Server } from 'http';
import * as z from 'zod';
import * as storage from './storage';
import { submitWebhook } from './supabase';
import { insertConsultationSchema } from '../shared/schema';

// TEMPLATE: Replace with clinic-specific configuration
const ENDPOINT_CONFIG = {
  apiPrefix: '/api/v1',
  webhookPath: '/webhook',
  partialPath: '/webhook/partial'
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get(`${ENDPOINT_CONFIG.apiPrefix}/health`, (_req, res) => {
    res.status(200).json({ status: 'OK' });
  });

  // Main consultation webhook endpoint
  app.post(`${ENDPOINT_CONFIG.apiPrefix}${ENDPOINT_CONFIG.webhookPath}/consultation`, async (req, res) => {
    try {
      const validatedData = insertConsultationSchema.parse(req.body);
      const newConsultation = await storage.createConsultation(validatedData);
      res.status(201).json(newConsultation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Partial sync endpoint for progressive field updates
  app.post(`${ENDPOINT_CONFIG.apiPrefix}${ENDPOINT_CONFIG.partialPath}`, async (req, res) => {
    try {
      const { field, value, consultationData, consultationId } = req.body;

      if (!field || typeof value === "undefined") {
        return res.status(400).json({ error: "Missing field or value" });
      }

      console.log(`[Partial Sync] ${field}: ${value}`);

      // Handle final submission
      if (consultationData && field === 'final_submission') {
        console.log("[Final Submission] Saving complete consultation to database");
        
        const validatedData = insertConsultationSchema.parse(consultationData);
        const newConsultation = await storage.createConsultation(validatedData);

        console.log(`✅ Consultation saved with ID: ${newConsultation.id}`);
        
        // Forward to portal webhook
        try {
          const imageData = validatedData.image_path?.startsWith('data:image/') 
            ? validatedData.image_path 
            : undefined;
            
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

      // Handle individual field updates
      const update = { [field]: value };
      
      let upsertedConsultation;
      if (consultationId) {
        // Update existing consultation
        upsertedConsultation = await storage.updateConsultation(consultationId, update);
      } else {
        // Create new consultation with single field
        upsertedConsultation = await storage.createConsultation(update);
      }

      res.status(200).json({ success: true, consultation: upsertedConsultation });
    } catch (error) {
      console.error("Error in /webhook/partial:", error);
      res.status(500).json({ error: "Failed to sync partial field" });
    }
  });

  // Get consultation by ID
  app.get(`${ENDPOINT_CONFIG.apiPrefix}/consultations/:id`, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID format" });

    const consultation = await storage.getConsultationById(id);
    if (!consultation) return res.status(404).json({ error: "Consultation not found" });

    res.status(200).json(consultation);
  });

  // Update consultation
  app.patch(`${ENDPOINT_CONFIG.apiPrefix}/consultations/:id`, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID format" });

    const consultation = await storage.getConsultationById(id);
    if (!consultation) return res.status(404).json({ error: "Consultation not found" });

    const updated = await storage.updateConsultation(id, req.body);
    res.status(200).json(updated);
  });

  // List consultations with pagination
  app.get(`${ENDPOINT_CONFIG.apiPrefix}/consultations`, async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const consultations = await storage.listConsultations(page, limit);
    res.status(200).json(consultations);
  });

  // Test webhook submission
  app.post(`${ENDPOINT_CONFIG.apiPrefix}/test-webhook`, async (_req, res) => {
    try {
      const testData = {
        name: 'Test Patient',
        email: 'test@example.com',
        phone: '07123456789',
        issue_category: 'test_category',
        issue_specifics: 'Test webhook submission',
        test_mode: true
      };

      console.log('🧪 Test webhook preparation:');
      console.log('1. Original test data:', testData);
      
      const result = await submitWebhook(testData);
      
      res.status(200).json({
        success: result.success,
        message: result.message,
        response: result.response
      });
    } catch (error) {
      console.error('❌ Test webhook error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
  });

  return server;
}