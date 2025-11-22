import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateCompletion = async (
  prompt: string,
  context: string = ""
): Promise<string> => {
  const ai = getClient();
  if (!ai) return "Error: API Key missing.";

  try {
    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a helpful writing assistant inside a document editor.
        Context of the document: "${context}"
        
        User Request: "${prompt}"
        
        Return only the requested text content to be inserted into the document. Do not wrap in quotes or markdown code blocks unless requested. Keep it clean and professional.`,
    });
    return result.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I couldn't generate text at this moment.";
  }
};