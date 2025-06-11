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

    // Remove data URL prefix if present and validate
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
    
    console.log('Sending to OpenAI vision API...');

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
      // Clean up the response - remove markdown code blocks if present
      const cleanedAnalysis = analysis.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanedAnalysis);
      
      return {
        condition: parsed.condition || "Analysis completed",
        severity: parsed.severity || "mild",
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : ["Visit the clinic for assessment"],
        disclaimer: "This is an AI-assisted preliminary assessment only. Please consult with a qualified healthcare professional for proper diagnosis and treatment."
      };
    } catch (parseError) {
      console.log('JSON parse failed, attempting to extract information from text');
      
      // Try to extract structured information from the text response
      const conditionMatch = analysis.match(/"condition":\s*"([^"]+)"/);
      const severityMatch = analysis.match(/"severity":\s*"([^"]+)"/);
      const recommendationsMatch = analysis.match(/"recommendations":\s*\[(.*?)\]/s);
      
      let recommendations = ["Visit the clinic for professional assessment"];
      if (recommendationsMatch) {
        try {
          const recArray = JSON.parse(`[${recommendationsMatch[1]}]`);
          recommendations = recArray.filter(r => typeof r === 'string');
        } catch (e) {
          console.log('Failed to parse recommendations from text');
        }
      }
      
      return {
        condition: conditionMatch ? conditionMatch[1] : "Foot condition identified",
        severity: severityMatch ? severityMatch[1] : "moderate",
        recommendations: recommendations,
        disclaimer: "This is an AI-assisted preliminary assessment only. Please consult with a qualified healthcare professional for proper diagnosis and treatment."
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