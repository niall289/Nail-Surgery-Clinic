// Nail Surgery Clinic Chatbot Flow (Final Version, Rebased on FootCare Structure)
// Calendar removed, only nail issues supported, no multi-location logic

import { z } from "zod";
import { nameSchema, phoneSchema, emailSchema } from "../../../shared/schema";

export interface ChatOption {
  text: string;
  value: string;
}

export type ChatStep = {
  message: string | ((userData: any, settings?: any) => string);
  delay?: number;
  input?: 'text' | 'tel' | 'email' | 'textarea';
  imageUpload?: boolean;
  validation?: (value: string) => boolean;
  errorMessage?: string;
  options?: ChatOption[];
  optional?: boolean;
  component?: string;
  syncToPortal?: boolean;
} & (
  | { end: true; next?: string | ((value: string) => string) }
  | { end?: false; next: string | ((value: string) => string) }
);

export interface ChatFlow {
  [key: string]: ChatStep;
}

function findRelevantInfo(query: string): string {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes("price") || lowerQuery.includes("cost") || lowerQuery.includes("fee")) {
    return "Surgical procedures range from €550 to €600 depending on the treatment. A €180 deposit is required to secure your appointment. Full pricing will be confirmed during consultation.";
  }

  if (lowerQuery.includes("appointment") || lowerQuery.includes("booking")) {
    return "To book, please contact us directly: hello@nailsurgeryclinic.ie or +353 87 4766949. Surgeries take place on Mondays from 2:00–5:40 PM.";
  }

  if (lowerQuery.includes("location") || lowerQuery.includes("address")) {
    return "We're located at 65 Collins Ave West, Donnycarney, Dublin 9, D09K0Y3.";
  }

  if (lowerQuery.includes("procedure") || lowerQuery.includes("surgery") || lowerQuery.includes("pna") || lowerQuery.includes("tna")) {
    return "We specialize in PNA (Partial Nail Avulsion) and TNA (Total Nail Avulsion) procedures — minor surgeries performed under local anaesthetic. Only one foot is operated on per visit.";
  }

  if (lowerQuery.includes("laser") || lowerQuery.includes("fungal")) {
    return "We offer advanced laser therapy for fungal nail infections — ideal for cases resistant to traditional treatments.";
  }

  if (lowerQuery.includes("anaesthetic") || lowerQuery.includes("risk")) {
    return "Local anaesthetic is used during surgery. Rare side effects include low blood pressure and irregular heart rhythm. Avoid grapefruit on the day of surgery.";
  }

  return "Thanks for your question. Please visit www.nailsurgeryclinic.ie or contact us directly for more info.";
}

export const chatStepToField: { [key: string]: string } = {
  name: "name",
  email: "email",
  phone: "phone",
  upload_prompt: "hasImage",
  image_upload: "imagePath",
  image_analysis: "imageAnalysisResults",
  issue_category: "issue_category",
  ingrown_followup: "ingrown_followup",
  fungal_followup: "fungal_followup",
  trauma_followup: "trauma_followup",
  other_followup: "other_followup",
  symptom_description: "symptom_description",
  previous_treatment: "previous_treatment",
  booking_confirmation: "booking_confirmation",
  final_question: "final_question",
  additional_help: "additional_help",
  help_response: "help_response",
  emoji_survey: "emoji_survey",
  survey_response: "survey_response"
};

