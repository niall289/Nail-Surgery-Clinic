import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeFootImage(imageBase64: string): Promise<any> {
  try {
    console.log('Starting image analysis...');
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing');
      return {
        condition: "Unable to analyze image - API key missing",
        severity: "unknown",
        recommendations: [
          "Please describe your symptoms instead",
          "Continue with the consultation",
          "Visit the clinic for assessment"
        ],
        disclaimer: "Image analysis is currently unavailable"
      };
    }

    // Remove data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    console.log('Image cleaned, sending to OpenAI...');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "As a podiatrist AI assistant, analyze this foot image and provide a structured response in JSON format with these fields: condition (string describing what you see), severity (mild/moderate/severe), recommendations (array of 3-4 actionable recommendations), disclaimer (reminder about professional consultation). Be professional but not alarming."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${cleanBase64}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 400,
      temperature: 0.3
    });

    const analysis = response.choices[0]?.message?.content;
    console.log('OpenAI response received:', analysis?.substring(0, 100));
    
    if (!analysis) {
      console.error('No analysis content returned from OpenAI');
      return {
        condition: "Unable to analyze image",
        severity: "unknown",
        recommendations: [
          "Please describe your symptoms instead",
          "Continue with the consultation",
          "Visit the clinic for assessment"
        ],
        disclaimer: "This analysis could not be completed"
      };
    }

    // Try to parse JSON response, fallback to text parsing
    try {
      const parsed = JSON.parse(analysis);
      return {
        condition: parsed.condition || "Analysis completed",
        severity: parsed.severity || "unknown",
        recommendations: parsed.recommendations || ["Visit the clinic for assessment"],
        disclaimer: parsed.disclaimer || "Please consult a healthcare professional for proper diagnosis"
      };
    } catch (parseError) {
      console.log('JSON parse failed, using text analysis');
      return {
        condition: "Image analysis completed",
        severity: "unknown",
        recommendations: [
          "Based on the image analysis",
          "Please describe additional symptoms",
          "Visit the clinic for professional assessment"
        ],
        disclaimer: analysis
      };
    }

  } catch (error) {
    console.error('OpenAI API error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    
    return {
      condition: "Unable to analyze image at this time",
      severity: "unknown",
      recommendations: [
        "Please describe your symptoms instead",
        "Continue with the consultation",
        "Visit the clinic for assessment"
      ],
      disclaimer: "Image analysis is temporarily unavailable. Please continue with describing your symptoms."
    };
  }
}