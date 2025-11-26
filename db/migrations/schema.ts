import { pgTable, bigserial, text, jsonb, timestamp, boolean, varchar, integer, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

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
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	clinic: text(),
	name: text(),
	email: text(),
	phone: text(),
	preferredClinic: text("preferred_clinic"),
	issueCategory: text("issue_category"),
	issueSpecifics: text("issue_specifics"),
	symptomDescription: text("symptom_description"),
	symptomAnalysis: text("symptom_analysis"),
	painDuration: text("pain_duration"),
	painSeverity: text("pain_severity"),
	previousTreatment: text("previous_treatment"),
	additionalInfo: text("additional_info"),
	imagePath: text("image_path"),
	imageAnalysis: text("image_analysis"),
	calendarBooking: text("calendar_booking"),
	bookingConfirmation: text("booking_confirmation"),
	finalQuestion: text("final_question"),
	additionalHelp: text("additional_help"),
	emojiSurvey: text("emoji_survey"),
	surveyResponse: text("survey_response"),
	conversationLog: jsonb("conversation_log"),
	completedSteps: jsonb("completed_steps"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	imageUrl: text("image_url"),
	hasImage: boolean("has_image").default(false),
	rawJson: jsonb("raw_json"),
	clinicGroup: clinicGroupEnum("clinic_group"),
	clinicDomain: text("clinic_domain"),
	clinicSource: text("clinic_source"),
	source: text(),
	imageUrls: jsonb("image_urls"),
	status: text().default('new'),
	clinicSlug: text("clinic_slug").generatedAlwaysAs(sql`
CASE clinic_group
    WHEN 'The Nail Surgery Clinic'::clinic_group_enum THEN 'nailsurgery'::text
    WHEN 'FootCare Clinic'::clinic_group_enum THEN 'footcare'::text
    WHEN 'Lasercare Clinic'::clinic_group_enum THEN 'lasercare'::text
    ELSE NULL::text
END`),
	submissionUuid: varchar("submission_uuid"),
	createdat: timestamp({ withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	updatedat: timestamp({ withTimezone: true, mode: 'string' }),
	externalId: text("external_id"),
	progress: integer(),
	aiConfidenceLevel: text("ai_confidence_level"),
	redFlagsDetected: boolean("red_flags_detected").default(false),
	callbackCompletedAt: timestamp("callback_completed_at", { mode: 'string' }),
	callbackCompletedBy: varchar("callback_completed_by", { length: 255 }),
	referralType: varchar("referral_type", { length: 100 }),
	referralNotes: text("referral_notes"),
});
