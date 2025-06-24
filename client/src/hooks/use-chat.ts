import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { chatFlow, chatStepToField, type ChatOption } from "@/lib/chatFlow";
import { Consultation } from "../../../shared/schema";
import { apiRequest } from "../lib/queryClient";

interface ChatMessage {
  sender: "bot" | "user";
  text: string;
  step?: string;
  isTyping?: boolean;
  type?: "bot" | "user" | "analysis";
  data?: any;
}

export function useChat({
  consultationId,
  onSaveData,
  onImageUpload,
}: {
  consultationId: number | null;
  onSaveData: (data: Partial<Consultation>, isComplete: boolean) => void;
  onImageUpload: (file: File) => Promise<string>;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState("welcome");
  const [userData, setUserData] = useState<Partial<Consultation>>({});
  const [chatEnded, setChatEnded] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [footAnalysis, setFootAnalysis] = useState<any | null>(null);
  const [chatbotSettings, setChatbotSettings] = useState<any | null>(null);
  const [options, setOptions] = useState<ChatOption[] | null>(null);
  const [inputType, setInputType] = useState<"text" | "email" | "phone" | "longtext">("text");
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const delay = (ms: number) => new Promise(resolve => {
    timeoutRef.current = window.setTimeout(resolve, ms);
  });

  useEffect(() => {
    runStep("welcome");

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  async function runStep(stepKey: string, inputValue?: string) {
    const step = chatFlow[stepKey];
    if (!step) return;

    setIsInputDisabled(true);
    setIsWaitingForResponse(true);
    setOptions(null);
    setShowImageUpload(false);

    // Save user response
    if (inputValue !== undefined && step.input) {
      const field = chatStepToField[stepKey];
      if (field) {
        setUserData((prev) => ({ ...prev, [field]: inputValue }));

        if (step.syncToPortal) {
          await apiRequest("/api/webhook/partial", {
            method: "POST",
            body: JSON.stringify({ field, value: inputValue }),
          });
        }
      }

      setMessages(prev => [...prev, {
        sender: "user",
        text: inputValue,
        step: stepKey,
        type: "user"
      }]);
    }

    await delay(step.delay || 600);

    // Bot response
    let message = typeof step.message === "function"
      ? step.message({ ...userData, userInput: inputValue })
      : step.message;

    if (step.component === "ImageAnalysis" && imageData) {
      const result = await apiRequest("/api/analyze-foot-image", {
        method: "POST",
        body: JSON.stringify({ imageBase64: imageData }),
      });

      setFootAnalysis(result);
      setUserData(prev => ({ ...prev, imageAnalysis: result }));

      message = `🧠 Analysis complete:\n\n🦶 Condition: ${result.condition}\n📊 Severity: ${result.severity}\n📝 Recommendations:\n- ${result.recommendations.join(
        "\n- "
      )}\n\n⚠️ Disclaimer: ${result.disclaimer}`;

      setMessages(prev => [...prev, {
        sender: "bot",
        text: message,
        step: stepKey,
        type: "analysis",
        data: result
      }]);
    } else {
      setMessages(prev => [...prev, {
        sender: "bot",
        text: message,
        step: stepKey,
        type: "bot"
      }]);
    }

    setCurrentStep(stepKey);

    // Handle input UI state
    if (step.options) setOptions(step.options);
    if (step.input) setInputType(step.input);
    if (step.component === "ImageUpload") setShowImageUpload(true);

    setIsInputDisabled(false);
    setIsWaitingForResponse(false);

    // If end step, flag chat as done
    if (step.end) {
      setChatEnded(true);
      onSaveData(userData, true);
      return;
    }

    const nextStepKey = typeof step.next === "function" ? step.next(inputValue || "") : step.next;
    if (nextStepKey) {
      console.log("👉 Advancing to next step:", nextStepKey);
      
      const nextStep = chatFlow[nextStepKey];
      if (
        nextStep &&
        !nextStep.input &&
        !nextStep.options &&
        !nextStep.component &&
        !nextStep.imageUpload
      ) {
        // Auto-run steps that don't require user input
        await delay(step.delay || 600);
        runStep(nextStepKey);
      } else {
        // For steps that require input, set the current step and UI state
        setCurrentStep(nextStepKey);
        
        // Clear previous UI state
        setOptions(null);
        setInputType("text");
        setShowImageUpload(false);
        setIsInputDisabled(false);
        setIsWaitingForResponse(false);
        
        // Set up the UI for the next step
        if (nextStep?.options) setOptions(nextStep.options);
        if (nextStep?.input) setInputType(nextStep.input);
        if (nextStep?.imageUpload) setShowImageUpload(true);
        
        // Auto-display the next step's message if it requires input
        if (nextStep && (nextStep.input || nextStep.options || nextStep.imageUpload)) {
          await delay(300);
          
          const nextMessage = typeof nextStep.message === "function"
            ? nextStep.message({ ...userData, userInput: inputValue })
            : nextStep.message;
            
          setMessages(prev => [...prev, {
            sender: "bot",
            text: nextMessage,
            step: nextStepKey,
            type: "bot"
          }]);
        }
      }
    }


    // Sync data to portal mid-way
    onSaveData(userData, false);
  }

  function handleUserInput(value: string) {
    if (!isInputDisabled && !chatEnded) {
      runStep(currentStep, value);
    }
  }

  function handleOptionSelect(option: ChatOption) {
    if (!isInputDisabled && !chatEnded) {
      runStep(currentStep, option.value);
    }
  }

  function handleImageUpload(file: File) {
    setIsInputDisabled(true);
    setShowImageUpload(false);
    setIsWaitingForResponse(true);

    onImageUpload(file).then((base64) => {
      setImageData(base64);
      runStep(currentStep, "uploaded");
    });
  }

  function validate(input: string): boolean {
    if (inputType === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    if (inputType === "phone") return /^[0-9+\-\s()]{7,}$/.test(input);
    return input.length > 0;
  }

  return {
    messages,
    currentStep,
    inputType,
    options,
    isInputDisabled,
    isWaitingForResponse,
    showImageUpload,
    currentData: userData,
    footAnalysis,
    chatbotSettings,
    handleUserInput,
    handleOptionSelect,
    handleImageUpload,
    validate
  };
}