// server/routes.ts

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
    const TIMEOUT_MS = 30000;
    let sent = false;

    const timeout = setTimeout(() => {
      if (!sent) {
        sent = true;
        res.status(408).json({
          error: "Request timeout",
          fallback: {
            condition: "Unable to analyze image at this time",
            severity: "unknown",
            recommendations: [
              "Continue with consultation",
              "Describe symptoms in detail",
              "Visit a clinic for assessment"
            ],
          },
        });
      }
    }, TIMEOUT_MS);

    try {
      const { imageBase64, consultationId } = req.body;
      if (!imageBase64) throw new Error("Missing imageBase64");

      const cleanImage = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const analysis = await analyzeFootImage(cleanImage);

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
      if (!sent) {
        clearTimeout(timeout);
        sent = true;
        res.status(500).json({
          error: "Failed to analyze image",
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

  // Image analysis route
  app.post('/api/analyze-foot-image', async (req, res) => {
    try {
      console.log('Image analysis request received');
      const { image } = req.body;

      if (!image) {
        console.error('No image provided in request');
        return res.status(400).json({ error: 'No image provided' });
      }

      console.log('Analyzing image with OpenAI...');
      const analysis = await analyzeFootImage(image);
      console.log('Analysis complete:', analysis.substring(0, 100) + '...');

      res.json({ analysis });
    } catch (error) {
      console.error('Image analysis error:', error);
      res.status(500).json({ 
        error: 'Failed to analyze image',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Add other routes here as needed

  const server = createServer(app);
  return server;
}