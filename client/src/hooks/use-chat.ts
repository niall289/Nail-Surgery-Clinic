import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { chatFlow, chatStepToField } from "@/lib/chatFlow"; // ✅ fixed import casing
import { Consultation } from "../../../shared/schema";
import { apiRequest } from "../lib/queryClient";

interface ChatMessage {
  sender: "bot" | "user";
  text: string;
  step?: string;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState("welcome");
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<Partial<Consultation>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [footAnalysis, setFootAnalysis] = useState<any | null>(null);
  const [chatEnded, setChatEnded] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const queryClient = useQueryClient();

  const delay = (ms: number) =>
    new Promise((resolve) => {
      timeoutRef.current = window.setTimeout(resolve, ms);
    });

  useEffect(() => {
    if (
      messages.length === 0 &&
      currentStep === "welcome" &&
      !chatEnded
    ) {
      console.log("🚀 Chat started — calling runStep('welcome')");
      runStep("welcome");
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function runStep(stepKey: string, inputValue?: string) {
    console.log(`➡️ Running step: ${stepKey}, with input: ${inputValue}`);

    const step = chatFlow[stepKey];
    if (!step) {
      console.error(`❌ Step '${stepKey}' not found in chatFlow`);
      return;
    }

    setIsLoading(true);

    if (inputValue !== undefined && step.input) {
      const field = chatStepToField[stepKey];
      if (field) {
        setUserData((prev) => ({ ...prev, [field]: inputValue }));

        if (step.syncToPortal) {
          await apiRequest("/api/webhook/partial", {
            method: "POST",
            body: JSON.stringify({
              field,
              value: inputValue,
            }),
          });
        }
      }

      setMessages((prev) => [
        ...prev,
        { sender: "user", text: inputValue, step: stepKey },
      ]);
    }

    await delay(step.delay || 600);

    let message: string;
    if (typeof step.message === "function") {
      const dynamicUserInput =
        inputValue && stepKey !== "name" ? inputValue : userData.userInput;
      message = step.message({ ...userData, userInput: dynamicUserInput });
    } else {
      message = step.message;
    }

    if (step.component === "ImageAnalysis" && imageData) {
      const result = await apiRequest("/api/analyze-foot-image", {
        method: "POST",
        body: JSON.stringify({ imageBase64: imageData }),
      });

      setFootAnalysis(result);
      setUserData((prev) => ({
        ...prev,
        imageAnalysis: result,
      }));

      message = `🧠 Analysis complete:\n\n🦶 Condition: ${result.condition}\n📊 Severity: ${result.severity}\n📝 Recommendations:\n- ${result.recommendations.join(
        "\n- "
      )}\n\n⚠️ Disclaimer: ${result.disclaimer}`;
    }

    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: message, step: stepKey },
    ]);

    setIsLoading(false);

    if (step.end) {
      setChatEnded(true);
      return;
    }

    const nextStepKey =
      typeof step.next === "function" ? step.next(inputValue ?? "") : step.next;

    if (nextStepKey) {
      console.log("👉 Advancing to next step:", nextStepKey);
      setCurrentStep(nextStepKey);

      const nextStep = chatFlow[nextStepKey];
      if (
        nextStep &&
        !nextStep.input &&
        !nextStep.options &&
        !nextStep.component
      ) {
        runStep(nextStepKey);
      }
    }
  }

  function handleUserInput(value: string) {
    runStep(currentStep, value);
  }

  function restartChat() {
    if (currentStep !== "welcome") {
      setMessages([]);
      setCurrentStep("welcome");
      setUserData({});
      setFootAnalysis(null);
      setImagePreview(null);
      setImageData(null);
      setChatEnded(false);
    }
  }

  function handleImageUpload(file: File) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImageData(base64String);
      setImagePreview(base64String);
      runStep(currentStep, "uploaded");
    };
    reader.readAsDataURL(file);
  }

  return {
    messages,
    isLoading,
    chatEnded,
    userData,
    footAnalysis,
    imagePreview,
    currentStep,
    uploadingImage,
    setUploadingImage,
    handleUserInput,
    restartChat,
    handleImageUpload,
  };
}
