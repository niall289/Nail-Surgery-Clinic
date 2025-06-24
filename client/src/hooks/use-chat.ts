import { useState, useEffect, useCallback, useRef } from "react";
import { chatFlow, chatStepToField, type ChatOption } from "@/lib/chatFlow";
import { apiRequest } from "@/lib/apiRequest";
import {
  nameSchema,
  phoneSchema,
  emailSchema,
  insertConsultationSchema,
} from "../../../shared/schema";
import { type ChatbotSettings } from "@/services/chatbotSettings";

// Types for chat messages
export interface ChatMessage {
  text: string;
  type: "bot" | "user";
  isTyping?: boolean;
  data?: any;
}

// Fallback-safe clinic source logic
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

export function useChat({ consultationId, onSaveData, onImageUpload }: UseChatProps) {
  const [currentStep, setCurrentStep] = useState<keyof typeof chatFlow>("welcome");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userData, setUserData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [messageOverride, setMessageOverride] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const chatbotSettings: ChatbotSettings | null = null; // Temporarily disabled

  // Get current step data
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

  // Validation function
  const validate = useCallback((value: string): { isValid: boolean; errorMessage?: string } => {
    if (!step?.validation) return { isValid: true };

    const isValid = step.validation(value);
    return {
      isValid,
      errorMessage: isValid ? undefined : (step.errorMessage || "Invalid input")
    };
  }, [step]);

  // Run a specific chat step
  const runStep = useCallback(async (stepKey: keyof typeof chatFlow, overrideUserData?: any) => {
    const step = chatFlow[stepKey];
    if (!step) return;

    setCurrentStep(stepKey);
    setIsLoading(true);

    // Wait for step delay
    await delay(step.delay || 600);

    // Handle special components
    if (step.component) {
      setIsLoading(false);
      return;
    }

    // Use override data if provided, otherwise use current userData
    const currentUserData = overrideUserData || userData;

    // Bot response
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

    // Auto-advance to next step if no user input required
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

  // Handle user input submission
  const handleUserInput = useCallback(async (value: string) => {
    if (!step) return;

    const validationResult = validate(value);
    if (!validationResult.isValid) return;

    // Add user message to chat history immediately
    setChatHistory(prev => [...prev, { text: value, type: "user" }]);

    // Update userData with the input value
    const field = chatStepToField[currentStep];
    let newUserData = userData;
    if (field) {
      newUserData = { ...userData, [field]: value };
      setUserData(newUserData);

      // Sync to portal if needed
      if (step.syncToPortal) {
        try {
          await apiRequest("/api/webhook/partial", {
            method: "POST",
            body: JSON.stringify({ field, value }),
          });
        } catch (error) {
          console.error("Failed to sync to portal:", error);
        }
      }
    }

    // Determine next step
    const nextStepKey = typeof step.next === "string" ? step.next : step.next?.(value);
    if (nextStepKey) {
      // Wait a moment then run next step with updated data
      setTimeout(() => {
        runStep(nextStepKey as keyof typeof chatFlow, newUserData);
      }, 800);
    }
  }, [step, validate, runStep, currentStep, userData]);

  // Handle option selection
  const handleOptionSelect = useCallback(async (option: ChatOption) => {
    await handleUserInput(option.value);
  }, [handleUserInput]);

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    try {
      setIsLoading(true);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;

        // Update userData with image data
        const newUserData = { 
          ...userData,
          imagePath: base64String,
          hasImage: "yes" 
        };
        setUserData(newUserData);

        // Add user message to chat
        setChatHistory(prev => [...prev, {
          text: "📷 Image uploaded successfully",
          type: "user"
        }]);

        setIsLoading(false);

        // Move to image analysis step with the updated data
        setTimeout(() => {
          runStep("image_analysis", newUserData);
        }, 500);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      setIsLoading(false);
    }
  }, [userData, runStep, setUserData]);

  // Handle symptom analysis (if needed)
  const handleSymptomAnalysis = useCallback(() => {
    // Implementation for symptom analysis if needed
  }, []);

  // Start the chat
  const startChat = useCallback(() => {
    if (chatHistory.length === 0) {
      runStep("welcome");
    }
  }, [runStep, chatHistory.length]);

  // Initialize chat on mount
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