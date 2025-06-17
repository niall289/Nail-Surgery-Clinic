import { useState, useEffect, useCallback, useRef } from "react";
import { chatFlow, chatStepToField, type ChatOption } from "@/lib/chatFlow";
import {
  nameSchema,
  phoneSchema,
  emailSchema,
  insertConsultationSchema
} from "../../../shared/schema";
import { fetchChatbotSettings, type ChatbotSettings } from "@/services/chatbotSettings";

// Function to determine clinic source based on domain
function determineClinicSource(hostname: string): string {
  // Handle Replit domains and custom domains
  if (hostname.includes('nailsurgery') || hostname.includes('nail-surgery')) {
    return 'nail_surgery_clinic';
  } else if (hostname.includes('footcare') || hostname.includes('foot-care')) {
    return 'footcare_clinic';
  } else if (hostname.includes('lasercare') || hostname.includes('laser-care')) {
    return 'lasercare_clinic';
  }

  // Default fallback based on current chatbot settings
  return 'nail_surgery_clinic'; // Current default since this is the Nail Surgery Clinic instance
}

export interface ConversationData {
  name?: string;
  email?: string;
  phone?: string;
  preferred_clinic?: string;
  issue_category?: string;
  issue_specifics?: string;
  symptom_description?: string;
  previous_treatment?: string;
  has_image?: string;
  image_path?: string;
  image_analysis?: string;
  calendar_booking?: string;
  booking_confirmation?: string;
  final_question?: string;
  additional_help?: string;
  emoji_survey?: string;
  survey_response?: string;
  preferredClinic?: string;
  issueCategory?: string;
  issueSpecifics?: string;
  symptomDescription?: string;
  previousTreatment?: string;
  imageAnalysis?: string;
  calendarBooking?: string;
  bookingConfirmation?: string;
  finalQuestion?: string;
  additionalHelp?: string;
  emojiSurvey?: string;
  surveyResponse?: string;
  conversation_log?: { step: string; response: string }[];
  completed_steps?: string[];
  consultationId?: number | null;
  createdAt?: Date;
}

interface Message {
  text: string;
  type: "bot" | "user" | "analysis";
  isTyping?: boolean;
  data?: any;
}

interface UseChatProps {
  onSaveData: (data: Record<string, any>, isComplete: boolean) => void;
  onImageUpload?: (file: File) => Promise<string>;
  consultationId?: number | null;
}

