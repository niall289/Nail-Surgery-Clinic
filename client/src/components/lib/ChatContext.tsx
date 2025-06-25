
import React, { createContext, useContext, useState, ReactNode } from "react";

interface ChatContextType {
  userData: Record<string, any>;
  updateUserData: (updates: Record<string, any>) => void;
  handleNextStep: () => void;
  setIsLoading: (loading: boolean) => void;
  setMessageOverride: (message: string | any) => void;
  isLoading: boolean;
  messageOverride: string | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [userData, setUserData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [messageOverride, setMessageOverride] = useState<string | null>(null);

  const updateUserData = (updates: Record<string, any>) => {
    setUserData(prev => ({ ...prev, ...updates }));
  };

  const handleNextStep = () => {
    // This will be handled by the chat flow logic
    console.log("Moving to next step");
  };

  const value: ChatContextType = {
    userData,
    updateUserData,
    handleNextStep,
    setIsLoading,
    setMessageOverride,
    isLoading,
    messageOverride,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
