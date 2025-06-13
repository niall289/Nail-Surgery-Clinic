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

    console.log('OpenAI API key found, length:', process.env.OPENAI_API_KEY.length);

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
              text: `You are an AI podiatrist assistant analyzing foot conditions with a friendly and professional tone. Examine this foot image and provide a clinical assessment. Return ONLY valid JSON in this exact format:
{
  "condition": "specific condition name and clinical description",
  "severity": "mild | moderate | severe",
  "recommendations": ["specific treatment advice", "care instructions", "professional follow-up guidance"],
  "disclaimer": "This assessment is provided for informational purposes. Please consult a qualified podiatrist for treatment."
}

Provide specific podiatric recommendations including:
- Immediate care steps
- Treatment options (topical medications, proper nail cutting techniques, etc.)
- When to seek professional care
- Preventive measures

Focus on actionable medical advice for foot conditions. Respond ONLY with JSON, no additional text.`
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
      max_tokens: 800,
      temperature: 0.2,
    });

    console.log("OpenAI response object:", JSON.stringify(response, null, 2));
    const analysis = response.choices[0]?.message?.content?.trim();
    console.log("Full response from OpenAI:", analysis);

    if (!analysis) {
      console.error("OpenAI returned empty content");
      console.error("Response choices:", response.choices);
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