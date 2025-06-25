import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as schema from "@shared/schema";
import { z } from "zod";
import { generateNurseImage } from "./services/imageGeneration";
import { analyzeFootImage } from "./services/openai";
import { analyzeSymptoms } from "./services/symptomAnalysis";
import { exportConsultationsToCSV, exportSingleConsultationToCSV } from "./services/csvExport";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiPrefix = "/api";

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

  // ✅ NEW: Partial sync route to support chatbot field syncing
  app.post(`${apiPrefix}/webhook/partial`, async (req, res) => {
    try {
      const { field, value } = req.body;

      if (!field || typeof value === "undefined") {
        return res.status(400).json({ error: "Missing field or value" });
      }

      console.log(`📥 [Partial Sync] ${field}: ${value}`);

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("❌ Error in /webhook/partial:", error);
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
          details: error.message,
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

  // Webhook proxy to avoid CORS issues
  app.post(`${apiPrefix}/webhook-proxy`, async (req, res) => {
    try {
      console.log("🔄 Proxying webhook to external server...");
      console.log("📤 Request payload:", JSON.stringify(req.body, null, 2));

      const response = await fetch("https://footcareclinicadmin.engageiobots.com/api/webhook/consultation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "FootCare-Clinic-Webhook/1.0"
        },
        body: JSON.stringify(req.body)
      });

      console.log("📥 Response status:", response.status, response.statusText);
      console.log("📥 Response headers:", Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log("📥 Raw response:", responseText.substring(0, 200) + "...");

      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          console.log("✅ External webhook success - JSON response");
          res.status(200).json(data);
        } catch (parseError) {
          console.log("✅ External webhook success - Non-JSON response");
          res.status(200).json({ message: "Webhook received", response: responseText.substring(0, 100) });
        }
      } else {
        console.error("❌ External webhook failed:", response.status, response.statusText);

        if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
          res.status(200).json({
            message: "Webhook submitted (server returned HTML)",
            warning: "External server may be down or misconfigured"
          });
        } else {
          res.status(response.status).json({
            error: "External webhook failed",
            details: responseText.substring(0, 200)
          });
        }
      }
    } catch (error) {
      console.error("❌ Webhook proxy error:", error);
      res.status(200).json({
        message: "Webhook attempted",
        warning: "External server connection failed",
        error: error.message
      });
    }
  });

  const server = createServer(app);
  return server;
}
