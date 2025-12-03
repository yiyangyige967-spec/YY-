import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  // Always create a new client to ensure the latest API key is used
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

export const editAccessoryColor = async (
  base64Image: string,
  mimeType: string,
  targetColorDescription: string,
  aspectRatio: string = "1:1"
): Promise<string> => {
  const ai = getClient();
  
  // Clean the base64 string if it contains the data URL prefix
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  const prompt = `
    You are an expert product photographer and editor.
    Task: Recolor the hair accessory (发饰) in this image to: ${targetColorDescription}.
    
    STRICT REQUIREMENTS:
    1. **Texture Fidelity**: Preserve the EXACT material properties. If it is satin, keep the sheen. If velvet, keep the soft pile. If rhinestone, keep the sharp reflections.
    2. **Geometry**: Do not change the shape, size, or position of the accessory.
    3. **High Quality & Low Noise**: The output MUST be crystal clear. Aggressively reduce digital noise and grain. Use professional studio lighting aesthetics.
    4. **Realism**: The result must be photorealistic.
    5. **Background**: Keep the background and surrounding elements (hair, skin) completely unchanged.
    
    Return only the modified image.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
        }
      }
    });

    // Iterate through parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    
    if (!parts) {
      throw new Error("No content returned from Gemini.");
    }

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in the response.");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};