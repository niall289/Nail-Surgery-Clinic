import { useEffect, useRef } from "react";
import { useChat } from "@/hooks/use-chat";
import ChatMessage from "./ChatMessage";
import ChatOptions from "./ChatOptions";
import UserInput from "./UserInput";
import ImageUploader from "./ImageUploader";
import NurseAvatar from "./NurseAvatar";
import PatientJourneyTracker from "./PatientJourneyTracker";
import AnalysisResults from "./AnalysisResults";
import type { Consultation } from "@shared/schema";

interface ChatInterfaceProps {
  consultationId: number | null;
  consultation: Consultation | undefined;
  onCreateConsultation: (data: Partial<Consultation>) => void;
  onUpdateConsultation: (data: Partial<Consultation>) => void;
  primaryColor?: string;
  botName?: string;
  avatarUrl?: string;
  welcomeMessage?: string;
}

const DEFAULT_PRIMARY_COLOR = "hsl(186, 100%, 30%)";
const DEFAULT_BOT_NAME = "Niamh";
const DEFAULT_AVATAR_URL = "/assets/images/nurse-niamh.png";

export default function ChatInterface({
  consultationId,
  consultation,
  onCreateConsultation,
  onUpdateConsultation,
  primaryColor = DEFAULT_PRIMARY_COLOR,
  botName = '',
  avatarUrl = '',
}: ChatInterfaceProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const {
    chatHistory,
    options,
    inputType,
    showImageUpload,
    currentData,
    isInputDisabled,
    isWaitingForResponse,
    handleUserInput,
    handleOptionSelect,
    handleImageUpload,
    handleSymptomAnalysis,
    validate,
    currentStep,
    chatbotSettings,
    chatContainerRef
  } = useChat({
    consultationId,
    onSaveData: (data, isComplete) => {
      if (isComplete && !consultationId) {
        onCreateConsultation(data);
      } else if (consultationId) {
        onUpdateConsultation(data);
      }
    },
    onImageUpload: async (file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };
        reader.readAsDataURL(file);
      });
    }
  });

  useEffect(() => {
    if (chatContainerRef.current) {
      const lastMessage = chatHistory[chatHistory.length - 1];
      if (lastMessage && lastMessage.type === "analysis") {
        setTimeout(() => {
          const analysisElements = chatContainerRef.current!.querySelectorAll('[data-analysis-card]');
          const lastAnalysisCard = analysisElements[analysisElements.length - 1] as HTMLElement;
          if (lastAnalysisCard) {
            const container = chatContainerRef.current!;
            const containerRect = container.getBoundingClientRect();
            const cardRect = lastAnalysisCard.getBoundingClientRect();
            const currentScrollTop = container.scrollTop;
            const cardTopRelativeToContainer = cardRect.top - containerRect.top;
            const targetScrollTop = currentScrollTop + cardTopRelativeToContainer - 10;
            container.scrollTo({
              top: Math.max(0, targetScrollTop),
              behavior: 'smooth'
            });
          }
        }, 200);
      } else {
        setTimeout(() => {
          chatContainerRef.current!.scrollTop = chatContainerRef.current!.scrollHeight;
        }, 100);
      }
    }
  }, [chatHistory, options]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 1600);
    return () => clearTimeout(timer);
  }, [chatHistory.length]);

  return (
    <div
      className="w-full md:max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col h-screen md:h-[700px] md:max-h-[90vh] fixed md:static bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="px-6 py-4 flex items-center shadow-md" style={{ backgroundColor: primaryColor }}>
        <NurseAvatar size="md" avatarUrl={avatarUrl || DEFAULT_AVATAR_URL} />
        <div className="ml-3">
          <h2 className="text-white font-semibold text-lg">
            {chatbotSettings?.botDisplayName || botName || DEFAULT_BOT_NAME}
          </h2>
          <p className="text-white opacity-80 text-sm">The Nail Surgery Clinic Assistant</p>
        </div>
        <div className="ml-auto">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Online
          </span>
        </div>
      </div>

      {currentStep && currentStep !== 'welcome' && (
        <PatientJourneyTracker
          currentChatStep={currentStep}
          className="mx-2 mt-2 md:mx-4 md:mt-3"
          primaryColor={primaryColor}
        />
      )}

      <div
        ref={chatContainerRef}
        className="chat-container flex-1 overflow-y-auto p-4 bg-gradient-to-br from-white to-slate-50"
        style={{ paddingBottom: '1rem' }}
      >
        <div className="space-y-3">
          {chatHistory.map((message, index) => (
            <div key={index}>
              {message.type === "analysis" && message.data ? (
                <AnalysisResults analysis={message.data} className="animate-fadeIn" />
              ) : (
                <ChatMessage
                  message={message.text}
                  type={message.type}
                  isTyping={message.isTyping}
                  primaryColor={primaryColor}
                />
              )}
            </div>
          ))}

          {options && options.length > 0 && (
            <ChatOptions options={options} onSelect={handleOptionSelect} primaryColor={primaryColor} />
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        {showImageUpload ? (
          <ImageUploader
            onImageUpload={handleImageUpload}
            disabled={isWaitingForResponse}
          />
        ) : (
          <UserInput
            type={inputType}
            disabled={isInputDisabled}
            isWaiting={isWaitingForResponse}
            onSubmit={handleUserInput}
            validate={validate}
            currentData={currentData}
            primaryColor={primaryColor}
          />
        )}
      </div>
    </div>
  );
}
