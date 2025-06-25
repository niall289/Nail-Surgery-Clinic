
import React, { useEffect, useState, useRef } from "react";
import { AnalysisResults } from "./AnalysisResults";
import PatientJourneyTracker from "./PatientJourneyTracker";
import NurseAvatar from "./NurseAvatar";
import { CameraIcon, Loader2, SendHorizonal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage, ChatOption } from "@/hooks/use-chat";

interface ChatInterfaceProps {
  consultationId?: number | null;
  consultation?: any;
  onCreateConsultation?: (data: any) => void;
  onUpdateConsultation?: (data: any) => void;
  botName?: string;
  avatarUrl?: string;
  welcomeMessage?: string;
  primaryColor?: string;
  
  // Props from use-chat hook
  chatHistory: ChatMessage[];
  options: ChatOption[] | null;
  inputType: string;
  showImageUpload: boolean;
  currentData: Record<string, any>;
  isInputDisabled: boolean;
  isWaitingForResponse: boolean;
  handleUserInput: (input: string) => void;
  handleOptionSelect: (option: ChatOption) => void;
  handleImageUpload: (file: File) => void;
  handleSymptomAnalysis: () => void;
  validate: (value: string) => { isValid: boolean; errorMessage?: string };
  currentStep: string;
  chatbotSettings: any;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  updateUserData: (updates: Record<string, any>) => void;
}

export default function ChatInterface(props: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    chatHistory,
    currentStep,
    options,
    inputType,
    showImageUpload,
    isInputDisabled,
    isWaitingForResponse,
    handleUserInput,
    handleOptionSelect,
    handleImageUpload,
    chatContainerRef,
  } = props;

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      handleUserInput(inputValue.trim());
      setInputValue("");
    }
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      handleUserInput(inputValue.trim());
      setInputValue("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, [chatHistory]);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-xl">
      {/* Teal Header */}
      <div className="bg-teal-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <NurseAvatar />
          <div>
            <div className="font-bold text-lg">{props.botName || "Niamh"}</div>
            <div className="text-sm opacity-90">The Nail Surgery Clinic Assistant</div>
          </div>
        </div>
        <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
          Online
        </div>
      </div>

      {/* Progress Tracker */}
      <PatientJourneyTracker currentChatStep={currentStep} />

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {chatHistory.map((msg, index) => {
          if (msg.type === "analysis") {
            return (
              <div key={index} className="w-full">
                <AnalysisResults analysis={msg.data} />
              </div>
            );
          }

          const isUser = msg.type === "user";
          return (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3",
                isUser ? "flex-row-reverse" : "flex-row"
              )}
            >
              {!isUser && <NurseAvatar />}
              <div
                className={cn(
                  "max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm whitespace-pre-line shadow-sm",
                  isUser
                    ? "bg-teal-600 text-white rounded-br-md"
                    : "bg-white border rounded-bl-md"
                )}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {isWaitingForResponse && (
          <div className="flex items-start gap-3">
            <NurseAvatar />
            <div className="bg-white border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground shadow-sm">
              <Loader2 className="animate-spin w-4 h-4" />
              Typing...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4">
        {options ? (
          <div className="grid grid-cols-1 gap-2">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(option)}
                className="bg-teal-600 text-white text-sm px-4 py-3 rounded-xl hover:bg-teal-700 transition-colors"
              >
                {option.label || option.text}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {showImageUpload && (
              <label className="cursor-pointer p-2 rounded-full hover:bg-gray-100 transition-colors">
                <CameraIcon className="w-5 h-5 text-teal-600" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}

            <input
              ref={inputRef}
              type={inputType}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isInputDisabled}
              className="flex-1 border border-gray-200 px-4 py-3 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Type your message..."
            />
            <button
              onClick={handleSend}
              disabled={isInputDisabled || !inputValue.trim()}
              className="p-3 rounded-full bg-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-700 transition-colors"
            >
              <SendHorizonal size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
