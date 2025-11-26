-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."appointment_status" AS ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."audit_action_type" AS ENUM('VIEW_PATIENT', 'EXPORT_DATA', 'UPDATE_AUTOMATION', 'UPDATE_CHATBOT_SETTINGS', 'UPDATE_CLINIC_SETTINGS', 'CREATE_APPOINTMENT', 'UPDATE_APPOINTMENT', 'DELETE_APPOINTMENT', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'VIEW_AUDIT_LOGS', 'PATIENT_PORTAL_LOGIN', 'PATIENT_PORTAL_LOGOUT', 'PATIENT_PORTAL_VIEW_APPOINTMENTS', 'PATIENT_PORTAL_VIEW_CONSULTATIONS', 'PATIENT_PORTAL_UPDATE_PROFILE', 'PATIENT_PORTAL_INVITE_SENT', 'PATIENT_PORTAL_SESSION_REVOKED');--> statement-breakpoint
CREATE TYPE "public"."automation_category" AS ENUM('appointment', 'patient_care', 'inbox', 'marketing', 'operational', 'financial', 'reviews');--> statement-breakpoint
CREATE TYPE "public"."automation_complexity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."automation_run_status" AS ENUM('success', 'error', 'pending', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."chatbot_tone" AS ENUM('Friendly', 'Professional', 'Clinical', 'Casual');--> statement-breakpoint
CREATE TYPE "public"."clinic_group_enum" AS ENUM('FootCare Clinic', 'The Nail Surgery Clinic', 'Lasercare Clinic');--> statement-breakpoint
CREATE TYPE "public"."landing_page_cta_type" AS ENUM('book', 'call', 'form', 'whatsapp', 'link');--> statement-breakpoint
CREATE TYPE "public"."landing_page_event_type" AS ENUM('view', 'cta_click');--> statement-breakpoint
CREATE TYPE "public"."landing_page_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."landing_page_variant_status" AS ENUM('active', 'paused', 'winner');--> statement-breakpoint
CREATE TYPE "public"."run_frequency" AS ENUM('event', 'daily', 'weekly', 'monthly', 'adhoc');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'manager', 'clinician', 'receptionist', 'marketing');--> statement-breakpoint
CREATE TYPE "public"."visit_type" AS ENUM('in_person', 'video');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "consultations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"clinic" text,
	"name" text,
	"email" text,
	"phone" text,
	"preferred_clinic" text,
	"issue_category" text,
	"issue_specifics" text,
	"symptom_description" text,
	"symptom_analysis" text,
	"pain_duration" text,
	"pain_severity" text,
	"previous_treatment" text,
	"additional_info" text,
	"image_path" text,
	"image_analysis" text,
	"calendar_booking" text,
	"booking_confirmation" text,
	"final_question" text,
	"additional_help" text,
	"emoji_survey" text,
	"survey_response" text,
	"conversation_log" jsonb,
	"completed_steps" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"image_url" text,
	"has_image" boolean DEFAULT false,
	"raw_json" jsonb,
	"clinic_group" "clinic_group_enum",
	"clinic_domain" text,
	"clinic_source" text,
	"source" text,
	"image_urls" jsonb,
	"status" text DEFAULT 'new',
	"clinic_slug" text GENERATED ALWAYS AS (
CASE clinic_group
    WHEN 'The Nail Surgery Clinic'::clinic_group_enum THEN 'nailsurgery'::text
    WHEN 'FootCare Clinic'::clinic_group_enum THEN 'footcare'::text
    WHEN 'Lasercare Clinic'::clinic_group_enum THEN 'lasercare'::text
    ELSE NULL::text
END) STORED,
	"submission_uuid" varchar,
	"createdat" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"updatedat" timestamp with time zone,
	"external_id" text,
	"progress" integer,
	"ai_confidence_level" text,
	"red_flags_detected" boolean DEFAULT false,
	"callback_completed_at" timestamp,
	"callback_completed_by" varchar(255),
	"referral_type" varchar(100),
	"referral_notes" text
);

*/