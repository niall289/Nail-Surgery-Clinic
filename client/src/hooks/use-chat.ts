import { useState, useEffect, useCallback, useRef } from "react";
import { chatFlow, chatStepToField, type ChatOption, type ChatState } from "@/lib/chatFlow";
import { apiRequest } from "@/components/lib/apiRequest";
import {
  nameSchema,
  phoneSchema,
  emailSchema,
  insertConsultationSchema,
} from "../../../shared/schema";
import { type ChatbotSettings } from "@/services/chatbotSettings";

export interface ChatMessage {
  text: string;
  type: "bot" | "user" | "analysis";
  isTyping?: boolean;
  data?: any;
}

function determineClinicSource(hostname: string): string {
  if (hostname.includes("nailsurgery") || hostname.includes("nail-surgery")) {
    return "nail_surgery_clinic";
  } else if (hostname.includes("footcare") || hostname.includes("foot-care")) {
    return "footcare_clinic";
  } else if (hostname.includes("lasercare") || hostname.includes("laser-care")) {
    return "lasercare_clinic";
  } else {
    return "footcare_clinic";
  }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface UseChatProps {
  consultationId: number | null;
  onSaveData: (data: any, isComplete: boolean) => void;
  onImageUpload: (file: File) => Promise<string>;
}

export default function useChat({ consultationId: initialConsultationId, onSaveData, onImageUpload }: UseChatProps) {
  const [currentStep, setCurrentStep] = useState<keyof typeof chatFlow>("welcome");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userData, setUserData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [consultationId, setConsultationId] = useState<number | null>(initialConsultationId || null);
  const [messageOverride, setMessageOverride] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const chatbotSettings: ChatbotSettings | null = null;

  const step = chatFlow[currentStep];
  const options = step?.options || [];
  const inputType = step?.input || "text";
  const showImageUpload = !!step?.imageUpload;
  const isInputDisabled = isLoading || !!step?.component;
  const isWaitingForResponse = isLoading;

  const scrollToBottom = () => {
    setTimeout(() => {
      chatContainerRef.current?.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  };

  const updateUserData = useCallback((updates: Record<string, any>) => {
    setUserData(prev => ({ ...prev, ...updates }));
  }, []);

  const validate = useCallback((value: string): { isValid: boolean; errorMessage?: string } => {
    if (!step?.validation) return { isValid: true };
    const isValid = step.validation(value);
    return {
      isValid,
      errorMessage: isValid ? undefined : (step.errorMessage || "Invalid input")
    };
  }, [step]);

  const userFriendlyText = (value: string): string => {
    const option = options.find(o => o.value === value);
    return option?.text || value;
  };

  const runStep = useCallback(async (stepKey: keyof typeof chatFlow, overrideUserData?: any) => {
    const step = chatFlow[stepKey];
    if (!step) return;

    setCurrentStep(stepKey);
    setIsLoading(true);
    await delay(step.delay || 600);


    // Progressive save: create consultation after 'name' step
    // We wait until the 'name_greeting' step to ensure we have the user's name
    const currentUserData = overrideUserData || userData;
    if (stepKey === "name_greeting" && !consultationId && currentUserData.name) {
      try {
        const consultationData = {
          name: currentUserData.name,
          email: currentUserData.email || "pending@email.com", // Placeholder until email is collected
          phone: currentUserData.phone || "0000000000", // Placeholder until phone is collected
          source: "nailsurgery",
          chatbotSource: "nailsurgery",
          clinic_group: "The Nail Surgery Clinic",
          clinic: "nailsurgery",
          clinic_domain: "nailsurgeryclinic.engageiobots.com",
          preferred_clinic: currentUserData.preferred_clinic || "Nail Surgery Clinic",
          issue_category: currentUserData.issue_category || "pending",
          issue_specifics: currentUserData.ingrown_followup || currentUserData.fungal_followup || currentUserData.trauma_followup || currentUserData.fingernail_followup || currentUserData.other_followup,
          symptom_description: currentUserData.symptom_description,
          previous_treatment: currentUserData.previous_treatment === "yes" ? currentUserData.treatment_details : "no",
        };
        const response = await apiRequest("/api/consultations", {
          method: "POST",
          body: JSON.stringify(consultationData),
        });
        if (response && response.id) {
          setConsultationId(response.id);
          console.log("✅ Consultation created with ID:", response.id);
        }
      } catch (error) {
        console.error("❌ Failed to create consultation:", error);
      }
    }

    // PATCH updates at milestones if consultationId exists
    const milestoneSteps = ["email", "phone", "previous_treatment", "image_upload", "image_analysis", "symptom_description_prompt", "additional_help", "emoji_survey", "survey_response", "submit_consultation", "issue_category", "ingrown_followup", "fungal_followup", "trauma_followup", "fingernail_followup", "other_followup"];
    if (consultationId && milestoneSteps.includes(String(stepKey))) {
      try {
        const patchData: Record<string, any> = {};
        
        // Always include core contact info if available
        if (currentUserData.email) patchData.email = currentUserData.email;
        if (currentUserData.phone) patchData.phone = currentUserData.phone;
        
        // Include other fields if they exist in the data
        if (currentUserData.previous_treatment) {
             patchData.previous_treatment = currentUserData.previous_treatment === "yes" ? currentUserData.treatment_details : "no";
        }
        
        if (currentUserData.issue_category) {
             patchData.issue_category = currentUserData.issue_category;
             patchData.issue_specifics = currentUserData.ingrown_followup || currentUserData.fungal_followup || currentUserData.trauma_followup || currentUserData.fingernail_followup || currentUserData.other_followup;
        }
        
        if (currentUserData.imagePath) patchData.image_path = currentUserData.imagePath;
        if (currentUserData.imageAnalysisResults) patchData.image_analysis = JSON.stringify(currentUserData.imageAnalysisResults);
        if (currentUserData.symptom_description) patchData.symptom_description = currentUserData.symptom_description;
        if (currentUserData.additional_help) patchData.additional_info = currentUserData.additional_help;
        if (currentUserData.emoji_survey) patchData.survey_response = currentUserData.emoji_survey;
        if (currentUserData.survey_response) patchData.survey_response = currentUserData.survey_response;

        // On final step, patch all data
        if (stepKey === "submit_consultation") {
          patchData.completed_steps = JSON.stringify(Object.keys(currentUserData));
          patchData.conversation_log = JSON.stringify(currentUserData);
        }
        
        if (Object.keys(patchData).length > 0) {
          await apiRequest(`/api/consultations/${consultationId}`, {
            method: "PATCH",
            body: JSON.stringify(patchData),
          });
          console.log(`✅ Consultation updated at step '${String(stepKey)}'`);
        }
      } catch (error) {
        console.error(`❌ Failed to update consultation at step '${String(stepKey)}':`, error);
      }
    }

    if (stepKey === "image_analysis") {
      const imageBase64 = currentUserData.imagePath;

      setChatHistory(prev => [
        ...prev,
        { text: "🧠 Thank you for your image - our AI is analyzing it now...", type: "bot" },
      ]);

      try {
        const result = await apiRequest("/api/analyze-foot-image", {
          method: "POST",
          body: JSON.stringify({ imageBase64 }),
        });

        if (result?.condition && result?.severity && result?.recommendations) {
          updateUserData({ imageAnalysisResults: result });

          setChatHistory(prev => [
            ...prev,
            {
              type: "analysis",
              text: "AI diagnosis results",
              data: result,
            },
          ]);
        } else {
          setChatHistory(prev => [
            ...prev,
            {
              type: "bot",
              text: `⚠️ Image analysis could not return valid results. Please continue describing your symptoms.`,
            },
          ]);
        }
      } catch (error) {
        setChatHistory(prev => [
          ...prev,
          {
            type: "bot",
            text: `⚠️ Our image analysis service is temporarily unavailable. Please continue with describing your symptoms.`,
          },
        ]);
      }

      setIsLoading(false);
      const nextStepKey = typeof step.next === "string" ? step.next : step.next?.("");
      if (nextStepKey) {
        setTimeout(() => runStep(nextStepKey as keyof typeof chatFlow, currentUserData), 1200);
      }

      scrollToBottom();
      return;
    }

    if (step.component) {
      setIsLoading(false);
      return;
    }

    let message = messageOverride;

    if (!message) {
      message = typeof step.message === "function"
        ? step.message(currentUserData as ChatState, chatbotSettings)
        : step.message;
    }

    if (message) {
      setChatHistory(prev => [...prev, { text: message, type: "bot" }]);
    }

    setMessageOverride(null);
    setIsLoading(false);

    if (step.next && !step.input && !step.options && !step.component && !step.imageUpload) {
      const nextStepKey = typeof step.next === "string" ? step.next : step.next("");
      if (nextStepKey) {
        setTimeout(() => runStep(nextStepKey as keyof typeof chatFlow, currentUserData), step.delay || 1200);
      }
    }

    scrollToBottom();
  }, [userData, chatbotSettings, messageOverride]);

  const handleUserInput = useCallback(async (value: string) => {
    if (!step) return;

    const validationResult = validate(value);
    if (!validationResult.isValid) return;

    setChatHistory(prev => [...prev, { text: userFriendlyText(value), type: "user" }]);

    const field = chatStepToField[currentStep];
    let newUserData = userData;

    if (field) {
      newUserData = { ...userData, [field]: value };
      setUserData(newUserData);

      if (step.syncToPortal) {
        try {
          await apiRequest("/api/webhook/partial", {
            method: "POST",
            body: JSON.stringify({ field, value }),
          });
        } catch {
          console.warn("⚠️ Portal sync failed");
        }
      }
    }

    const nextStepKey = typeof step.next === "string" ? step.next : step.next?.(value);
    if (nextStepKey) {
      setTimeout(() => runStep(nextStepKey as keyof typeof chatFlow, newUserData), 800);
    }
  }, [step, validate, runStep, currentStep, userData]);

  const handleOptionSelect = useCallback(async (option: ChatOption) => {
    await handleUserInput(option.value);
  }, [handleUserInput]);

  const handleImageUpload = useCallback(async (file: File) => {
    try {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        const newUserData = {
          ...userData,
          imagePath: base64String,
          hasImage: "yes",
        };

        setUserData(newUserData);
        setChatHistory(prev => [...prev, {
          text: "📷 Image uploaded successfully",
          type: "user"
        }]);

        setIsLoading(false);
        setTimeout(() => runStep("image_analysis", newUserData), 600);
      };

      reader.readAsDataURL(file);
    } catch {
      setIsLoading(false);
    }
  }, [userData, runStep]);

  const handleSymptomAnalysis = useCallback(() => {}, []);
  const startChat = useCallback(() => {
    if (chatHistory.length === 0) runStep("welcome");
  }, [runStep, chatHistory.length]);

  useEffect(() => {
    startChat();
  }, [startChat]);

  return {
    chatHistory,
    options,
    inputType,
    showImageUpload,
    currentData: userData,
    isInputDisabled,
    isWaitingForResponse,
    handleUserInput,
    handleOptionSelect,
    handleImageUpload,
    handleSymptomAnalysis,
    validate,
    currentStep,
    chatbotSettings,
    chatContainerRef,
    updateUserData,
  };
}
