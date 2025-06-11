import OpenAI from "openai";
import fs from "fs";
import path from "path";

// Use a separate client for image generation to avoid conflicts
let imageGenClient: OpenAI | null = null;

if (process.env.OPENAI_API_KEY) {
  imageGenClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.warn("OPENAI_API_KEY is not set. Image generation will be skipped or use cached/placeholder images.");
}

/**
 * Generate an image of a friendly Irish nurse for the chatbot
 * @returns Base64 encoded image data
 */
export async function generateNurseImage(): Promise<string> {
  const cachePath = path.join(process.cwd(), "public", "fiona-nurse-avatar.png"); // Ensure this path is correct relative to where the server runs
  const assetsCachePath = path.join(process.cwd(), "client", "public", "assets", "images", "nurse-fiona.png"); // Fallback to existing asset

  // Check if we've already generated and cached the image in public
  if (fs.existsSync(cachePath)) {
    console.log("Using cached nurse image from public/fiona-nurse-avatar.png");
    const imageBuffer = fs.readFileSync(cachePath);
    return imageBuffer.toString("base64");
  }

  if (!imageGenClient) {
    console.warn("OpenAI image generation client not initialized. Attempting to use fallback asset image.");
    if (fs.existsSync(assetsCachePath)) {
        console.log("Using fallback nurse image from client/public/assets/images/nurse-fiona.png");
        const imageBuffer = fs.readFileSync(assetsCachePath);
        return imageBuffer.toString("base64");
    }
    throw new Error("OpenAI client not initialized and fallback image not found. Cannot provide nurse image.");
  }

  try {
    // Generate a new image if not cached and OpenAI client is available
    console.log("Generating new nurse image with DALL-E");
    const response = await imageGenClient.images.generate({
      model: "dall-e-3",
      prompt: "A friendly Irish female nurse with red hair, professional uniform with a teal accent, warm smile, against a white background. Realistic headshot portrait with a gentle, trustworthy expression. Digital illustration style, simple clean background.",
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json",
    });

    // Get the base64 data
    if (!response.data || response.data.length === 0) {
      throw new Error("Invalid response from OpenAI image generation");
    }

    const firstImage = response.data[0];
    if (!firstImage || !firstImage.b64_json) {
      throw new Error("Invalid image data from OpenAI");
    }

    const imageData = response.data[0].b64_json;

    // Ensure the public directory exists
    const publicDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Save the image to cache
    if (imageData) {
      fs.writeFileSync(cachePath, Buffer.from(imageData, "base64"));
    } else {
      throw new Error("No image data received from OpenAI");
    }

    return imageData;
  } catch (error) {
    console.error("Error generating nurse image with OpenAI:", error);
    console.warn("Attempting to use fallback asset image due to OpenAI error.");
    if (fs.existsSync(assetsCachePath)) {
        console.log("Using fallback nurse image from client/public/assets/images/nurse-fiona.png");
        const imageBuffer = fs.readFileSync(assetsCachePath);
        return imageBuffer.toString("base64");
    }
    throw new Error("Failed to generate nurse image with OpenAI and fallback image not found.");
  }
}