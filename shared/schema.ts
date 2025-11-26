import { pgTable, bigserial, text, jsonb, timestamp, boolean, varchar, integer, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const appointmentStatus = pgEnum("appointment_status", ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'])
export const auditActionType = pgEnum("audit_action_type", ['VIEW_PATIENT', 'EXPORT_DATA', 'UPDATE_AUTOMATION', 'UPDATE_CHATBOT_SETTINGS', 'UPDATE_CLINIC_SETTINGS', 'CREATE_APPOINTMENT', 'UPDATE_APPOINTMENT', 'DELETE_APPOINTMENT', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'VIEW_AUDIT_LOGS', 'PATIENT_PORTAL_LOGIN', 'PATIENT_PORTAL_LOGOUT', 'PATIENT_PORTAL_VIEW_APPOINTMENTS', 'PATIENT_PORTAL_VIEW_CONSULTATIONS', 'PATIENT_PORTAL_UPDATE_PROFILE', 'PATIENT_PORTAL_INVITE_SENT', 'PATIENT_PORTAL_SESSION_REVOKED'])
export const automationCategory = pgEnum("automation_category", ['appointment', 'patient_care', 'inbox', 'marketing', 'operational', 'financial', 'reviews'])
export const automationComplexity = pgEnum("automation_complexity", ['low', 'medium', 'high'])
export const automationRunStatus = pgEnum("automation_run_status", ['success', 'error', 'pending', 'cancelled'])
export const chatbotTone = pgEnum("chatbot_tone", ['Friendly', 'Professional', 'Clinical', 'Casual'])
export const clinicGroupEnum = pgEnum("clinic_group_enum", ['FootCare Clinic', 'The Nail Surgery Clinic', 'Lasercare Clinic'])
export const landingPageCtaType = pgEnum("landing_page_cta_type", ['book', 'call', 'form', 'whatsapp', 'link'])
export const landingPageEventType = pgEnum("landing_page_event_type", ['view', 'cta_click'])
export const landingPageStatus = pgEnum("landing_page_status", ['draft', 'published', 'archived'])
export const landingPageVariantStatus = pgEnum("landing_page_variant_status", ['active', 'paused', 'winner'])
export const runFrequency = pgEnum("run_frequency", ['event', 'daily', 'weekly', 'monthly', 'adhoc'])
export const userRole = pgEnum("user_role", ['owner', 'manager', 'clinician', 'receptionist', 'marketing'])
export const visitType = pgEnum("visit_type", ['in_person', 'video'])

export const consultations = pgTable("consultations", {
	id: bigserial({ mode: "number" }).primaryKey().notNull(),
	clinic: text(),
	name: text(),
	email: text(),
	phone: text(),
	preferred_clinic: text("preferred_clinic"),
	issue_category: text("issue_category"),
	issue_specifics: text("issue_specifics"),
	symptom_description: text("symptom_description"),
	symptom_analysis: text("symptom_analysis"),
	pain_duration: text("pain_duration"),
	pain_severity: text("pain_severity"),
	previous_treatment: text("previous_treatment"),
	additional_info: text("additional_info"),
	image_path: text("image_path"),
	image_analysis: text("image_analysis"),
	calendar_booking: text("calendar_booking"),
	booking_confirmation: text("booking_confirmation"),
	final_question: text("final_question"),
	additional_help: text("additional_help"),
	emoji_survey: text("emoji_survey"),
	survey_response: text("survey_response"),
	conversation_log: jsonb("conversation_log").$type<any[]>().default([]),
	completed_steps: jsonb("completed_steps").$type<string[]>().default([]),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow().notNull(),
	image_url: text("image_url"),
	has_image: boolean("has_image").default(false),
	raw_json: jsonb("raw_json"),
	clinic_group: clinicGroupEnum("clinic_group"),
	clinic_domain: text("clinic_domain"),
	clinic_source: text("clinic_source"),
	source: text(),
	image_urls: jsonb("image_urls"),
	status: text().default('new'),
	clinic_slug: text("clinic_slug"), // Removed generatedAlwaysAs for compatibility
	submission_uuid: varchar("submission_uuid"),
	createdat: timestamp({ withTimezone: true, mode: 'date' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }),
	updatedat: timestamp({ withTimezone: true, mode: 'date' }),
	external_id: text("external_id"),
	progress: integer(),
	ai_confidence_level: text("ai_confidence_level"),
	red_flags_detected: boolean("red_flags_detected").default(false),
	callback_completed_at: timestamp("callback_completed_at", { mode: 'date' }),
	callback_completed_by: varchar("callback_completed_by", { length: 255 }),
	referral_type: varchar("referral_type", { length: 100 }),
	referral_notes: text("referral_notes"),
});

export const insertConsultationSchema = createInsertSchema(consultations);

export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type Consultation = typeof consultations.$inferSelect;
