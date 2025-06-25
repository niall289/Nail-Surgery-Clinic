
import React, { useEffect, useRef } from "react";
import { ChatProvider } from "@/components/lib/ChatContext";
import useChat from "@/hooks/use-chat";
import { AnalysisResults } from "./AnalysisResults";
import NurseAvatar from "./NurseAvatar";
import UserInput from "./UserInput";
import ChatOptions from "./ChatOptions";
import ImageUploader from "./ImageUploader";
import type { Consultation } from "@shared/schema";

interface ChatInterfaceProps {
  consultationId: number | null;
  consultation?: Consultation;
  onCreateConsultation: (data: any) => void;
  onUpdateConsultation: (data: any) => void;
  botName?: string;
  avatarUrl?: string;
  welcomeMessage?: string;
  primaryColor?: string;
}

const ChatInterfaceContent: React.FC<ChatInterfaceProps> = ({
  consultationId,
  consultation,
  onCreateConsultation,
  onUpdateConsultation,
  botName = "Niamh",
  avatarUrl,
  welcomeMessage,
  primaryColor,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSaveData = (data: any, isComplete: boolean) => {
    if (consultationId) {
      onUpdateConsultation(data);
    } else {
      onCreateConsultation(data);
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

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
    handleImageUpload: hookImageUpload,
    validate,
    currentStep,
    chatbotSettings,
    chatContainerRef,
  } = useChat({
    consultationId,
    onSaveData: handleSaveData,
    onImageUpload: handleImageUpload,
  });

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3 bg-gray-50">
        <NurseAvatar />
        <div>
          <h2 className="font-semibold text-lg">{botName}</h2>
          <p className="text-sm text-gray-500">The Nail Surgery Clinic Assistant</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
        style={{ maxHeight: "500px" }}
      >
        {chatHistory.map((message, index) => (
          <div key={index} className={`flex ${message.type === "bot" ? "justify-start" : "justify-end"}`}>
            {message.type === "bot" && (
              <div className="flex items-start gap-3">
                <NurseAvatar size="sm" />
                <div className="bg-gray-100 text-gray-800 p-3 rounded-xl rounded-tl-none max-w-xs text-sm">
                  {message.text}
                </div>
              </div>
            )}
            
            {message.type === "user" && (
              <div className="bg-teal-600 text-white p-3 rounded-xl rounded-br-none max-w-xs text-sm">
                {message.text}
              </div>
            )}
            
            {message.type === "analysis" && message.data && (
              <div className="flex items-start gap-3">
                <NurseAvatar size="sm" />
                <AnalysisResults analysis={message.data} />
              </div>
            )}
          </div>
        ))}
        
        {isWaitingForResponse && (
          <div className="flex items-start gap-3">
            <NurseAvatar size="sm" />
            <div className="bg-gray-100 p-3 rounded-xl text-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-gray-50">
        {options && (
          <ChatOptions
            options={options}
            onSelect={handleOptionSelect}
            disabled={isInputDisabled}
          />
        )}
        
        {showImageUpload && (
          <ImageUploader
            onUpload={hookImageUpload}
            disabled={isInputDisabled}
          />
        )}
        
        {!options && !showImageUpload && (
          <UserInput
            type={inputType}
            onSubmit={handleUserInput}
            disabled={isInputDisabled}
            validate={validate}
            placeholder="Type your message..."
          />
        )}
      </div>
    </div>
  );
};

const ChatInterface: React.FC<ChatInterfaceProps> = (props) => {
  return (
    <ChatProvider>
      <ChatInterfaceContent {...props} />
    </ChatProvider>
  );
};

export default ChatInterface;
