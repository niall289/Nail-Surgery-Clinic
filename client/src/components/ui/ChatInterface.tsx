
import React, { useRef, useEffect } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import ImageUpload from "@/components/ui/ImageUploader";
import AnalysisResults from "@/components/ui/AnalysisResults";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import NurseAvatar from "@/components/ui/NurseAvatar";
import useChat from "@/hooks/use-chat";

export default function ChatInterface({ consultationId, onSaveData, onImageUpload }) {
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
    validate,
    currentStep,
    chatbotSettings,
    chatContainerRef,
  } = useChat({ consultationId, onSaveData, onImageUpload });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputType === "text") {
        const input = (e.target as HTMLInputElement).value;
        if (input.trim()) {
          handleUserInput(input.trim());
          (e.target as HTMLInputElement).value = "";
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-2">
        <NurseAvatar />
        <div>
          <h2 className="font-semibold text-lg">
            {chatbotSettings?.botDisplayName || "Niamh"}
          </h2>
          <p className="text-sm text-gray-500">
            The Nail Surgery Clinic Assistant
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`flex ${msg.type === "bot" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-sm px-4 py-2 rounded-lg shadow-sm text-sm ${
                msg.type === "bot"
                  ? "bg-gray-100 text-gray-800 rounded-bl-none"
                  : msg.type === "analysis"
                  ? "bg-blue-50 border border-blue-200 rounded-lg"
                  : "bg-blue-600 text-white rounded-br-none"
              }`}
            >
              {msg.type === "analysis" && msg.data ? (
                <AnalysisResults analysis={msg.data} />
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Options */}
      {options && (
        <div className="p-4 border-t">
          <div className="flex flex-wrap gap-2">
            {options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => handleOptionSelect(option)}
                disabled={isInputDisabled}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Image Upload */}
      {showImageUpload && (
        <div className="p-4 border-t">
          <ImageUpload onUpload={handleImageUpload} uploading={isWaitingForResponse} />
        </div>
      )}

      {/* Input Area */}
      {inputType === "text" && (
        <div className="p-4 border-t flex gap-2 items-center">
          <Input
            onKeyDown={handleKeyPress}
            disabled={isInputDisabled}
            placeholder="Type your message..."
          />
          <Button 
            onClick={() => {
              const input = document.querySelector('input') as HTMLInputElement;
              if (input?.value.trim()) {
                handleUserInput(input.value.trim());
                input.value = "";
              }
            }} 
            disabled={isInputDisabled} 
            size="icon"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
