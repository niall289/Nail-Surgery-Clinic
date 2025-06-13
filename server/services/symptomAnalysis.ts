import OpenAI from "openai";

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

/**
 * Analyze foot-related symptoms using OpenAI
 * @param symptoms User's description of their symptoms
 * @returns Analysis with potential conditions, severity, recommendation, and next steps
 */
export async function analyzeSymptoms(symptoms: string): Promise<{
  potentialConditions: string[];
  severity: string;
  urgency: string;
  recommendation: string;
  nextSteps: string[];
  disclaimer: string;
}> {
  try {
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }
    // Call OpenAI API for symptom analysis
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a foot care triage assistant specializing in podiatry with a friendly and professional tone. Analyze the patient's symptoms and provide:

          1. List of 1-3 potential conditions based on the symptoms (most likely first)
          2. Apparent severity (mild, moderate, severe)
          3. Urgency level (routine, soon, urgent)
          4. A brief recommendation
          5. 2-3 specific next steps the patient should take

          Format your response as JSON with these fields:
          - potentialConditions: string[] (array of condition names)
          - severity: string (mild, moderate, or severe)
          - urgency: string (routine, soon, urgent)
          - recommendation: string (brief recommendation)
          - nextSteps: string[] (array of next steps)

          Be factual and avoid speculating beyond the symptoms provided. If the information is insufficient for a confident assessment, state that more information is needed.`
        },
        {
          role: "user",
          content: `Patient is describing the following foot-related symptoms: "${symptoms}"`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 600,
    });

    // Parse the response
    const result = JSON.parse(response.choices[0].message.content || "{}");

    // Add disclaimer
    return {
      ...result,
      disclaimer: "This analysis is for informational purposes only and does not constitute medical advice. Please consult with a qualified healthcare professional for proper diagnosis and treatment."
    };
  } catch (error) {
    console.error("Error analyzing symptoms:", error);

    // Return a fallback response to keep the chat flow going regardless of environment
    console.log("Using fallback response for symptom analysis due to API error");
    return {
      potentialConditions: ["Unable to analyze symptoms at this time"],
      severity: "unknown",
      urgency: "unknown",
      recommendation: "Please continue the consultation and visit the clinic for a thorough assessment",
      nextSteps: [
        "Provide detailed symptom information",
        "Book an appointment with a specialist",
        "Avoid self-diagnosis"
      ],
      disclaimer: "This is a fallback response due to an API issue. Please visit the clinic for proper assessment."
    };
  }
}