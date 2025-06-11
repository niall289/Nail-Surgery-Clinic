import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeFootImage(imageBase64: string): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing');
      return "I'm unable to analyze images at the moment. Please describe your symptoms instead.";
    }

    // Remove data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "As a podiatrist AI assistant, analyze this foot image and provide a brief, professional assessment. Focus on visible conditions, but remind the user that this is preliminary and they need professional examination. Be supportive and avoid alarming language. Keep response under 200 words."
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
      max_tokens: 300,
      temperature: 0.7
    });

    const analysis = response.choices[0]?.message?.content;
    if (!analysis) {
      return "I was unable to analyze the image. Please describe your symptoms instead.";
    }

    return analysis;
  } catch (error) {
    console.error('OpenAI API error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return "I'm unable to analyze images at the moment. Please describe your symptoms instead.";
  }
}