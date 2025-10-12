// Nail Surgery Clinic Chatbot Flow (Final Version, Client-Requested Updates Verified)

import { z } from "zod";
import { nameSchema, phoneSchema, emailSchema } from "../../../shared/schema";

export interface FAQItem {
  question: string;
  answer: string;
  keywords: string[];
}

export const faqData: FAQItem[] = [
  {
    question: "What are your prices or costs for nail surgery?",
    answer: "Surgical procedures range from €550 to €600 depending on the treatment. A €180 deposit is required to secure your appointment. Full pricing will be confirmed during consultation.",
    keywords: ["price", "cost", "fee", "pricing", "expensive", "how much"]
  },
  {
    question: "How do I book an appointment?",
    answer: "To book, please contact us directly: hello@nailsurgeryclinic.ie or +353 87 4766949. Surgeries take place on Mondays from 2:00–5:40 PM.",
    keywords: ["appointment", "booking", "schedule", "book", "when", "available"]
  },
  {
    question: "Where is your clinic located?",
    answer: "We're located at 65 Collins Ave West, Donnycarney, Dublin 9, D09K0Y3.",
    keywords: ["location", "address", "where", "clinic", "office", "directions"]
  },
  {
    question: "What procedures do you offer?",
    answer: "We specialize in PNA (Partial Nail Avulsion) and TNA (Total Nail Avulsion) procedures — minor surgeries performed under local anaesthetic. Only one foot is operated on per visit.",
    keywords: ["procedure", "surgery", "pna", "tna", "treatment", "what do you do"]
  },
  {
    question: "Do you treat fungal nail infections?",
    answer: "We offer advanced laser therapy for fungal nail infections — ideal for cases resistant to traditional treatments.",
    keywords: ["laser", "fungal", "infection", "fungus", "onychomycosis"]
  },
  {
    question: "What are the risks of nail surgery?",
    answer: "Local anaesthetic is used during surgery. Rare side effects include low blood pressure and irregular heart rhythm. Avoid grapefruit on the day of surgery.",
    keywords: ["anaesthetic", "risk", "side effects", "complications", "safe"]
  },
  {
    question: "What conditions do you treat?",
    answer: "We treat ingrown toenails, fungal infections, toenail trauma/injury, and fingernail issues. Our procedures include PNA and TNA surgeries under local anaesthetic.",
    keywords: ["conditions", "treat", "ingrown", "trauma", "injury", "fingernail"]
  },
  {
    question: "How long does the procedure take?",
    answer: "Surgeries are performed on Mondays from 2:00–5:40 PM. Each procedure is a minor surgery under local anaesthetic, typically taking less than an hour.",
    keywords: ["time", "duration", "long", "how long", "procedure time"]
  },
  {
    question: "Do you accept insurance?",
    answer: "Please contact us directly to discuss insurance coverage and payment options. We can help you understand what might be covered by your insurance provider.",
    keywords: ["insurance", "covered", "pay", "payment", "medical card"]
  },
  {
    question: "What should I expect after surgery?",
    answer: "After surgery, you'll receive aftercare instructions. Avoid tight shoes and trim nails straight across to prevent future issues. If inflamed, bathe regularly with warm water and salt.",
    keywords: ["aftercare", "recovery", "after", "post", "care", "instructions"]
  },
  {
    question: "Can I drive after the procedure?",
    answer: "Since procedures use local anaesthetic, most patients can drive themselves home. However, we recommend having someone accompany you if you prefer.",
    keywords: ["drive", "transport", "anaesthetic", "local", "after procedure"]
  },
  {
    question: "How do I prepare for surgery?",
    answer: "Avoid grapefruit on the day of surgery. Wear comfortable, loose-fitting shoes. Follow any specific preparation instructions provided during your consultation.",
    keywords: ["prepare", "preparation", "before", "diet", "shoes", "clothing"]
  }
];

export interface ChatOption {
  text: string;
  value: string;
}

export interface ChatState {
  [key: string]: any;
}

