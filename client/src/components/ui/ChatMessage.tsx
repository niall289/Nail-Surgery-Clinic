import { FC, useEffect, useState } from "react";
import NurseAvatar from "./NurseAvatar";

interface ChatMessageProps {
  message: string;
  type: "bot" | "user";
  isTyping?: boolean;
  primaryColor?: string; // Added to allow theme color for user messages
}

const DEFAULT_USER_BUBBLE_COLOR = "hsl(186, 100%, 30%)"; // Default teal from ChatInterface

const ChatMessage: FC<ChatMessageProps> = ({ message, type, isTyping = false, primaryColor = DEFAULT_USER_BUBBLE_COLOR }) => {
  // To prevent persistent typing indicators, let's add a timeout
  const [isStillTyping, setIsStillTyping] = useState(isTyping);

  useEffect(() => {
    setIsStillTyping(isTyping);

    // If it's typing, set a maximum timeout to prevent it getting stuck
    if (isTyping) {
      const timer = setTimeout(() => {
        setIsStillTyping(false);
      }, 5000); // Max 5 seconds of typing animation

      return () => clearTimeout(timer);
    }
  }, [isTyping]);

  if (type === "bot") {
    return (
      <div className="flex items-end mb-3 animate-fadeIn"> {/* Use items-end for bubble to align with avatar bottom if avatar is taller */}
        <NurseAvatar size="sm" /> {/* Assuming NurseAvatar is styled appropriately */}
        <div className="ml-2 bg-white rounded-xl py-3 px-4 max-w-[75%] shadow-md"> {/* Rounded corners, shadow, padding */}
          {isStillTyping ? (
            <div className="flex space-x-1 py-1"> {/* Pulsing dots typing indicator */}
              <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse delay-0"></span>
              <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
              <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse delay-300"></span>
            </div>
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
          )}
        </div>
      </div>
    );
  }

  // User message
  return (
    <div className="flex items-end justify-end mb-3 animate-fadeIn">
      <div
        className="mr-2 text-white rounded-xl py-3 px-4 max-w-[75%] shadow-md" // Rounded corners, shadow, padding
        style={{ backgroundColor: primaryColor }}
      >
        <p className="text-sm leading-relaxed">{message}</p> {/* Typography: line height */}
      </div>
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 text-gray-600" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
          />
        </svg>
      </div>
    </div>
  );
};

export default ChatMessage;