import { GoogleGenAI } from "@google/genai";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Sends an image to Gemini to remove its background.
 * Uses gemini-2.5-flash-image for image editing tasks.
 */
export const removeBackground = async (
  base64Image: string,
  mimeType: string
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash-image';
    
    // Clean base64 string if it contains the data URL prefix
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: "Remove the background from this image. Return strictly the image with a transparent background. Ensure high quality edges for the subject.",
          },
        ],
      },
    });

    // Iterate through parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    
    if (!parts) {
      throw new Error("No content received from API");
    }

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        // Construct the data URL for the returned image (usually PNG for transparency)
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("The model did not return an image. It might have been blocked by safety settings.");

  } catch (error) {
    console.error("Error in removeBackground:", error);
    throw error;
  }
};