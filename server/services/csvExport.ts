import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import fs from 'fs';
import { Consultation } from '../../shared/schema.js';

const exportDir = path.join(process.cwd(), 'exports');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

const CSV_HEADERS = [
  { id: 'id', title: 'ID' },
  { id: 'createdAt', title: 'Date Created' },
  { id: 'name', title: 'Patient Name' },
  { id: 'preferredClinic', title: 'Clinic Location' },
  { id: 'hasImage', title: 'Image Uploaded?' },
  { id: 'imagePath', title: 'Uploaded Image Filename' },
  { id: 'imageAnalysis', title: 'Image Analysis Results' },
  { id: 'issueCategory', title: 'Issue Category' },
  { id: 'nailSpecifics', title: 'Nail Specifics' },
  { id: 'painLocation', title: 'Pain Location' },
  { id: 'heelPainType', title: 'Heel Pain Type' },
  { id: 'archPainType', title: 'Arch Pain Type' },
  { id: 'ballFootPainType', title: 'Ball of Foot Pain Type' },
  { id: 'toePainType', title: 'Toe Pain Type' },
  { id: 'anklePainType', title: 'Ankle Pain Type' },
  { id: 'entireFootPainType', title: 'Entire Foot Pain Type' },
  { id: 'skinSpecifics', title: 'Skin Specifics' },
  { id: 'callusesDetails', title: 'Calluses Details' },
  { id: 'drySkinDetails', title: 'Dry Skin Details' },
  { id: 'rashDetails', title: 'Rash Details' },
  { id: 'wartsDetails', title: 'Warts Details' },
  { id: 'athletesFootDetails', title: "Athleteâ€™s Foot Details" },
  { id: 'structuralSpecifics', title: 'Structural Specifics' },
  { id: 'bunionsDetails', title: 'Bunions Details' },
  { id: 'hammerToesDetails', title: 'Hammer Toes Details' },
  { id: 'flatFeetDetails', title: 'Flat Feet Details' },
  { id: 'highArchesDetails', title: 'High Arches Details' },
  { id: 'clawToesDetails', title: 'Claw Toes Details' },
  { id: 'symptomDescription', title: 'Symptom Description' },
  { id: 'previousTreatment', title: 'Previous Treatments' },
  { id: 'email', title: 'Email' },
  { id: 'phone', title: 'Phone' },
  { id: 'bookingConfirmation', title: 'Booking Confirmation' },
  { id: 'emojiSurvey', title: 'Rating' },
  { id: 'userInput', title: 'Additional Questions' }
];

export async function exportConsultationsToCSV(
  consultations: Consultation[]
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(exportDir, `consultations-${timestamp}.csv`);

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: CSV_HEADERS
  });

  const records = consultations.map((c) => ({
    ...c,
    createdAt: c.createdAt
      ? new Date(c.createdAt).toLocaleString('en-IE')
      : '',
    hasImage: c.has_image ? 'Yes' : 'No',
    imageAnalysis:
      c.image_analysis && typeof c.image_analysis !== 'string'
        ? JSON.stringify(c.image_analysis)
        : c.image_analysis || '',
    userInput:
      c.final_question && typeof c.final_question !== 'string'
        ? JSON.stringify(c.final_question)
        : c.final_question || ''
  }));

  await csvWriter.writeRecords(records);
  return filePath;
}

export async function exportSingleConsultationToCSV(
  consultation: Consultation
): Promise<string> {
  return exportConsultationsToCSV([consultation]);
}
