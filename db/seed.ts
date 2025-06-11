import { db } from "./index";
import * as schema from "@shared/schema";

async function seed() {
  try {
    const existingConsultations = await db.query.consultations.findMany({ limit: 1 });

    if (existingConsultations.length === 0) {
      console.log("Seeding consultations data...");

      const sampleConsultations = [
        {
          name: "John Smith",
          preferred_clinic: "Donnycarney",
          has_image: false,
          image_path: null,
          image_analysis: null,
          issue_category: "pain",
          issue_specifics: "heel",
          pain_duration: "chronic_long",
          pain_severity: "moderate",
          symptom_description: "Sharp heel pain when walking in the morning.",
          symptom_analysis: "Likely plantar fasciitis",
          additional_info: "Pain is worse in the morning",
          previous_treatment: "yes",
          email: "john.smith@example.com",
          phone: "5551234567",
          conversation_log: [
            { step: "welcome", response: "next" },
            { step: "name", response: "John Smith" },
            { step: "clinic_choice", response: "Donnycarney" },
            { step: "image_upload", response: "no" },
            { step: "issue_category", response: "pain" },
            { step: "pain_specifics", response: "heel" },
            { step: "pain_duration", response: "chronic_long" },
            { step: "pain_severity", response: "moderate" },
            { step: "symptom_description", response: "Sharp heel pain when walking in the morning." },
            { step: "additional_info", response: "Pain is worse in the morning" },
            { step: "previous_treatment", response: "yes" },
            { step: "email", response: "john.smith@example.com" },
            { step: "phone", response: "5551234567" }
          ]
        },
        {
          name: "Maria Garcia",
          preferred_clinic: "Baldoyle",
          has_image: true,
          image_path: "/uploads/maria-garcia-ingrown.jpg",
          image_analysis: "Possible infection - redness and swelling detected",
          issue_category: "nail",
          issue_specifics: "ingrown",
          pain_duration: null,
          pain_severity: null,
          symptom_description: "Ingrown toenail with pain and redness",
          symptom_analysis: "High likelihood of mild infection requiring attention",
          additional_info: "Toe is red and swollen",
          previous_treatment: "no",
          email: "maria.garcia@example.com",
          phone: "5559876543",
          conversation_log: [
            { step: "welcome", response: "next" },
            { step: "name", response: "Maria Garcia" },
            { step: "clinic_choice", response: "Baldoyle" },
            { step: "image_upload", response: "yes" },
            { step: "issue_category", response: "nail" },
            { step: "nail_specifics", response: "ingrown" },
            { step: "symptom_description", response: "Ingrown toenail with pain and redness" },
            { step: "additional_info", response: "Toe is red and swollen" },
            { step: "previous_treatment", response: "no" },
            { step: "email", response: "maria.garcia@example.com" },
            { step: "phone", response: "5559876543" }
          ]
        }
      ];

      for (const consultation of sampleConsultations) {
        await db.insert(schema.consultations).values(consultation);
      }

      console.log("Seed data inserted successfully!");
    } else {
      console.log("Consultations table already has data, skipping seed");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
