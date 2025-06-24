import React, { createContext, useContext, useState, useCallback } from 'react';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [messageOverride, setMessageOverride] = useState<string | null>(null);

  const updateUserData = useCallback((updates: Record<string, any>) => {
    setUserData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleNextStep = useCallback(() => {
    // This should trigger the next step in your chat flow
    // Implementation depends on your chat flow logic
    console.log("Moving to next step...");
  }, []);

  const value = {
    userData,
    updateUserData,
    handleNextStep,
    setIsLoading,
    setMessageOverride
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

interface UserData {
  [key: string]: any;
  imagePath?: string;
  imageAnalysisResults?: any;
}

interface ChatContextType {
  userData: UserData;
  updateUserData: (updates: Record<string, any>) => void;
  handleNextStep: () => void;
  setIsLoading: (loading: boolean) => void;
  setMessageOverride: (message: string | null) => void;
}

interface ChatContextType {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
  handleNextStep: () => void;
  setIsLoading: (loading: boolean) => void;
  setMessageOverride: (message: string) => void;
  isLoading: boolean;
  messageOverride: string | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [messageOverride, setMessageOverride] = useState<string | null>(null);

  const updateUserData = useCallback((data: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...data }));
  }, []);

  const handleNextStep = useCallback(() => {
    // Handle next step logic here
    console.log('Next step triggered');
  }, []);

  return (
    <ChatContext.Provider value={{
      userData,
      updateUserData,
      handleNextStep,
      setIsLoading,
      setMessageOverride,
      isLoading,
      messageOverride
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};