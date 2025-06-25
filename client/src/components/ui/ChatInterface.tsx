import React, { useRef, useEffect } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import ImageUpload from "@/components/ui/ImageUploader";
import AnalysisResults from "@/components/ui/AnalysisResults";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import NurseAvatar from "@/components/ui/NurseAvatar";
import useChat from "@/hooks/use-chat"; // ✅ FIXED: Direct import

export default function ChatInterface({ consultationId, onSaveData, onImageUpload }) {
  const {
    input,
    setInput,
    messages,
    handleSendMessage,
    uploading,
    chatbotSettings,
    imagePreviewUrl,
    handleImageUpload,
    showImageAnalysisCard,
    imageAnalysisResult,
    name
  } = useChat({ consultationId, onSaveData, onImageUpload }); // ✅ FIXED: Call hook directly

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-2">
        <NurseAvatar />
        <div>
          <h2 className="font-semibold text-lg">
            {chatbotSettings?.welcomeMessage || `Hi ${name || ""}, I’m Fiona – here to help.`}
          </h2>
          <p className="text-sm text-gray-500">
            {chatbotSettings?.subMessage || "Let’s figure out what’s going on."}
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === "bot" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-sm px-4 py-2 rounded-lg shadow-sm text-sm ${
                msg.sender === "bot"
                  ? "bg-gray-100 text-gray-800 rounded-bl-none"
                  : "bg-blue-600 text-white rounded-br-none"
              }`}
            >
              {msg.type === "analysis" && msg.analysis ? (
                <AnalysisResults analysis={msg.analysis} />
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}

        {showImageAnalysisCard && imageAnalysisResult && (
          <div className="flex justify-start">
            <AnalysisResults analysis={imageAnalysisResult} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreviewUrl && (
        <div className="p-4 border-t bg-gray-50">
          <img src={imagePreviewUrl} alt="Preview" className="max-h-48 mx-auto" />
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t flex gap-2 items-center">
        <ImageUpload onUpload={handleImageUpload} uploading={uploading} />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={uploading}
          placeholder="Type your message..."
        />
        <Button onClick={handleSendMessage} disabled={uploading || input.trim() === ""} size="icon">
          <PaperAirplaneIcon className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
