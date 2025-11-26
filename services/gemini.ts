import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

export const translateText = async (text: string, fromLang: string, toLang: string): Promise<string> => {
  const ai = getClient();
  
  // Using gemini-2.5-flash for fast and accurate text tasks
  const model = 'gemini-2.5-flash';
  
  const prompt = `
    Translate the following ${fromLang} text into ${toLang}.
    Ensure the translation captures the nuance and tone.
    Return ONLY the ${toLang} text, no markdown, no explanations.
    
    ${fromLang} Text: "${text}"
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    
    const translated = response.text;
    return translated?.trim() || "";
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Failed to translate text.");
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Fenrir'): Promise<string> => {
  const ai = getClient();
  const model = 'gemini-2.5-flash-preview-tts';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text }]
      },
      config: {
        // Use string 'AUDIO' to avoid potential enum import issues
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName
            }
          }
        }
      }
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!audioData) {
      throw new Error("No audio data received from Gemini.");
    }
    
    return audioData;
  } catch (error) {
    console.error("TTS error:", error);
    throw new Error("Failed to generate speech.");
  }
};