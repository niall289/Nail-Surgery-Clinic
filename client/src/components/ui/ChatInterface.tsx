import { useEffect, useState, useRef } from "react";
import useChat from "@/hooks/use-chat";
import { AnalysisResults } from "./AnalysisResults";
import NurseAvatar from "./NurseAvatar";
import { CameraIcon, Loader2, SendHorizonal } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatInterface() {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    chatHistory,
    options,
    inputType,
    showImageUpload,
    isInputDisabled,
    isWaitingForResponse,
    handleUserInput,
    handleOptionSelect,
    handleImageUpload,
    chatContainerRef,
  } = useChat({
    consultationId: null,
    onSaveData: () => {},
    onImageUpload: async () => "",
  });

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
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center gap-3 mb-4">
        <NurseAvatar />
        <div>
          <div className="font-bold text-sm">Nurse Fiona</div>
          <div className="text-xs text-muted-foreground">FootCare Clinic Assistant</div>
        </div>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto border rounded-lg p-4 space-y-4 bg-white"
      >
        {chatHistory.map((msg, index) => {
          if (msg.type === "analysis") {
            return (
              <div key={index} className="w-full">
                <AnalysisResults results={msg.data} />
              </div>
            );
          }

          const isUser = msg.type === "user";
          return (
            <div
              key={index}
              className={cn(
                "max-w-sm px-4 py-2 rounded-lg text-sm whitespace-pre-line",
                isUser ? "bg-blue-100 ml-auto" : "bg-gray-100"
              )}
            >
              {msg.text}
            </div>
          );
        })}

        {isWaitingForResponse && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin w-4 h-4" />
            Typing...
          </div>
        )}
      </div>

      <div className="mt-4">
        {options ? (
          <div className="grid grid-cols-2 gap-2">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(option)}
                className="bg-primary text-white text-sm px-4 py-2 rounded-xl hover:bg-primary/90"
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {showImageUpload && (
              <label className="cursor-pointer">
                <CameraIcon className="w-5 h-5 text-muted-foreground" />
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
              className="flex-1 border px-3 py-2 rounded-lg text-sm focus:outline-none"
              placeholder="Type your message..."
            />
            <button
              onClick={handleSend}
              disabled={isInputDisabled}
              className="p-2 rounded-full bg-blue-500 text-white disabled:opacity-50"
            >
              <SendHorizonal size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