export function useChat({ onSaveData, onImageUpload, consultationId }: UseChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState("welcome");
  const [options, setOptions] = useState<ChatOption[] | null>(null);
  const [inputType, setInputType] = useState<'text' | 'tel' | 'email' | 'textarea' | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [userData, setUserData] = useState<Record<string, any>>({});
  const [conversationLog, setConversationLog] = useState<{step: string, response: string}[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [chatbotSettings, setChatbotSettings] = useState<ChatbotSettings | null>(null);

  const addMessage = useCallback((text: string, type: "bot" | "user", isTyping = false) => {
    setMessages(prev => [...prev, { text, type, isTyping }]);
  }, []);

  const processStepRef = useRef<(stepId: string) => void>(() => {});

  const submitFinalConsultation = useCallback(async (conversationData: Record<string, any>) => {
    // Prevent multiple submissions
    if (hasSubmitted) {
      console.log("⚠️ Consultation already submitted, skipping");
      return;
    }

    // Only submit when we have complete required data
    if (!conversationData.name || !conversationData.email || !conversationData.phone) {
      console.log("⏳ Skipping submission - missing required fields (name, email, phone)");
      return;
    }

    try {
      console.log("🚀 Submitting final consultation to webhook");

      // Prepare complete payload matching schema with both naming conventions
      const payload = {
        // Required core fields
        name: conversationData.name || null,
        email: conversationData.email || null,
        phone: conversationData.phone || null,

        // Snake_case fields (current backend expectation)
        preferred_clinic: conversationData.preferred_clinic || null,
        issue_category: conversationData.issue_category || null,
        issue_specifics: conversationData.issue_specifics || null,
        symptom_description: conversationData.symptom_description || null,
        previous_treatment: conversationData.previous_treatment || null,
        has_image: conversationData.has_image === "yes" ? "true" : "false",
        image_path: conversationData.image_path || null,
        image_analysis: conversationData.image_analysis || null,
        calendar_booking: conversationData.calendar_booking || null,
        booking_confirmation: conversationData.booking_confirmation || null,
        final_question: conversationData.final_question || null,
        additional_help: conversationData.additional_help || null,
        emoji_survey: conversationData.emoji_survey || null,
        survey_response: conversationData.survey_response || null,

        // CamelCase variants (for portal compatibility)
        preferredClinic: conversationData.preferred_clinic || null,
        issueCategory: conversationData.issue_category || null,
        issueSpecifics: conversationData.issue_specifics || null,
        symptomDescription: conversationData.symptom_description || null,
        previousTreatment: conversationData.previous_treatment || null,
        imageAnalysis: conversationData.image_analysis || null,
        calendarBooking: conversationData.calendar_booking || null,
        bookingConfirmation: conversationData.booking_confirmation || null,
        finalQuestion: conversationData.final_question || null,
        additionalHelp: conversationData.additional_help || null,
        emojiSurvey: conversationData.emoji_survey || null,
        surveyResponse: conversationData.survey_response || null,

        // System fields
        conversation_log: Array.isArray(conversationData.conversationLog) ? conversationData.conversationLog : [],
        completed_steps: Array.isArray(conversationData.completed_steps) ? conversationData.completed_steps : [],
        consultationId: consultationId,
        createdAt: new Date()
      };

      console.log("✅ Final webhook payload:", payload);
      console.log("📦 Payload being sent:", payload);

      const validated = insertConsultationSchema.safeParse(payload);
      if (!validated.success) {
        console.error("❌ Validation failed:", validated.error);
        return;
      }

      setHasSubmitted(true);

      const response = await fetch("/api/webhook-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated.data)
      });

      if (response.ok) {
        console.log("✅ Final consultation submitted successfully:", response.status, response.statusText);
      } else {
        console.error("❌ Failed to submit consultation:", response.status, response.statusText);
        setHasSubmitted(false); // Reset on failure to allow retry
      }
    } catch (err) {
      console.error("❌ Error submitting consultation:", err);
      setHasSubmitted(false); // Reset on failure to allow retry
    }
  }, [hasSubmitted, consultationId]);

  const updateUserData = useCallback((step: string, value: string, displayValue: string) => {
    const field = chatStepToField[step];
    const updatedData = { ...userData };
    if (field) updatedData[field] = value;

    // Map ALL consultation fields throughout the flow
    switch (step) {
      case 'issue_category':
        updatedData.issue_category = value;
        break;
      // All specifics map to issue_specifics
      case 'structural_specifics':
      case 'skin_specifics':
      case 'pain_specifics':
      case 'nail_specifics':
      case 'calluses_details':
      case 'dry_skin_details':
      case 'rash_details':
      case 'warts_details':
      case 'athletes_foot_details':
      case 'bunions_details':
      case 'hammer_toes_details':
      case 'flat_feet_details':
      case 'high_arches_details':
      case 'claw_toes_details':
      case 'heel_pain_type':
      case 'arch_pain_type':
      case 'ball_foot_pain_type':
      case 'toe_pain_type':
      case 'ankle_pain_type':
      case 'entire_foot_pain_type':
        updatedData.issue_specifics = value;
        break;
      case 'symptom_description':
        updatedData.symptom_description = value;
        break;
      case 'previous_treatment':
        updatedData.previous_treatment = value === 'yes' ? 'Yes' : (value === 'no' ? 'No' : value);
        break;
      case 'calendar_booking':
        updatedData.calendar_booking = value;
        updatedData.booking_confirmation = value === 'booked' ? 'Confirmed' : 'Pending';
        break;
      case 'final_question':
        updatedData.final_question = value;
        break;
      case 'additional_help':
        updatedData.additional_help = value;
        break;
      case 'emoji_survey':
        // Map emoji values to actual emojis
        const emojiMap = {
          'excellent': '😍',
          'good': '😊',
          'okay': '😐',
          'poor': '😞'
        };
        updatedData.emoji_survey = emojiMap[value] || value;
        break;
      case 'survey_response':
        updatedData.survey_response = value;
        break;
      case 'clinic_location':
        updatedData.preferred_clinic = value;
        break;
      case 'upload_prompt':
        updatedData.has_image = value;
        break;
    }

    const updatedLog = [...conversationLog, { step, response: value }];
    const completedSteps = [...new Set([...updatedData.completed_steps || [], step])];

    setConversationLog(updatedLog);
    setUserData({ ...updatedData, completed_steps: completedSteps });

    // Save data locally with all fields
    onSaveData({ 
      ...updatedData, 
      consultationId, 
      conversationLog: updatedLog,
      completed_steps: completedSteps
    }, false);

    // Submit immediately when we have minimum required data (contact info + some symptoms)
    const hasMinimumData = updatedData.name && updatedData.email && updatedData.phone && 
                          (updatedData.issue_category || updatedData.symptom_description);

    // Check for final completion steps
    if (step === 'survey_response' || step === 'additional_help' || step === 'final_question') {
      setTimeout(() => {
        submitFinalConsultation({ 
          ...updatedData, 
          consultationId, 
          conversationLog: updatedLog,
          completed_steps: completedSteps,
          submission_reason: "completed"
        });
      }, 1000);
    }
    // Auto-submit when we have enough useful data, even if conversation isn't complete
    else if (hasMinimumData && !hasSubmitted && step === 'phone') {
      setTimeout(() => {
        submitFinalConsultation({ 
          ...updatedData, 
          consultationId, 
          conversationLog: updatedLog,
          completed_steps: completedSteps,
          submission_reason: "minimum_data_collected"
        });
      }, 2000); // Longer delay to allow for natural flow continuation
    }
  }, [userData, conversationLog, onSaveData, consultationId, submitFinalConsultation]);

  const setupStepInput = useCallback((step: any) => {
    setShowImageUpload(!!step.imageUpload);
    if (step.options) {
      setOptions(step.options);
      setInputType(null);
    } else if (step.input) {
      setInputType(step.input);
      setOptions(null);
    } else if (!step.imageUpload) {
      setOptions(null);
      setInputType(null);
      const nextStepId = typeof step.next === 'function' ? step.next("") : step.next;
      if (nextStepId) processStepRef.current(nextStepId);
    }
    setIsWaitingForResponse(false);
  }, []);

  const processStep = useCallback((stepId: string) => {
    const step = chatFlow[stepId];
    if (!step) return;

    setMessages(prev => prev.map(m => ({ ...m, isTyping: false })));
    setCurrentStep(stepId);

    let messageText = '';
    if (typeof step.message === 'function') {
      messageText = step.message(userData, chatbotSettings);
    } else {
      messageText = step.message || '';
    }

    if (stepId === "image_analysis_results" && userData.footAnalysis) {
      const analysis = userData.footAnalysis;
      addMessage(messageText, "bot", true);
      setTimeout(() => {
        setMessages(prev => prev.map(m => ({ ...m, isTyping: false })));
        setMessages(prev => [
          ...prev,
          {
            type: "analysis",
            text: "",
            isTyping: false,
            data: analysis
          }
        ]);

        // After 10 seconds, replace the analysis card with a chat message
        setTimeout(() => {
          const analysisText = `Based on my analysis, it appears you may have ${analysis.condition} (${analysis.severity} severity). Recommendations: ${analysis.recommendations.join(', ')}. This is an AI-assisted preliminary assessment only. Please consult with a qualified healthcare professional for proper diagnosis and treatment.`;

          setMessages(prev => prev.map((msg, index) => {
            if (index === prev.length - 1 && msg.type === "analysis") {
              return {
                type: "bot",
                text: analysisText,
                isTyping: false
              };
            }
            return msg;
          }));

          setupStepInput(step);
        }, 10000);
      }, 1500);
      return;
    }

    if (stepId === "symptom_analysis_results" && userData.symptomAnalysisResults) {
      const analysis = userData.symptomAnalysisResults;
      addMessage(messageText, "bot", true);
      setTimeout(() => {
        setMessages(prev => prev.map(m => ({ ...m, isTyping: false })));
        addMessage(`Based on your symptoms, you may have ${analysis.potentialConditions.join(", ")} (${analysis.severity} severity, ${analysis.urgency} priority).\n\n${analysis.recommendation}\n\nNext steps:\n${analysis.nextSteps.map((s: string) => `• ${s}`).join("\n")}\n\n${analysis.disclaimer}`, "bot");
        step.delay ? setTimeout(() => setupStepInput(step), step.delay) : setupStepInput(step);
      }, 1500);
      return;
    }

    addMessage(messageText, "bot", true);
    setTimeout(() => {
      setMessages(prev => prev.map(m => ({ ...m, isTyping: false })));
      if (step.end) {
        setOptions(null);
        setInputType(null);
        return;
      }
      step.delay ? setTimeout(() => setupStepInput(step), step.delay) : setupStepInput(step);
    }, 1500);
  }, [setupStepInput, userData, addMessage]);

  useEffect(() => { processStepRef.current = processStep; }, [processStep]);

  useEffect(() => {
    // Load chatbot settings on initialization
    fetchChatbotSettings().then(setChatbotSettings);
  }, []);

  useEffect(() => { 
    if (messages.length === 0 && chatbotSettings) {
      processStep("welcome");
    }
  }, [chatbotSettings]);

  const handleOptionSelect = useCallback((option: ChatOption) => {
    const step = chatFlow[currentStep];
    addMessage(option.text, "user");
    updateUserData(currentStep, option.value, option.text);
    setOptions(null);
    setIsWaitingForResponse(true);
    setTimeout(() => {
      const nextStepId = typeof step.next === 'function' ? step.next(option.value) : step.next;
      if (nextStepId) processStep(nextStepId);
    }, 500);
  }, [currentStep, updateUserData, processStep]);

  const handleUserInput = useCallback((value: string) => {
    const step = chatFlow[currentStep];
    addMessage(value, "user");
    updateUserData(currentStep, value, value);
    setInputType(null);
    setIsWaitingForResponse(true);
    setTimeout(() => {
      const nextStepId = typeof step.next === 'function' ? step.next(value) : step.next;
      if (nextStepId) processStep(nextStepId);
    }, 500);
  }, [currentStep, updateUserData, processStep]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!onImageUpload) return;
    setIsWaitingForResponse(true);
    setShowImageUpload(false);

    try {
      const imageData = await onImageUpload(file);
      addMessage("Image uploaded successfully", "user");
      addMessage("Analyzing your foot image...", "bot");

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64String = reader.result as string;

          const apiUrl = import.meta.env.VITE_API_URL || '';
          const fullUrl = `${apiUrl}/analyze-foot-image`;

          console.log("Sending image to API:", fullUrl);

          const response = await fetch(fullUrl, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ 
              imageBase64: base64String, 
              consultationId: consultationId || null 
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error Response:", response.status, errorText);
            throw new Error(`Image analysis failed: ${response.status} ${response.statusText}`);
          }

          let analysis;
          try {
            const responseText = await response.text();
            console.log("Raw API response:", responseText);
            analysis = JSON.parse(responseText);
          } catch (parseError) {
            console.error("JSON parse error:", parseError);
            throw new Error("Invalid JSON response from server");
          }
          console.log("Analysis result:", analysis);

          // Always show analysis results, even for fallback
          setUserData(prev => {
            const completedSteps = [...new Set([...prev.completed_steps || [], 'image_upload'])];
            const updated = {
              ...prev,
              has_image: "true",
              image_path: base64String,
              image_analysis: JSON.stringify(analysis),
              footAnalysis: analysis,
              completed_steps: completedSteps
            };
            onSaveData({
              ...updated,
              consultationId,
              conversationLog,
              completed_steps: completedSteps
            }, false);
            return updated;
          });

          addMessage("Analysis complete! Here's what I found:", "bot");

          setTimeout(() => {
            setMessages(prev => [
              ...prev,
              {
                type: "analysis",
                text: "",
                isTyping: false,
                data: analysis
              }
            ]);

            setTimeout(() => {
              const step = chatFlow[currentStep];
              const nextStepId = typeof step.next === 'function' ? step.next("") : step.next;
              if (nextStepId) processStep(nextStepId);
            }, 3000);
          }, 1000);

        } catch (error) {
          console.error("Image analysis error:", error);
          addMessage("I'm having trouble analyzing your image right now. Let's continue with describing your symptoms instead.", "bot");
          setTimeout(() => {
            processStep("issue_category");
          }, 1500);
        }
      };

      reader.onerror = () => {
        console.error("File reading error");
        addMessage("I'm having trouble reading your image. Let's continue with describing your symptoms instead.", "bot");
        setIsWaitingForResponse(false);
      };

      reader.readAsDataURL(file);

    } catch (err) {
      console.error("Image upload error:", err);
      addMessage("I'm having trouble with your image upload. Let's continue with describing your symptoms instead.", "bot");
      setIsWaitingForResponse(false);
    }
  }, [onImageUpload, consultationId, currentStep, addMessage, processStep, conversationLog, onSaveData]);

  const handleSymptomAnalysis = useCallback(async (input: string, type: 'text' | 'image' = 'text') => {
    try {
      const endpoint = type === 'image' ? '/api/analyze-foot-image' : '/api/analyze-symptoms';
      const payload = type === 'image' 
        ? { imageBase64: input, consultationId }
        : { symptoms: input, consultationId };

      console.log(`Starting ${type} analysis...`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Analysis failed with status ${response.status}:`, errorText);
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Analysis result:', result);

      // Ensure we have the expected structure for image analysis
      if (type === 'image' && result) {
        return {
          condition: result.condition || "Analysis completed",
          severity: result.severity || "unknown",
          recommendations: result.recommendations || ["Please describe your symptoms"],
          disclaimer: result.disclaimer || "This is an AI-assisted preliminary assessment."
        };
      }

      return result;
    } catch (error) {
      console.error('Analysis error:', error);

      // Return fallback for image analysis
      if (type === 'image') {
        return {
          condition: "Unable to analyze image at this time",
          severity: "unknown", 
          recommendations: [
            "Please describe your symptoms in detail",
            "Continue with the consultation",
            "Visit the clinic for professional assessment"
          ],
          disclaimer: "Image analysis is temporarily unavailable. Please continue describing your symptoms."
        };
      }

      return null;
    }
  }, [consultationId]);

  const validate = useCallback((value: string) => {
    if (!inputType) return { isValid: true };
    const step = chatFlow[currentStep];
    if (step.validation) {
      const isValid = step.validation(value);
      return { isValid, errorMessage: isValid ? undefined : step.errorMessage };
    }
    if (inputType === 'text' && currentStep === 'name') return nameSchema.safeParse(value).success ? { isValid: true } : { isValid: false, errorMessage: "Name must be at least 2 characters" };
    if (inputType === 'tel') return phoneSchema.safeParse(value).success ? { isValid: true } : { isValid: false, errorMessage: "Invalid phone number" };
    if (inputType === 'email') return emailSchema.safeParse(value).success ? { isValid: true } : { isValid: false, errorMessage: "Invalid email address" };
    return { isValid: true };
  }, [inputType, currentStep]);

  return {
    messages,
    options,
    inputType,
    showImageUpload,
    currentData: userData,
    isInputDisabled: isWaitingForResponse || inputType === null,
    isWaitingForResponse,
    handleUserInput,
    handleOptionSelect,
    handleImageUpload,
    handleSymptomAnalysis,
    validate,
    currentStep,
    chatbotSettings
  };
}