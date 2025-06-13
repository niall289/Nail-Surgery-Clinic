import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface UserInputProps {
  type?: 'text' | 'email' | 'tel' | 'textarea' | null;
  disabled?: boolean;
  isWaiting?: boolean;
  onSubmit: (value: string) => void;
  validate?: (value: string) => { isValid: boolean; errorMessage?: string };
  currentData?: Record<string, any>;
  primaryColor?: string;
}

const DEFAULT_INPUT_PRIMARY_COLOR = "hsl(186, 100%, 30%)"; // Default teal

export default function UserInput({
  type,
  disabled = false,
  isWaiting = false,
  onSubmit,
  validate,
  currentData,
  primaryColor = DEFAULT_INPUT_PRIMARY_COLOR
}: UserInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset value when type changes
  useEffect(() => {
    setValue("");
    setError(undefined);
  }, [type]);

  // Focus input when it becomes enabled
  useEffect(() => {
    if (!disabled && type) {
      if (type === 'textarea' && textareaRef.current) {
        textareaRef.current.focus();
      } else if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [disabled, type]);

  const handleSubmit = () => {
    if (disabled || !type) return;

    if (validate && value.trim().length > 0) {
      const result = validate(value);
      if (!result.isValid) {
        setError(result.errorMessage);
        return;
      }
    }

    onSubmit(value);
    setValue("");
    setError(undefined);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (type !== 'textarea') {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleTextareaKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && type === 'textarea') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!type || (type !== 'textarea' && type !== 'text' && type !== 'email' && type !== 'tel')) {
    // Standard input is hidden or disabled
    return (
      <div className="flex items-center space-x-2">
        <Input 
          type="text" 
          disabled={true}
          placeholder="Waiting for options..."
          className="flex-1 border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties} // Use primaryColor for focus ring
        />
        <Button
          disabled={true}
          className="text-white rounded-lg p-3 focus:outline-none focus:ring-2 disabled:opacity-50"
          style={{ backgroundColor: primaryColor, '--tw-ring-color': primaryColor } as React.CSSProperties}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
            />
          </svg>
        </Button>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleTextareaKeyPress}
          disabled={disabled || isWaiting}
          placeholder="Type your message..."
          className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:border-transparent h-24 resize-none"
          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
        />
        {error && (
          <div className="flex items-center mt-1 text-red-600 text-xs"> {/* Standardized error color */}
            <AlertCircle className="h-3 w-3 mr-1" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex justify-end space-x-2 mt-2">
          <Button
            variant="outline"
            onClick={() => onSubmit("(Skipped)")} // Consider if skip should also use primaryColor for consistency or a neutral
            disabled={disabled || isWaiting}
            className="text-gray-700 border-gray-300 hover:bg-gray-100 font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={disabled || isWaiting}
            className="text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2"
            style={{ backgroundColor: primaryColor, '--tw-ring-color': primaryColor } as React.CSSProperties}
          >
            Submit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center space-x-2">
        <Input 
          ref={inputRef}
          type={type} 
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={disabled || isWaiting}
          placeholder={`Type your ${type === "tel" ? "phone number" : type === "email" ? "email" : "message"}...`}
          className="flex-1 border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:border-transparent" // Changed to rounded-lg
          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          autoComplete={type === 'text' ? 'name' : type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'off'}
        />
        <Button
          onClick={handleSubmit}
          disabled={disabled || isWaiting}
          className="text-white rounded-lg p-3 focus:outline-none focus:ring-2 disabled:opacity-50" // Changed to rounded-lg and adjusted padding
          style={{ backgroundColor: primaryColor, '--tw-ring-color': primaryColor } as React.CSSProperties}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
            />
          </svg>
        </Button>
      </div>
      {error && (
        <div className="flex items-center mt-1 text-red-600 text-xs ml-4"> {/* Standardized error color */}
          <AlertCircle className="h-3 w-3 mr-1" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}