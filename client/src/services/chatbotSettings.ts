
interface ChatbotSettings {
  welcomeMessage: string;
  botDisplayName: string;
  ctaButtonLabel: string;
  chatbotTone: string;
}

const DEFAULT_SETTINGS: ChatbotSettings = {
  welcomeMessage: "Hello! How can I help you with your foot care needs today?",
  botDisplayName: "Fiona - FootCare Assistant",
  ctaButtonLabel: "Ask Fiona",
  chatbotTone: "Friendly"
};

let cachedSettings: ChatbotSettings = DEFAULT_SETTINGS;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchChatbotSettings(): Promise<ChatbotSettings> {
  const now = Date.now();
  
  // Return cached settings if still fresh
  if (now - lastFetch < CACHE_DURATION && lastFetch > 0) {
    return cachedSettings;
  }

  try {
    console.log('🔄 Fetching chatbot settings from portal...');
    
    const response = await fetch('https://footcareclinicadmin.engageiobots.com/api/chatbot-settings', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Portal API returned ${response.status}: ${response.statusText}`);
    }

    const settings = await response.json();
    
    // Validate and merge with defaults
    cachedSettings = {
      welcomeMessage: settings.welcomeMessage || DEFAULT_SETTINGS.welcomeMessage,
      botDisplayName: settings.botDisplayName || DEFAULT_SETTINGS.botDisplayName,
      ctaButtonLabel: settings.ctaButtonLabel || DEFAULT_SETTINGS.ctaButtonLabel,
      chatbotTone: settings.chatbotTone || DEFAULT_SETTINGS.chatbotTone
    };

    lastFetch = now;
    console.log('✅ Portal settings loaded:', cachedSettings);
    
    return cachedSettings;
    
  } catch (error) {
    console.warn('⚠️ Failed to fetch portal settings, using defaults:', error);
    
    // Return cached settings if we have them, otherwise defaults
    return cachedSettings;
  }
}

// Initialize periodic refresh
if (typeof window !== 'undefined') {
  setInterval(async () => {
    try {
      await fetchChatbotSettings();
      console.log('🔄 Chatbot settings refreshed from portal');
    } catch (error) {
      console.warn('⚠️ Periodic settings refresh failed:', error);
    }
  }, CACHE_DURATION);
}

export { DEFAULT_SETTINGS };
export type { ChatbotSettings };
