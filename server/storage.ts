import { db } from "./db.js"; // db can be null
import { consultations } from "../shared/schema.js"; 
import { eq, desc } from "drizzle-orm";
import type { InsertConsultation, Consultation } from "../shared/schema.js"; 

const DB_UNAVAILABLE_WARNING_CHATBOT = "Chatbot DB not available. Operating in mock/limited mode. Data will not be persisted.";

const logMockWarningChatbot = (methodName: string, data?: any) => {
  console.warn(`[Chatbot Storage - ${methodName}] ${DB_UNAVAILABLE_WARNING_CHATBOT}`);
  if (data) {
    console.log(`[Chatbot Storage - ${methodName}] Mock operation with data:`, JSON.stringify(data, null, 2));
  }
};

// In-memory store for mock mode
const mockStore = new Map<number, Consultation>();

const formatConversationLogForDb = (log: any): { step: string; response: string }[] => {
  if (Array.isArray(log)) {
    return log.filter(item => typeof item === 'object' && item !== null && 'step' in item && 'response' in item)
              .map(item => ({ step: String(item.step || 'unknown'), response: String(item.response || '') }));
  }
  return [];
};

const formatJsonFieldForDb = (field: any): string | null => {
  if (field === undefined || field === null) return null;
  if (typeof field === 'string' && (field.trim().startsWith('{') || field.trim().startsWith('['))) {
    return field; 
  }
  try {
    return JSON.stringify(field);
  } catch (e) {
    console.error("Error stringifying JSON field for DB:", e);
    return null;
  }
};

