
      import { z } from "zod";
      import { nameSchema, phoneSchema, emailSchema } from "../../../shared/schema";

      export interface ChatOption {
        text: string;
        value: string;
      }

      export type ChatStep = {
        message: string | ((userData: any) => string);
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

      // Helper function for clinic knowledge (placeholder for now)
      function findRelevantInfo(query: string): string {
        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('fee')) {
          return "Our consultation fees vary depending on the treatment needed. During your appointment, our podiatrist will discuss all costs with you before any treatment begins.";
        }

        if (lowerQuery.includes('appointment') || lowerQuery.includes('booking')) {
          return "You can book appointments through our online system or by calling us at 089 9678596. We have locations in Donnycarney, Palmerstown, and Baldoyle.";
        }

        if (lowerQuery.includes('location') || lowerQuery.includes('address')) {
          return "We have three locations: Donnycarney (65 Collins Ave West), Palmerstown (Unit 4, Palmerstown Shopping Centre), and Baldoyle (123 Main Street).";
        }

        if (lowerQuery.includes('hours') || lowerQuery.includes('open')) {
          return "Our hours vary by location: Donnycarney (Mon, Tue, Fri 9am-6pm), Palmerstown (Wed, Thu 9am-6pm), Baldoyle (Mon-Fri 10am-7pm).";
        }

        return "Thank you for your question. Our team will be happy to help you with this during your appointment, or you can call us at 089 9678596 for immediate assistance.";
      }

      export const chatFlow: ChatFlow = {
        welcome: {
          message: "👋 Hello! I'm Fiona, your FootCare Clinic virtual assistant. I'll help gather some information about your foot and nail concerns and connect you with our team if needs be. Before we begin, I'll need to collect some basic information. Rest assured, your data is kept private and secure.",
          next: "name"
        },
        name: {
          message: "What's your name?",
          input: "text",
          validation: (value) => nameSchema.safeParse(value).success,
          errorMessage: "Please enter your name (at least 2 characters)",
          next: "clinic_location"
        },
        clinic_location: {
          message: (userData) => `Hi ${userData.name || 'there'}! Which one of our locations would you prefer to visit for your appointment?`,
          options: [
            { text: "Donnycarney", value: "donnycarney" },
            { text: "Palmerstown", value: "palmerstown" },
            { text: "Baldoyle", value: "baldoyle" },
            { text: "Not sure yet", value: "undecided" }
          ],
          next: (value) => {
            if (value === "donnycarney") return "clinic_info_donnycarney";
            if (value === "palmerstown") return "clinic_info_palmerstown";
            if (value === "baldoyle") return "clinic_info_baldoyle";
            if (value === "undecided") return "clinic_info_general";
            return "upload_prompt";
          }
        },
        clinic_info_donnycarney: {
          message: "Great choice! Our Donnycarney clinic is open Monday, Tuesday & Friday from 9am-6pm. The address is: 65 Collins Ave West, Donnycarney, Dublin 9, D09 KY03",
          next: "upload_prompt"
        },
        clinic_info_palmerstown: {
          message: "Great choice! Our Palmerstown clinic is open Wednesday & Thursday from 9am-6pm. The address is: Unit 4, Palmerstown Shopping Centre, Palmerstown, Dublin 20, D20 XC67",
          next: "upload_prompt"
        },
        clinic_info_baldoyle: {
          message: "Great choice! Our Baldoyle clinic is open Monday to Friday from 10am-7pm. The address is: 123 Main Street, Baldoyle, Dublin 13, D13 AB45",
          next: "upload_prompt"
        },
        clinic_info_general: {
          message: "Great choice! No worries - we can help you decide on the best location during your consultation. All our clinics offer the same high-quality care.",
          next: "upload_prompt"
        },
        upload_prompt: {
          message: "Would you like to upload a photo of your foot concern? This can help us provide a better assessment.",
          options: [
            { text: "Yes", value: "yes" },
            { text: "No", value: "no" }
          ],
          next: (value) => {
            if (value === "yes") return "image_upload";
            return "issue_category";
          }
        },
        image_upload: {
          message: "Please upload a clear photo of your foot concern:",
          imageUpload: true,
          next: "image_analysis",
          delay: 1000
        },
        image_analysis: {
          message: "Thank you for sharing your image. Our AI system has analyzed it, but for a complete and accurate assessment, our podiatrists will need to examine your foot in person during your consultation.",
          next: "image_analysis_results",
          delay: 2000
        },
        image_analysis_results: {
          message: "Based on your description, I've analyzed your symptoms. This information will help our specialists provide better care during your visit.",
          component: "AnalysisResults",
          next: "issue_category",
          delay: 10000
        },
        issue_category: {
          message: "What type of foot concern brings you to our clinic today?",
          options: [
            { text: "Nail problems", value: "nail_problems" },
            { text: "Pain or discomfort", value: "pain_discomfort" },
            { text: "Skin issues", value: "skin_issues" },
            { text: "Structural concerns", value: "structural_concerns" }
          ],
          next: (value) => {
            if (value === "nail_problems") return "nail_specifics";
            if (value === "pain_discomfort") return "pain_specifics";
            if (value === "skin_issues") return "skin_specifics";
            if (value === "structural_concerns") return "structural_specifics";
            return "details";
          }
        },
        nail_specifics: {
          message: "Which specific nail issue are you experiencing?",
          options: [
            { text: "Ingrown toenail", value: "ingrown_toenail" },
            { text: "Fungal infection", value: "fungal_infection" },
            { text: "Thickened nails", value: "thickened_nails" },
            { text: "Discolored nails", value: "discolored_nails" },
            { text: "Other nail issue", value: "other_nail_issue" }
          ],
          next: "symptom_description_prompt"
        },
        pain_specifics: {
          message: "Where are you experiencing foot pain?",
          options: [
            { text: "Heel", value: "heel" },
            { text: "Arch", value: "arch" },
            { text: "Ball of foot", value: "ball_of_foot" },
            { text: "Toes", value: "toes" },
            { text: "Ankle", value: "ankle" },
            { text: "Entire foot", value: "entire_foot" }
          ],
          next: (value) => {
            if (value === "heel") return "heel_pain_type";
            if (value === "arch") return "arch_pain_type";
            if (value === "ball_of_foot") return "ball_foot_pain_type";
            if (value === "toes") return "toe_pain_type";
            if (value === "ankle") return "ankle_pain_type";
            if (value === "entire_foot") return "entire_foot_pain_type";
            return "symptom_description";
          }
        },
        heel_pain_type: {
          message: "What type of heel pain are you experiencing?",
          options: [
            { text: "Pain in the morning/after rest", value: "morning_pain" },
            { text: "Pain during activity", value: "activity_pain" },
            { text: "Deep aching pain", value: "deep_aching" },
            { text: "Sharp pain when pressing", value: "sharp_pressing" },
            { text: "Pain after long periods of standing", value: "standing_pain" },
            { text: "Other heel pain", value: "other_heel_pain" }
          ],
          next: "symptom_description_prompt"
        },
        arch_pain_type: {
          message: "What type of arch pain are you experiencing?",
          options: [
            { text: "Sharp pain in arch", value: "sharp_arch" },
            { text: "Burning sensation", value: "burning_arch" },
            { text: "Cramping in arch", value: "cramping_arch" },
            { text: "Stabbing pain", value: "stabbing_arch" },
            { text: "Tight feeling", value: "tight_arch" },
            { text: "Other arch pain", value: "other_arch_pain" }
          ],
          next: "symptom_description_prompt"
        },
        ball_foot_pain_type: {
          message: "What type of pain are you experiencing in the ball of your foot?",
          options: [
            { text: "Sharp shooting pain", value: "sharp_ball" },
            { text: "Burning sensation", value: "burning_ball" },
            { text: "Feeling like walking on pebbles", value: "pebbles_ball" },
            { text: "Numbness or tingling", value: "numbness_ball" },
            { text: "Throbbing pain", value: "throbbing_ball" },
            { text: "Other ball of foot pain", value: "other_ball_pain" }
          ],
          next: "symptom_description_prompt"
        },
        toe_pain_type: {
          message: "What type of toe pain are you experiencing?",
          options: [
            { text: "Joint pain", value: "joint_toe" },
            { text: "Nail-related pain", value: "nail_toe" },
            { text: "Swelling and pain", value: "swelling_toe" },
            { text: "Stiffness", value: "stiffness_toe" },
            { text: "Sharp shooting pain", value: "sharp_toe" },
            { text: "Other toe pain", value: "other_toe_pain" }
          ],
          next: "symptom_description_prompt"
        },
        ankle_pain_type: {
          message: "What type of ankle pain are you experiencing?",
          options: [
            { text: "Sharp pain when moving", value: "sharp_ankle" },
            { text: "Dull aching pain", value: "dull_ankle" },
            { text: "Swelling and pain", value: "swelling_ankle" },
            { text: "Stiffness", value: "stiffness_ankle" },
            { text: "Instability feeling", value: "instability_ankle" },
            { text: "Other ankle pain", value: "other_ankle_pain" }
          ],
          next: "symptom_description_prompt"
        },
        entire_foot_pain_type: {
          message: "What type of pain affects your entire foot?",
          options: [
            { text: "General aching", value: "general_aching" },
            { text: "Burning sensation", value: "burning_entire" },
            { text: "Cramping", value: "cramping_entire" },
            { text: "Numbness or tingling", value: "numbness_entire" },
            { text: "Swelling and pain", value: "swelling_entire" },
            { text: "Other general foot pain", value: "other_entire_pain" }
          ],
          next: "symptom_description_prompt"
        },
        skin_specifics: {
          message: "What type of skin issue are you experiencing?",
          options: [
            { text: "Calluses or corns", value: "calluses_corns" },
            { text: "Dry or cracked skin", value: "dry_cracked_skin" },
            { text: "Rash or irritation", value: "rash_irritation" },
            { text: "Warts", value: "warts" },
            { text: "Athlete's foot", value: "athletes_foot" },
            { text: "Other skin issue", value: "other_skin_issue" }
          ],
          next: (value) => {
            if (value === "calluses_corns") return "calluses_details";
            if (value === "dry_cracked_skin") return "dry_skin_details";
            if (value === "rash_irritation") return "rash_details";
            if (value === "warts") return "warts_details";
            if (value === "athletes_foot") return "athletes_foot_details";
            return "symptom_description";
          }
        },
        calluses_details: {
          message: "Where are your calluses or corns located?",
          options: [
            { text: "Bottom of feet", value: "bottom_calluses" },
            { text: "Between toes", value: "between_toes_calluses" },
            { text: "On top of toes", value: "top_toes_calluses" },
            { text: "Sides of feet", value: "sides_calluses" },
            { text: "Multiple areas", value: "multiple_calluses" }
          ],
          next: "symptom_description_prompt"
        },
        dry_skin_details: {
          message: "How severe is the dry or cracked skin?",
          options: [
            { text: "Mild dryness", value: "mild_dry" },
            { text: "Moderate cracking", value: "moderate_cracking" },
            { text: "Deep cracks that bleed", value: "deep_cracks" },
            { text: "Painful cracking", value: "painful_cracking" },
            { text: "Widespread dryness", value: "widespread_dry" }
          ],
          next: "symptom_description_prompt"
        },
        rash_details: {
          message: "What does the rash or irritation look like?",
          options: [
            { text: "Red and itchy", value: "red_itchy" },
            { text: "Scaly patches", value: "scaly_patches" },
            { text: "Blistering", value: "blistering" },
            { text: "Burning sensation", value: "burning_rash" },
            { text: "Swollen and inflamed", value: "swollen_inflamed" }
          ],
          next: "symptom_description_prompt"
        },
        warts_details: {
          message: "Where are the warts located?",
          options: [
            { text: "Bottom of foot (plantar)", value: "plantar_warts" },
            { text: "Between toes", value: "between_toes_warts" },
            { text: "On toes", value: "toe_warts" },
            { text: "Multiple locations", value: "multiple_warts" },
            { text: "Single large wart", value: "single_wart" }
          ],
          next: "symptom_description_prompt"
        },
        athletes_foot_details: {
          message: "What symptoms are you experiencing with athlete's foot?",
          options: [
            { text: "Itching between toes", value: "itching_toes" },
            { text: "Burning sensation", value: "burning_athletes" },
            { text: "Peeling skin", value: "peeling_skin" },
            { text: "Cracking between toes", value: "cracking_toes" },
            { text: "Bad odor", value: "bad_odor" }
          ],
          next: "symptom_description_prompt"
        },
        structural_specifics: {
          message: "What type of structural concern do you have?",
          options: [
            { text: "Bunions", value: "bunions" },
            { text: "Hammer toes", value: "hammer_toes" },
            { text: "Flat feet", value: "flat_feet" },
            { text: "High arches", value: "high_arches" },
            { text: "Claw toes", value: "claw_toes" },
            { text: "Other structural issue", value: "other_structural_issue" }
          ],
          next: (value) => {
            if (value === "bunions") return "bunions_details";
            if (value === "hammer_toes") return "hammer_toes_details";
            if (value === "flat_feet") return "flat_feet_details";
            if (value === "high_arches") return "high_arches_details";
            if (value === "claw_toes") return "claw_toes_details";
            return "symptom_description";
          }
        },
        bunions_details: {
          message: "How would you describe your bunion symptoms?",
          options: [
            { text: "Visible bump, mild pain", value: "mild_bunion" },
            { text: "Moderate pain when walking", value: "moderate_bunion" },
            { text: "Severe pain, difficulty with shoes", value: "severe_bunion" },
            { text: "Swelling and redness", value: "swollen_bunion" },
            { text: "Toe pointing toward other toes", value: "angled_bunion" }
          ],
          next: "symptom_description_prompt"
        },
        hammer_toes_details: {
          message: "Which toes are affected and how severe?",
          options: [
            { text: "Second toe, mild bend", value: "mild_hammer" },
            { text: "Multiple toes affected", value: "multiple_hammer" },
            { text: "Severe bend, painful", value: "severe_hammer" },
            { text: "Corns on bent joints", value: "corns_hammer" },
            { text: "Difficulty with shoes", value: "shoes_hammer" }
          ],
          next: "symptom_description_prompt"
        },
        flat_feet_details: {
          message: "What symptoms are you experiencing with flat feet?",
          options: [
            { text: "Arch pain or fatigue", value: "arch_flat" },
            { text: "Ankle pain", value: "ankle_flat" },
            { text: "Knee or hip pain", value: "knee_hip_flat" },
            { text: "Difficulty finding shoes", value: "shoes_flat" },
            { text: "Swelling on inside of ankle", value: "swelling_flat" }
          ],
          next: "symptom_description_prompt"
        },
        high_arches_details: {
          message: "What problems are your high arches causing?",
          options: [
            { text: "Pain in arch area", value: "pain_high_arch" },
            { text: "Pressure on ball of foot", value: "pressure_high_arch" },
            { text: "Ankle instability", value: "unstable_high_arch" },
            { text: "Difficulty with shoe fit", value: "shoes_high_arch" },
            { text: "Calluses on ball of foot", value: "calluses_high_arch" }
          ],
          next: "symptom_description_prompt"
        },
        claw_toes_details: {
          message: "How severe are your claw toe symptoms?",
          options: [
            { text: "Mild bending, no pain", value: "mild_claw" },
            { text: "Moderate bend with pain", value: "moderate_claw" },
            { text: "Severe curling, very painful", value: "severe_claw" },
            { text: "Corns on top of toes", value: "corns_claw" },
            { text: "Cannot straighten toes", value: "fixed_claw" }
          ],
          next: "symptom_description_prompt"
        },
        symptom_description_prompt: {
          message: "Would you like to provide additional details about your symptoms?",
          options: [
            { text: "Yes", value: "yes" },
            { text: "No", value: "no" }
          ],
          next: (value) => {
            if (value === "yes") return "symptom_description";
            return "previous_treatment";
          }
        },
        symptom_description: {
          message: "Please describe your symptoms in detail. Include when they started, any triggers, and how they affect your daily life:",
          input: "textarea",
          validation: (value) => value.trim().length > 10,
          errorMessage: "Please provide a more detailed description (at least 10 characters)",
          next: "previous_treatment"
        },
        previous_treatment: {
          message: "Have you tried any treatments for this condition before?",
          options: [
            { text: "Yes", value: "yes" },
            { text: "No", value: "no" }
          ],
          next: "email"
        },
        email: {
          message: "Please share your email address so we can send you appointment details:",
          input: "email",
          validation: (value) => value.trim().length === 0 || emailSchema.safeParse(value).success,
          errorMessage: "Please enter a valid email address",
          next: "phone"
        },
        phone: {
          message: "Finally, could you please provide your phone number?",
          input: "tel",
          validation: (value) => phoneSchema.safeParse(value).success,
          errorMessage: "Please enter a valid phone number (10-15 digits)",
          next: "confirm"
        },
        confirm: {
          message: "Perfect! Here's our online booking system. Once you've completed your booking, let me know:",
          next: "calendar_booking",
          delay: 1000
        },
        calendar_booking: {
          message: "",
          component: "CalendarEmbed",
          next: "booking_confirmation"
        },
        booking_confirmation: {
          message: (userData) => `🎉 Thank you, ${userData.name}! Your appointment has been successfully booked.`,
          next: "booking_thank_you",
          delay: 1000,
          syncToPortal: true
        },
        booking_thank_you: {
          message: "We're excited to help you with your foot care needs! You'll receive a confirmation email shortly with all the details. Our team is looking forward to seeing you at your scheduled appointment. For any questions before your visit, please feel free to contact us on 089 9678596.",
          next: "final_question",
          delay: 2000
        },
        final_question: {
          message: (userData) => `Is there anything else I can help you with today, ${userData.name}?`,
          options: [
            { text: "No, that's all for now", value: "finished" },
            { text: "Yes, I have another question", value: "more_questions" },
            { text: "I'd like to know about pricing", value: "pricing" }
          ],
          next: (value) => {
            if (value === "finished") return "thanks";
            if (value === "pricing") return "pricing_info";
            return "additional_help";
          }
        },
        pricing_info: {
          message: "Our consultation fees vary depending on the treatment needed. During your appointment, our podiatrist will discuss all costs with you before any treatment begins. Is there anything else I can help with?",
          options: [
            { text: "No, that's all for now", value: "finished" },
            { text: "Yes, I have another question", value: "more_questions" }
          ],
          next: (value) => {
            if (value === "finished") return "thanks";
            return "additional_help";
          }
        },
        additional_help: {
          message: "What would you like to know more about?",
          input: "textarea",
          optional: true,
          next: "help_response"
        },
        help_response: {
          message: (userData) => {
            if (userData.userInput) {
              const response = findRelevantInfo(userData.userInput);
              return `${response}\n\nIs there anything else I can help you with?`;
            }
            return "Thank you for your question. Our team will be happy to help you with this during your appointment, or you can call us at 089 9678596 for immediate assistance.";
          },
          options: [
            { text: "No, that's all for now", value: "finished" },
            { text: "Yes, I have another question", value: "more_questions" }
          ],
          next: (value) => {
            if (value === "finished") return "thanks";
            return "additional_help";
          }
        },
        thanks: {
          message: "Thank you for contacting FootCare Clinic! We look forward to helping you feel better soon. Have a great day! 👋",
          next: "emoji_survey",
          delay: 1000
        },
        emoji_survey: {
          message: "Before you go, how was your experience today? Please rate us:",
          options: [
            { text: "😍 Excellent", value: "excellent" },
            { text: "😊 Good", value: "good" },
            { text: "😐 Okay", value: "okay" },
            { text: "😞 Poor", value: "poor" }
          ],
          next: "survey_response"
        },
        survey_response: {
          message: (userData) => {
            const rating = userData.userInput || userData.emoji_survey;
            if (rating === "excellent" || rating === "good") {
              return "Thank you for the positive feedback! We're delighted we could help. 🌟";
            } else if (rating === "okay") {
              return "Thank you for your feedback. We're always looking to improve our service!";
            } else if (rating === "poor") {
              return "We're sorry your experience wasn't great. Please call us at 089 9678596 so we can make it right.";
            } else {
              return "Thank you for your feedback! We appreciate you taking the time to rate us.";
            }
          },
          next: "helpful_tips",
          delay: 1000
        },
        helpful_tips: {
          message: "💡 Quick tip: For the best foot health, wear properly fitting shoes and keep your feet clean and dry daily. See you soon!",
          end: true,
          next: "welcome"
        }
      };

      export const chatStepToField: Record<string, string> = {
        // Basic info
        name: "name",
        phone: "phone", 
        email: "email",
        clinic_location: "preferredClinic",

        // Image upload
        upload_prompt: "hasImage",
        image_upload: "imagePath",
        image_analysis: "imageAnalysis",
        image_analysis_results: "imageAnalysisResults",

        // Main issue categorization
        issue_category: "issueCategory",

        // Nail specifics
        nail_specifics: "nailSpecifics",

        // Pain specifics and detailed pain types
        pain_specifics: "painLocation",
        heel_pain_type: "heelPainType",
        arch_pain_type: "archPainType", 
        ball_foot_pain_type: "ballFootPainType",
        toe_pain_type: "toePainType",
        ankle_pain_type: "anklePainType",
        entire_foot_pain_type: "entireFootPainType",

        // Skin specifics and detailed skin conditions
        skin_specifics: "skinSpecifics",
        calluses_details: "callusesDetails",
        dry_skin_details: "drySkinDetails",
        rash_details: "rashDetails", 
        warts_details: "wartsDetails",
        athletes_foot_details: "athletesFootDetails",

        // Structural specifics and detailed structural issues
        structural_specifics: "structuralSpecifics",
        bunions_details: "bunionsDetails",
        hammer_toes_details: "hammerToesDetails",
        flat_feet_details: "flatFeetDetails",
        high_arches_details: "highArchesDetails",
        claw_toes_details: "clawToesDetails",

        // Symptom description
        symptom_description_prompt: "symptomDescriptionPrompt",
        symptom_description: "symptomDescription",

        // Treatment history
        previous_treatment: "previousTreatment",

        // Booking and confirmation
        calendar_booking: "calendarBooking",
        booking_confirmation: "bookingConfirmation",

        // Additional help and questions
        final_question: "finalQuestion",
        pricing_info: "pricingInfo",
        additional_help: "userInput",
        help_response: "helpResponse",

        // Survey and feedback
        emoji_survey: "emojiSurvey",
        survey_response: "surveyResponse",

        // Legacy mappings for backwards compatibility
        service_selection: "issueCategory",
        details: "details"
      };