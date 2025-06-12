import React from "react";
import type { ChatOption } from "@/lib/chatFlow";

interface ChatOptionsProps {
  options: ChatOption[];
  onSelect: (option: ChatOption) => void;
  primaryColor?: string;
}

export default function ChatOptions({
  options,
  onSelect,
  primaryColor = "hsl(186, 100%, 30%)",
}: ChatOptionsProps) {
  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => onSelect(option)}
          className="w-full text-left px-4 py-3 rounded-md border border-gray-300 bg-white hover:bg-gray-50 font-semibold transition-all duration-150 transform hover:scale-[1.01] focus:outline-none"
        >
          {option.text}
        </button>
      ))}
    </div>
  );
}