export type ChatStep = {
  message?: string | ((state: ChatState, settings?: any) => string);
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

  // Search through FAQ data for relevant answers
  for (const faq of faqData) {
    const hasKeyword = faq.keywords.some(keyword => lowerQuery.includes(keyword));
    if (hasKeyword) {
      return faq.answer;
    }
  }

  // Fallback to original logic if no FAQ match
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
  fingernail_followup: "fingernail_followup",
  other_followup: "other_followup",
  symptom_description_prompt: "symptom_description",
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
    next: "name_greeting",
    syncToPortal: true
  },
  name_greeting: {
    message: (userData) => `Hi ${userData.name} - nice to chat to you.`,
    delay: 800,
    next: "issue_category"
  },
  issue_category: {
    message: "What best describes your nail concern?",
    options: [
      { text: "Ingrown toenail", value: "ingrown_followup" },
      { text: "Fungal infection", value: "fungal_followup" },
      { text: "Toenail trauma or injury", value: "trauma_followup" },
      { text: "Finger nail issue or injury", value: "fingernail_followup" },
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
    next: "previous_treatment",
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
    next: "previous_treatment",
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
    next: "previous_treatment",
    syncToPortal: true
  },
  fingernail_followup: {
    message: "What type of injury occurred?",
    options: [
      { text: "Dropped something on fingernail", value: "impact" },
      { text: "Nail lifted or cracked", value: "cracked" },
      { text: "Nail turned black or blue", value: "bruised" },
      { text: "Other injury", value: "other" }
    ],
    next: "previous_treatment",
    syncToPortal: true
  },
  other_followup: {
    message: "Please describe your nail concern in more detail:",
    input: "textarea",
    validation: (value) => value.trim().length > 10,
    errorMessage: "Please enter at least 10 characters",
    next: "previous_treatment",
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
    message: "Have you had any treatments for this condition before?",
    options: [
      { text: "Yes", value: "yes" },
      { text: "No", value: "no" }
    ],
    next: (val) => val === "yes" ? "treatment_details" : "upload_prompt",
    syncToPortal: true
  },
  treatment_details: {
    message: "Please describe some of the treatments you had",
    input: "textarea",
    validation: (value) => value.trim().length > 10,
    errorMessage: "Please enter at least 10 characters",
    next: "upload_prompt",
    syncToPortal: true
  },
  upload_prompt: {
    message: "Would you like to upload a photo of your foot concern? This can help us provide a better assessment.",
    options: [
      { text: "Yes", value: "image_upload" },
      { text: "No", value: "email" }
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
    message: "What's the best number to reach you on?",
    input: "tel",
    validation: (value) => phoneSchema.safeParse(value).success,
    errorMessage: "Please enter a valid phone number",
    next: "booking_confirmation",
    syncToPortal: true
  },
  booking_confirmation: {
    message: (userData) => `Thanks, ${userData.name}!\nWe appreciate the time in explaining your issues.\nWould you like one of our consultants to call you to discuss possible next steps?`,
    options: [
      { text: "Yes", value: "yes" },
      { text: "No", value: "no" }
    ],
    next: (val) => val === "yes" ? "callback_yes" : "callback_no",
    syncToPortal: true
  },
  callback_yes: {
    message: "OK great - we will reach out to you within the next 24 hours.",
    next: "final_question"
  },
  callback_no: {
    message: "OK no problem - Whenever you are ready you can contact the clinic directly to further discuss or arrange your appointment:\n\n📧 hello@nailsurgeryclinic.ie\n📞 +353 87 4766949\n📍 65 Collins Ave West, Donnycarney, Dublin 9, D09K0Y3\n\nWe’ll take care of everything from there.",
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
    next: (value: string) => {
      // Check if the input matches any FAQ keywords
      const lowerValue = value.toLowerCase();
      const hasFAQMatch = faqData.some(faq =>
        faq.keywords.some(keyword => lowerValue.includes(keyword))
      );
      return hasFAQMatch ? "faq_response" : "final_question";
    },
    syncToPortal: true
  },
  faq_response: {
    message: (state: ChatState) => {
      const userInput = state.additional_help || state.userInput;
      if (userInput) {
        const response = findRelevantInfo(userInput);
        return `${response}\n\nAnything else I can help with?`;
      }
      return "Thanks for your question! Feel free to ask more, or visit www.nailsurgeryclinic.ie for more info.";
    },
    next: "final_question"
  },
  help_response: {
    message: (state: ChatState) => {
      if (state.userInput) {
        const response = findRelevantInfo(state.userInput);
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
      { text: "🥰 Excellent", value: "excellent" },
      { text: "😊 Good", value: "good" },
      { text: "🙂 Okay", value: "okay" },
      { text: "😔 Poor", value: "poor" }
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
        return "Thanks for your feedback — we're always looking to improve.";
      } else if (rating === "poor") {
        return "We're sorry to hear that. Please contact hello@nailsurgeryclinic.ie so we can help.";
      }
      return "Thanks again!";
    },
    next: "submit_consultation",
    delay: 1000
  },
  submit_consultation: {
    message: "Submitting your consultation...",
    next: "end",
    delay: 500
  },
  end: {
    message: "🔦 Tip: Avoid tight shoes and trim nails straight across to prevent future nail issues. If the nail in question is inflamed, bathe regularly with warm water and salt. Take care!",
    end: true
  }
};