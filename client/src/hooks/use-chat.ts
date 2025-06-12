import { useState, useEffect, useCallback, useRef } from "react";
import { chatFlow, chatStepToField, type ChatOption } from "@/lib/chatFlow";
import {
  nameSchema,
  phoneSchema,
  emailSchema,
  insertConsultationSchema
} from "../../../shared/schema";

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

  const addMessage = useCallback((text: string, type: "bot" | "user", isTyping = false) => {
    setMessages(prev => [...prev, { text, type, isTyping }]);
  }, []);

  const processStepRef = useRef<(stepId: string) => void>(() => {});

  const sendToAdminPortal = useCallback(async (conversationData: Record<string, any>) => {
    try {
      console.log("🚀 Sending data to webhook:", "https://footcareclinicadmin.engageiobots.com/api/webhook/consultation");
      console.log("📦 Webhook payload:", conversationData);
      
      // Only send if we have the required fields
      if (!conversationData.email || !conversationData.phone) {
        console.log("⏳ Skipping webhook - missing required fields (email, phone)");
        return;
      }
      
      const validated = insertConsultationSchema.safeParse(conversationData);
      if (!validated.success) {
        console.error("❌ Validation failed:", validated.error);
        return;
      }
      
      const response = await fetch("https://footcareclinicadmin.engageiobots.com/api/webhook/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated.data)
      });
      
      if (response.ok) {
        console.log("✅ Webhook success:", response.status, response.statusText);
      } else {
        console.error("❌ Failed to send to portal:", response.status, response.statusText);
      }
    } catch (err) {
      console.error("❌ Error syncing to portal:", err);
    }
  }, []);

  const updateUserData = useCallback((step: string, value: string, displayValue: string) => {
    const field = chatStepToField[step];
    const updatedData = { ...userData };
    if (field) updatedData[field] = value;
    const updatedLog = [...conversationLog, { step, response: value }];
    setConversationLog(updatedLog);
    setUserData(updatedData);
    onSaveData({ ...updatedData, consultationId, conversationLog: updatedLog }, false);
    
    // Send all conversations to external webhook portal
    sendToAdminPortal({ ...updatedData, consultationId, conversationLog: updatedLog });
  }, [userData, conversationLog, onSaveData, consultationId, sendToAdminPortal]);

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
      messageText = step.message(userData);
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

          step.delay ? setTimeout(() => setupStepInput(step), step.delay) : setupStepInput(step);
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
  useEffect(() => { if (messages.length === 0) processStep("welcome"); }, []);

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

          // Check if we got a valid analysis or fallback
          if (analysis && analysis.condition && analysis.condition !== "Unable to analyze image at this time") {
            setUserData(prev => {
              const updated = {
                ...prev,
                has_image: "yes",
                image_path: base64String,
                image_analysis: JSON.stringify(analysis),
                footAnalysis: analysis
              };
              onSaveData({
                ...updated,
                consultationId,
                conversationLog
              }, false);
              return updated;
            });

            addMessage("Analysis complete! Here's what I found:", "bot");

            setTimeout(() => {
              addMessage("", "analysis", false, analysis);
              setTimeout(() => {
                const step = chatFlow[currentStep];
                const nextStepId = typeof step.next === 'function' ? step.next("") : step.next;
                if (nextStepId) processStep(nextStepId);
              }, 2000);
            }, 1000);
          } else {
            // Handle fallback response
            console.log("Received fallback analysis, continuing without showing results");
            addMessage("I'm having trouble analyzing your image right now. Let's continue with describing your symptoms instead.", "bot");
            setTimeout(() => {
              processStep("issue_category");
            }, 1500);
          }

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

  const handleSymptomAnalysis = useCallback(async (symptoms: string) => {
    setIsWaitingForResponse(true);
    try {
      addMessage("Analyzing your symptoms...", "bot");
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/analyze-symptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms, consultationId })
      });
      if (!response.ok) throw new Error('Symptom analysis failed');
      const analysis = await response.json();
      setUserData(prev => {
        const updated = {
          ...prev,
          has_symptom_description: "yes",
          symptom_description: symptoms,
          symptom_analysis: JSON.stringify(analysis),
          symptomAnalysisResults: analysis
        };
        onSaveData({
          ...updated,
          consultationId,
          conversationLog
        }, false);
        return updated;
      });
      const step = chatFlow[currentStep];
      const nextStepId = typeof step.next === 'function' ? step.next("") : step.next;
      if (nextStepId) processStep(nextStepId);
    } catch (err) {
      console.error("Symptom analysis error:", err);
      addMessage("We couldn't analyze your symptoms. Let's continue.", "bot");
    } finally {
      setIsWaitingForResponse(false);
    }
  }, [consultationId, currentStep]);

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
    currentStep
  };
}