export const chatFlow: ChatFlow = {
  welcome: {
    message: () => "👋 Hello! I'm Niamh, your Nail Surgery Clinic virtual assistant. I'll help gather some information about your nail concerns and connect you with our team if needs be. Before we begin, I'll need to collect some basic information. Rest assured, your data is kept private and secure.",
    next: "name"
  },
  name: {
    message: "What's your name?",
    input: "text",
    validation: (value) => nameSchema.safeParse(value).success,
    errorMessage: "Please enter your name (at least 2 characters)",
    next: "upload_prompt",
    syncToPortal: true
  },
  upload_prompt: {
    message: "Would you like to upload a photo of your foot concern? This can help us provide a better assessment.",
    options: [
      { text: "Yes", value: "image_upload" },
      { text: "No", value: "symptom_description" }
    ],
    next: (val) => val,
    syncToPortal: true
  },
  image_upload: {
    message: "Please upload a clear photo of your nail issue.",
    imageUpload: true,
    next: "image_analysis",
    syncToPortal: true
  },
  image_analysis: {
    component: "ImageAnalysis",
    delay: 2000,
    next: "symptom_description_prompt",
    syncToPortal: true
  },
  symptom_description: {
    message: "No problem! Please describe your nail concern in a few sentences.",
    input: "textarea",
    next: "issue_category",
    syncToPortal: true
  },
  issue_category: {
    message: "What best describes your nail concern?",
    options: [
      { text: "Ingrown toenail", value: "ingrown_followup" },
      { text: "Fungal infection", value: "fungal_followup" },
      { text: "Nail trauma or injury", value: "trauma_followup" },
      { text: "Other/Not sure", value: "other_followup" }
    ],
    next: (val) => val,
    syncToPortal: true
  },
  ingrown_followup: {
    message: "Which best describes your ingrown toenail?",
    options: [
      { text: "Mild redness or tenderness", value: "mild" },
      { text: "Recurring ingrown nail", value: "recurring" },
      { text: "Painful, inflamed or pus present", value: "infected" },
      { text: "Tried home treatment with no success", value: "unsuccessful_treatment" }
    ],
    next: "symptom_description",
    syncToPortal: true
  },
  fungal_followup: {
    message: "What symptoms are you noticing?",
    options: [
      { text: "Yellow or discoloured nails", value: "discolouration" },
      { text: "Thickened nails", value: "thick" },
      { text: "Nail crumbling or flaking", value: "crumble" },
      { text: "Tried treatments that didn't work", value: "resistant" }
    ],
    next: "symptom_description",
    syncToPortal: true
  },
  trauma_followup: {
    message: "What type of injury occurred?",
    options: [
      { text: "Dropped something on toe", value: "impact" },
      { text: "Nail lifted or cracked", value: "cracked" },
      { text: "Nail turned black or blue", value: "bruised" },
      { text: "Other injury", value: "other" }
    ],
    next: "symptom_description",
    syncToPortal: true
  },
  other_followup: {
    message: "Please describe your nail concern in more detail:",
    input: "textarea",
    validation: (value) => value.trim().length > 10,
    errorMessage: "Please enter at least 10 characters",
    next: "symptom_description",
    syncToPortal: true
  },
  symptom_description_prompt: {
    message: "Please describe your symptoms in your own words (when it started, what it feels like, how it affects daily life):",
    input: "textarea",
    validation: (value) => value.trim().length > 10,
    errorMessage: "Please enter at least 10 characters",
    next: "previous_treatment",
    syncToPortal: true
  },
  previous_treatment: {
    message: "Have you tried any treatments for this condition before?",
    options: [
      { text: "Yes", value: "yes" },
      { text: "No", value: "no" }
    ],
    next: "email",
    syncToPortal: true
  },
  email: {
    message: "Please enter your email so we can follow up with more information:",
    input: "email",
    validation: (value) => value.trim().length === 0 || emailSchema.safeParse(value).success,
    errorMessage: "Please enter a valid email address",
    next: "phone",
    syncToPortal: true
  },
  phone: {
    message: "What’s the best number to reach you on?",
    input: "tel",
    validation: (value) => phoneSchema.safeParse(value).success,
    errorMessage: "Please enter a valid phone number",
    next: "booking_confirmation",
    syncToPortal: true
  },
  booking_confirmation: {
    message: (userData) => `Thanks, ${userData.name}! Please now contact the clinic directly to arrange your appointment:\n\n📧 hello@nailsurgeryclinic.ie\n📞 +353 87 4766949\n📍 65 Collins Ave West, Donnycarney, Dublin 9, D09K0Y3\n\nWe’ll take care of everything from there.`,
    next: "final_question",
    delay: 1000
  },
  final_question: {
    message: (userData) => `Is there anything else I can help you with today, ${userData.name}?`,
    options: [
      { text: "No, that's all for now", value: "thanks" },
      { text: "Yes, I have another question", value: "additional_help" },
      { text: "I'd like to know about pricing", value: "pricing_info" }
    ],
    next: (val) => val,
    syncToPortal: true
  },
  pricing_info: {
    message: "Surgical procedures range from €550–€600 depending on the procedure. A €180 deposit is required to hold your place. All costs are discussed with you prior to treatment.",
    next: "final_question"
  },
  additional_help: {
    message: "What would you like to know more about?",
    input: "textarea",
    optional: true,
    next: "help_response",
    syncToPortal: true
  },
  help_response: {
    message: (userData) => {
      if (userData.userInput) {
        const response = findRelevantInfo(userData.userInput);
        return `${response}\n\nAnything else I can help with?`;
      }
      return "Thanks for your question! Feel free to ask more, or visit www.nailsurgeryclinic.ie for more info.";
    },
    next: "final_question"
  },
  thanks: {
    message: "Thank you for contacting The Nail Surgery Clinic! We’ll be in touch soon. Take care of those toes! 👋",
    next: "emoji_survey",
    delay: 1000
  },
  emoji_survey: {
    message: "Before you go, how was your experience today?",
    options: [
      { text: "😍 Excellent", value: "excellent" },
      { text: "😊 Good", value: "good" },
      { text: "😐 Okay", value: "okay" },
      { text: "😞 Poor", value: "poor" }
    ],
    next: "survey_response",
    syncToPortal: true
  },
  survey_response: {
    message: (userData) => {
      const rating = userData.userInput || userData.emoji_survey;
      if (rating === "excellent" || rating === "good") {
        return "Thanks for the positive feedback! 🌟";
      } else if (rating === "okay") {
        return "Thanks for your feedback — we’re always looking to improve.";
      } else if (rating === "poor") {
        return "We’re sorry to hear that. Please contact hello@nailsurgeryclinic.ie so we can help.";
      }
      return "Thanks again!";
    },
    next: "end",
    delay: 1000
  },
  end: {
    message: "💡 Tip: Avoid tight shoes and trim nails straight across to prevent future nail issues. Take care!",
    end: true
  }
};