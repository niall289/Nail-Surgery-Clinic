import { useState, useEffect, useCallback, useRef } from "react";
import { chatFlow, chatStepToField, type ChatOption } from "@/lib/chatFlow";
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

function useChat({ consultationId, onSaveData, onImageUpload }: UseChatProps) {
  const [currentStep, setCurrentStep] = useState<keyof typeof chatFlow>("welcome");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userData, setUserData] = useState<Record<string, any>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageOverride, setMessageOverride] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const chatbotSettings: ChatbotSettings | null = null;

  const step = chatFlow[currentStep];
  const options = step?.options || null;
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

  const runStep = useCallback(async (stepKey: keyof typeof chatFlow, overrideUserData?: any) => {
    const step = chatFlow[stepKey];
    if (!step) return;

    setCurrentStep(stepKey);
    setIsLoading(true);

    await delay(step.delay || 600);

    if (stepKey === "image_analysis") {
      const currentUserData = overrideUserData || userData;
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

        console.log("🔍 Image analysis result:", result);

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
        console.error("❌ Image analysis error:", error);
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
        setTimeout(() => {
          runStep(nextStepKey as keyof typeof chatFlow, currentUserData);
        }, 1200);
      }

      scrollToBottom();
      return;
    }

    if (step.component) {
      setIsLoading(false);
      return;
    }

    const currentUserData = overrideUserData || userData;

    let message = messageOverride;
    if (!message) {
      if (typeof step.message === "function") {
        message = step.message(currentUserData, chatbotSettings);
      } else {
        message = step.message;
      }
    }

    if (message) {
      setChatHistory(prev => [...prev, { text: message, type: "bot" }]);
    }

    setMessageOverride(null);
    setIsLoading(false);

    if (step.next && !step.input && !step.options && !step.component && !step.imageUpload) {
      const nextStepKey = typeof step.next === "string" ? step.next : step.next("");
      if (nextStepKey) {
        setTimeout(() => {
          runStep(nextStepKey as keyof typeof chatFlow, currentUserData);
        }, step.delay || 1200);
      }
    }

    scrollToBottom();
  }, [userData, chatbotSettings, messageOverride]);

  const handleUserInput = useCallback(async (value: string) => {
    if (!step) return;

    const validationResult = validate(value);
    if (!validationResult.isValid) return;

    setChatHistory(prev => [...prev, { text: value, type: "user" }]);

    const field = chatStepToField[currentStep];
    let newUserData = userData;

    if (field) {
      newUserData = { ...userData, [field]: value };
      setUserData(newUserData);

      if (step.syncToPortal) {
        try {
          const res = await apiRequest("/api/webhook/partial", {
            method: "POST",
            body: JSON.stringify({ field, value }),
          });

          if (!res || typeof res !== "object") {
            throw new Error("Non-JSON response from portal sync");
          }
        } catch (error) {
          console.warn("⚠️ Portal sync failed, continuing anyway.");
        }
      }
    }

    const nextStepKey = typeof step.next === "string" ? step.next : step.next?.(value);
    if (nextStepKey) {
      setTimeout(() => {
        runStep(nextStepKey as keyof typeof chatFlow, newUserData);
      }, 800);
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

        setTimeout(() => {
          runStep("image_analysis", newUserData);
        }, 600);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      setIsLoading(false);
    }
  }, [userData, runStep]);

  const handleSymptomAnalysis = useCallback(() => {
    // Reserved for future use
  }, []);

  const startChat = useCallback(() => {
    if (chatHistory.length === 0) {
      runStep("welcome");
    }
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

export default useChat;