export const storage = {
  async createConsultation(data: InsertConsultation): Promise<Consultation> {
    if (!db) {
      logMockWarningChatbot('createConsultation', data);
      // ... mock implementation ...
      const mockConsultation: Consultation = {
        id: Math.floor(Math.random() * 1000),
        clinic: null,
        name: data.name || null,
        email: data.email || null,
        phone: data.phone || null,
        preferred_clinic: data.preferred_clinic || null,
        issue_category: data.issue_category || null,
        issue_specifics: data.issue_specifics || null,
        symptom_description: data.symptom_description || null,
        symptom_analysis: null,
        pain_duration: null,
        pain_severity: null,
        previous_treatment: data.previous_treatment || null,
        additional_info: null,
        image_path: data.image_path || null,
        image_analysis: null,
        calendar_booking: data.calendar_booking || null,
        booking_confirmation: data.booking_confirmation || null,
        final_question: data.final_question || null,
        additional_help: data.additional_help || null,
        emoji_survey: data.emoji_survey || null,
        survey_response: data.survey_response || null,
        conversation_log: data.conversation_log || [],
        completed_steps: data.completed_steps || [],
        createdAt: data.createdAt || new Date(),
        image_url: null,
        has_image: data.has_image || false,
        raw_json: null,
        clinic_group: (data as any).clinic_group || null,
        clinic_domain: null,
        clinic_source: null,
        source: (data as any).source || null,
        image_urls: null,
        status: 'new',
        clinic_slug: null,
        submission_uuid: null,
        createdat: null,
        updatedAt: null,
        updatedat: null,
        external_id: null,
        progress: null,
        ai_confidence_level: null,
        red_flags_detected: false,
        callback_completed_at: null,
        callback_completed_by: null,
        referral_type: null,
        referral_notes: null
      };
      mockStore.set(mockConsultation.id, mockConsultation);
      return Promise.resolve(mockConsultation);
    }

    // Filter out fields that are not in the schema or are undefined
    // This prevents "column does not exist" errors if we try to insert extra fields
    const dbData: any = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      preferred_clinic: data.preferred_clinic,
      issue_category: data.issue_category || 'general',
      issue_specifics: data.issue_specifics,
      symptom_description: data.symptom_description,
      previous_treatment: data.previous_treatment,
      has_image: data.has_image,
      image_path: data.image_path,
      image_analysis: formatJsonFieldForDb(data.image_analysis),
      symptom_analysis: formatJsonFieldForDb(data.symptom_analysis),
      calendar_booking: data.calendar_booking,
      booking_confirmation: data.booking_confirmation,
      final_question: data.final_question,
      additional_help: data.additional_help,
      emoji_survey: data.emoji_survey,
      survey_response: data.survey_response,
      conversation_log: data.conversation_log || [],
      completed_steps: data.completed_steps || [],
      createdAt: data.createdAt || new Date(),
      // Add fields that might be missing from the strict type but exist in DB
      source: (data as any).source || 'nailsurgery',
      clinic_group: (data as any).clinic_group || 'The Nail Surgery Clinic',
      clinic_domain: (data as any).clinic_domain || 'nailsurgeryclinic.engageiobots.com',
    };

    // Remove undefined keys
    Object.keys(dbData).forEach(key => dbData[key] === undefined && delete dbData[key]);

    const [newConsultation] = await db.insert(consultations)
      .values(dbData) 
      .returning();

    return newConsultation;
  },

  async getConsultationById(id: number): Promise<Consultation | undefined> {
    if (!db || !db.query || !db.query.consultations) { 
      logMockWarningChatbot('getConsultationById', { id });
      return Promise.resolve(mockStore.get(id));
    }
    // @ts-ignore 
    const consultationResult = await db.query.consultations.findFirst({
      where: eq(consultations.id, id)
    });
    return consultationResult;
  },

  async updateConsultation(id: number, data: Partial<InsertConsultation>): Promise<Consultation> {
    if (!db) {
      logMockWarningChatbot('updateConsultation', { id, ...data });
      const existing = mockStore.get(id);
      if (!existing) {
        throw new Error(`Consultation ${id} not found in mock store`);
      }
      
      const updated: Consultation = {
        ...existing,
        ...data,
        image_analysis: data.image_analysis ? formatJsonFieldForDb(data.image_analysis) : existing.image_analysis,
        symptom_analysis: data.symptom_analysis ? formatJsonFieldForDb(data.symptom_analysis) : existing.symptom_analysis,
        conversation_log: data.conversation_log ? formatConversationLogForDb(data.conversation_log) : existing.conversation_log,
        completed_steps: data.completed_steps || existing.completed_steps || []
      };
      
      mockStore.set(id, updated);
      return Promise.resolve(updated);
    }

    const dbData: any = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.email !== undefined) dbData.email = data.email;
    if (data.phone !== undefined) dbData.phone = data.phone;
    if (data.preferred_clinic !== undefined) dbData.preferred_clinic = data.preferred_clinic;
    if (data.issue_category !== undefined) dbData.issue_category = data.issue_category || 'general';
    if (data.issue_specifics !== undefined) dbData.issue_specifics = data.issue_specifics;
    if (data.symptom_description !== undefined) dbData.symptom_description = data.symptom_description;
    if (data.previous_treatment !== undefined) dbData.previous_treatment = data.previous_treatment;
    if (data.has_image !== undefined) dbData.has_image = data.has_image;
    if (data.image_path !== undefined) dbData.image_path = data.image_path;
    if (data.image_analysis !== undefined) dbData.image_analysis = formatJsonFieldForDb(data.image_analysis);
    if (data.symptom_analysis !== undefined) dbData.symptom_analysis = formatJsonFieldForDb(data.symptom_analysis);
    if (data.calendar_booking !== undefined) dbData.calendar_booking = data.calendar_booking;
    if (data.booking_confirmation !== undefined) dbData.booking_confirmation = data.booking_confirmation;
    if (data.final_question !== undefined) dbData.final_question = data.final_question;
    if (data.additional_help !== undefined) dbData.additional_help = data.additional_help;
    if (data.emoji_survey !== undefined) dbData.emoji_survey = data.emoji_survey;
    if (data.survey_response !== undefined) dbData.survey_response = data.survey_response;
    if (data.conversation_log !== undefined) dbData.conversation_log = data.conversation_log || [];
    if (data.completed_steps !== undefined) dbData.completed_steps = data.completed_steps || [];
    
    // Add extra fields if present in data
    if ((data as any).source !== undefined) dbData.source = (data as any).source;
    if ((data as any).clinic_group !== undefined) dbData.clinic_group = (data as any).clinic_group;

    const [updatedConsultation] = await db
      .update(consultations)
      .set(dbData)
      .where(eq(consultations.id, id))
      .returning();

    return updatedConsultation;
  },

  async getAllConsultations(page = 1, limit = 10): Promise<Consultation[]> {
    if (!db || !db.query || !db.query.consultations) { 
      logMockWarningChatbot('getAllConsultations', { page, limit });
      return Promise.resolve(Array.from(mockStore.values())
        .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
        .slice((page - 1) * limit, page * limit));
    }
    // @ts-ignore
    const consultationList = await db.query.consultations.findMany({
      limit,
      offset: (page - 1) * limit,
      orderBy: [desc(consultations.createdAt)] 
    });
    return consultationList;
  }
};
