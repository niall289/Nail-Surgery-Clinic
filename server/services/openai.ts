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
    // Create a data URL from the base64 string
    const imageUrl = `data:image/jpeg;base64,${imageBase64}`;

    console.log("Starting OpenAI image analysis with model:", MODEL);

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
                url: imageUrl
              }
            }
          ],
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more accurate results
      max_tokens: 800, // Increased token limit
    });

    // Parse the response
    const result = JSON.parse(response.choices[0].message.content || "{}");

    // Add disclaimer
    return {
      ...result,
      disclaimer: "This is an AI-assisted preliminary assessment only. Please consult with a qualified healthcare professional for proper diagnosis and treatment."
    };
  } catch (error) {
    // Enhanced error logging for debugging
    if (error instanceof Error) {
      console.error("Error analyzing foot image:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      // Check for specific OpenAI API errors
      if ('status' in error) {
        console.error("OpenAI API Error Status:", (error as any).status);

        if ((error as any).status === 429) {
          console.error("RATE LIMIT ERROR: You've exceeded your current quota. Check your plan and billing details.");
        } else if ((error as any).status === 400) {
          console.error("BAD REQUEST: The request was improperly formatted or contained invalid parameters.");
        }
      }
    } else {
      console.error("Unknown error analyzing foot image:", error);
    }

    // Return a fallback response to keep the chat flow going
    console.log("Using fallback response for image analysis due to API error");
    return fallbackImageAnalysisResponse;
  }
}