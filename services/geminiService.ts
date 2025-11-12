import { GoogleGenAI, Type } from "@google/genai";

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

export const generatePromptsFromImage = async (
  imageFile: File,
  apiKey: string,
  count: number = 5,
  existingPrompts?: string[],
  description?: string
): Promise<{ prompts: string[], identifiedStyle: string, identifiedSubject: string }> => {
  if (!apiKey) {
    throw new Error("API key is missing.");
  }
  const ai = new GoogleGenAI({ apiKey });

  const base64Image = await fileToBase64(imageFile);
  const imagePart = {
    inlineData: {
      mimeType: imageFile.type,
      data: base64Image,
    },
  };

  const userDescriptionInstruction = description 
    ? `The user has provided this description for context: "${description}". Use this to guide your analysis and identification.`
    : '';

  const initialInstruction = `You are a highly perceptive AI specializing in image analysis and prompt engineering. Your task is a multi-step process:
${userDescriptionInstruction}
1.  **Identify Core Subject**: First, identify the main subject of the image in a few words (e.g., "Formula 1 race car", "Golden Retriever puppy", "Fantasy castle"). If the user provided a description, let it heavily influence this step.
2.  **Analyze Style Characteristics**: Meticulously analyze the provided image. Deconstruct its core visual characteristics, focusing on:
    *   **Line Work**: Is it clean, bold, sketchy, thin, non-existent? (e.g., "clean, bold black outlines").
    *   **Color Palette**: Is it monochromatic, vibrant, muted, black and white? (e.g., "black and white, high contrast").
    *   **Shading & Texture**: Is it flat, cel-shaded, photorealistic, painterly, non-existent? (e.g., "no shading, flat fills").
    *   **Overall Aesthetic**: What is the overall feeling? (e.g., "designed for coloring," "technical drawing," "minimalist").
3.  **Identify and Name Style**: Based on your style analysis, provide a concise name for the artistic style (e.g., "Coloring book page", "Technical line art", "Vector illustration").`;
  
  const generationInstruction = `4.  **Generate Prompts**: Generate ${count} distinct, highly detailed, and creative prompts. **Crucially, each prompt must satisfy two conditions**:
    *   **Subject Relevance**: The subject of the prompt must be the same as or closely related to the core subject you identified in step 1.
    *   **Style Replication**: The prompt must explicitly embed the specific style characteristics you identified in step 2. Do not just use the style name. For example, instead of just "in a coloring book style", the prompt must contain descriptors like "bold black outlines, no shading, on a clean white background".`;

  const continuationInstruction = existingPrompts ? `You have already generated the following prompts. Ensure the new prompts are unique and different from these:\n${existingPrompts.join('\n- ')}\n` : '';

  const finalInstruction = `The goal is to create new, related subjects that perfectly match the original's aesthetic.

Return ONLY a JSON object with the identified subject, the identified style name, and the list of prompts.`;


  const textPart = {
    text: `${initialInstruction}\n${generationInstruction}\n${continuationInstruction}\n${finalInstruction}`,
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, textPart] },
    config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                identifiedSubject: {
                    type: Type.STRING,
                    description: "The main subject identified in the image.",
                },
                identifiedStyle: {
                    type: Type.STRING,
                    description: "The name of the identified artistic style.",
                },
                prompts: {
                    type: Type.ARRAY,
                    description: `A list of ${count} creative image prompts that are thematically related to the subject and explicitly include the identified style characteristics.`,
                    items: {
                        type: Type.STRING
                    }
                }
            },
            required: ["identifiedSubject", "identifiedStyle", "prompts"]
        }
    }
  });

  try {
    const jsonResponse = JSON.parse(response.text);
    if (jsonResponse.prompts && Array.isArray(jsonResponse.prompts) && jsonResponse.identifiedStyle && jsonResponse.identifiedSubject) {
      return jsonResponse;
    } else {
      throw new Error("Invalid JSON structure in response.");
    }
  } catch (e) {
    console.error("Failed to parse Gemini response:", response.text);
    throw new Error("Could not parse the generated prompts. The API might have returned an unexpected format.");
  }
};
