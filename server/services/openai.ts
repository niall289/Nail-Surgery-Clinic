import OpenAI from "openai";

// Initialize OpenAI client with better error handling
function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("WARNING: OPENAI_API_KEY is not set. OpenAI dependent services will be skipped or use fallback data.");
    return null; // Return null if API key is missing
  }

  return new OpenAI({
    apiKey: apiKey,
    timeout: 30000, // 30 second timeout
    maxRetries: 2
  });
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// Create OpenAI client instance
const openai = createOpenAIClient();

const fallbackImageAnalysisResponse = {
  condition: "Unable to analyze image (OpenAI API key missing or service unavailable)",
  severity: "unknown",
  recommendations: [
    "Continue with the consultation to describe your symptoms.",
    "Consider visiting a clinic for an in-person assessment if concerned."
  ],
  disclaimer: "This is a fallback response due to an API issue. Please describe your symptoms or visit a clinic for proper assessment."
};

/**
 * Analyze a foot image using OpenAI's vision model
 * @param imageBase64 Base64 encoded image data (without data URL prefix)
 * @returns Analysis results with condition, severity, and recommendations
 */
export async function analyzeFootImage(imageBase64: string): Promise<{
  condition: string;
  severity: string;
  recommendations: string[];
  disclaimer: string;
}> {
  if (!openai) {
    console.warn("analyzeFootImage: OpenAI client not available. Returning fallback response.");
    return fallbackImageAnalysisResponse;
  }

  try {
    // Validate and clean the base64 string
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      throw new Error("Invalid base64 image data provided");
    }

    // Remove any existing data URL prefix and clean the base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '').trim();
    
    if (!cleanBase64) {
      throw new Error("Empty base64 image data after cleaning");
    }

    // Validate base64 format
    try {
      Buffer.from(cleanBase64, 'base64');
    } catch (e) {
      throw new Error("Invalid base64 format");
    }

    // Create a proper data URL
    const imageUrl = `data:image/jpeg;base64,${cleanBase64}`;

    console.log("Starting OpenAI image analysis with model:", MODEL);
    console.log("Image data length:", cleanBase64.length);

    // Call OpenAI API for image analysis with improved parameters
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a podiatric assessment assistant for the FootCare Clinic in Dublin. 
          Analyze the image of a foot condition and provide:
          1. The most likely condition based on visual symptoms (be specific about the condition)
          2. The apparent severity (mild, moderate, severe)
          3. Up to 3 specific recommendations for the patient

          Format your response as JSON with these fields:
          - condition: string (specific name of the condition)
          - severity: string (mild, moderate, or severe)
          - recommendations: array of strings (3 specific recommendations)

          Be factual and avoid speculating beyond what's visible. If you cannot determine a condition clearly, state that in your assessment.

          Common foot conditions include: bunions, plantar fasciitis, athlete's foot, ingrown toenails, corns, calluses, hammertoes, flat feet, heel spurs, and nail fungus.`
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "I need help identifying this foot condition. Please analyze the image and provide a detailed assessment." 
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            }
          ],
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1000,
    });

    console.log("OpenAI API response received successfully");

    // Validate response structure
    if (!response.choices || response.choices.length === 0) {
      throw new Error("No response choices received from OpenAI");
    }

    const messageContent = response.choices[0].message?.content;
    if (!messageContent) {
      throw new Error("No message content in OpenAI response");
    }

    // Parse the response
    let result;
    try {
      result = JSON.parse(messageContent);
    } catch (parseError) {
      console.error("Failed to parse OpenAI JSON response:", messageContent);
      throw new Error(`Invalid JSON response from OpenAI: ${parseError}`);
    }

    // Validate required fields
    if (!result.condition || !result.severity || !result.recommendations) {
      console.error("Missing required fields in OpenAI response:", result);
      throw new Error("Incomplete response from OpenAI - missing required fields");
    }

    console.log("Image analysis completed successfully");

    // Add disclaimer and return
    return {
      condition: result.condition,
      severity: result.severity,
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : [result.recommendations],
      disclaimer: "This is an AI-assisted preliminary assessment only. Please consult with a qualified healthcare professional for proper diagnosis and treatment."
    };
  } catch (error) {
    // Enhanced error logging for debugging
    console.error("=== IMAGE ANALYSIS ERROR ===");
    
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      // Check for specific OpenAI API errors
      if ('status' in error) {
        const status = (error as any).status;
        const code = (error as any).code;
        const type = (error as any).type;
        
        console.error("OpenAI API Error Details:", {
          status,
          code,
          type,
          error: (error as any).error
        });

        if (status === 429) {
          console.error("RATE LIMIT ERROR: You've exceeded your current quota. Check your plan and billing details.");
        } else if (status === 400) {
          console.error("BAD REQUEST: The request was improperly formatted or contained invalid parameters.");
        } else if (status === 401) {
          console.error("UNAUTHORIZED: Check your OpenAI API key.");
        } else if (status === 413) {
          console.error("PAYLOAD TOO LARGE: The image might be too large.");
        }
      }
    } else {
      console.error("Unknown error type:", typeof error);
      console.error("Error object:", error);
    }

    console.error("=== END ERROR LOG ===");

    // Return a fallback response to keep the chat flow going
    console.log("Using fallback response for image analysis due to API error");
    return fallbackImageAnalysisResponse;
  }
}