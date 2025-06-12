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

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    console.log('Image cleaned, base64 length:', cleanBase64.length);

    if (cleanBase64.length < 100) {
      console.error('Base64 string too short, likely invalid');
      return {
        condition: "Invalid image data",
        severity: "unknown",
        recommendations: [
          "Please try uploading the image again",
          "Ensure the image is clear and properly formatted",
          "Continue with describing your symptoms"
        ],
        disclaimer: "Unable to process the uploaded image"
      };
    }

    console.log('Sending image to OpenAI Vision API...');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                `You are a professional podiatrist AI. Analyze the foot image and return ONLY valid JSON. 
Format: {
  "condition": "string",
  "severity": "mild | moderate | severe",
  "recommendations": ["string", "string", "string"],
  "disclaimer": "string"
}
IMPORTANT: Respond ONLY with JSON. Do not include any explanation, markdown, or extra text.`
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
      temperature: 0.2,
    });

    const analysis = response.choices[0]?.message?.content?.trim();
    console.log("Full response from OpenAI:", analysis);

    if (!analysis) {
      throw new Error("No content returned from OpenAI");
    }

    try {
      const cleaned = analysis.replace(/```json\n?|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return {
        condition: parsed.condition || "Unknown condition",
        severity: parsed.severity || "unknown",
        recommendations: parsed.recommendations || ["Visit a clinic for further assessment"],
        disclaimer: parsed.disclaimer || "This is a preliminary AI assessment. Please consult a qualified healthcare provider."
      };
    } catch (parseError) {
      console.error("JSON parse failed:", parseError);
      return {
        condition: "Unable to parse image analysis",
        severity: "unknown",
        recommendations: [
          "Please describe your symptoms instead",
          "Continue with the consultation",
          "Visit the clinic for assessment"
        ],
        disclaimer: "OpenAI response was not valid JSON. This is a fallback message."
      };
    }

  } catch (error) {
    console.error('OpenAI API error:', error);
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
