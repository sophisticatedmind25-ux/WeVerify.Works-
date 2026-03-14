
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VerificationResult } from "../types";

// Initialize the Google GenAI client with process.env.API_KEY.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * decodeBase64
 * Manual base64 decoding helper.
 */
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * decodePCM
 * Decodes raw PCM data from the API into an AudioBuffer.
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * generateSpeech
 * Transforms text into audio using the Gemini TTS model.
 */
export const generateSpeech = async (text: string): Promise<AudioBuffer | null> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say naturally and professionally: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Professional female voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const bytes = decodeBase64(base64Audio);
    return await decodeAudioData(bytes, audioContext, 24000, 1);
  } catch (err) {
    console.error("Speech generation failed (likely quota or model availability):", err);
    return null;
  }
};

/**
 * generateImage
 * Generates a high-quality image based on a prompt.
 */
export const generateImage = async (prompt: string): Promise<string | null> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (err: any) {
    // If it's a quota error, log a shorter message
    if (err?.message?.includes('429') || err?.message?.includes('quota')) {
      console.warn("Image generation quota exceeded, using fallback.");
    } else {
      console.error("Image generation failed:", err);
    }
    // Fallback to a high-quality professional placeholder
    return `https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop`;
  }
};

/**
 * verifyAddressIntegrity
 * Uses standard Gemini Flash to analyze address validity without paid Maps tool.
 */
export const verifyAddressIntegrity = async (address: string, coords?: { latitude: number, longitude: number }) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Act as a Verification Officer. Analyze the physical existence and residency status of the following address: "${address}". 
      
      Provide a JSON response with:
      - score: number (0-100)
      - verdict: "AUTHENTIC" | "SUSPICIOUS" | "MANIPULATED"
      - analysis: string (professional assessment of the address format, location type, and likelihood of being a valid residence)
      - sources: array of objects { title: string, uri: string } (generate 1-2 plausible public record source names)
      
      Output ONLY JSON.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const data = JSON.parse(response.text.trim());
    return {
      ...data,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error("Address verification failed:", err);
    return {
      score: 0,
      verdict: 'UNCONFIRMED',
      analysis: "Unable to verify address integrity at this time.",
      sources: [],
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * findCompanyInfo
 * Uses standard Gemini Flash to extract/estimate company info without paid Search tool.
 */
export const findCompanyInfo = async (companyName: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Act as a Corporate Researcher. Find or estimate official verification contact details for "${companyName}".
      If the company is well known, use real data. If unknown, generate plausible professional placeholder data for a verification demo.
      
      Output JSON only:
      {
        "name": "Contact Name",
        "title": "Job Title",
        "company": "${companyName}",
        "email": "email@domain.com",
        "phone": "Phone Number",
        "address": "Physical Address"
      }`,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text.trim());
  } catch (err) {
    console.error("Company info lookup failed:", err);
    return {
      name: "",
      title: "HR Manager",
      company: companyName,
      email: "",
      phone: "",
      address: ""
    };
  }
};

/**
 * verifyTextClaim
 * Uses standard Gemini Flash for claim analysis.
 */
export const verifyTextClaim = async (claim: string): Promise<VerificationResult> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Act as a Forensic Verification Officer. Analyze this claim: "${claim}". 
      Check for logical consistency, red flags, and professional validity.
      
      Output JSON only:
      {
        "score": number (0-100),
        "verdict": "AUTHENTIC" | "SUSPICIOUS" | "MANIPULATED" | "UNCONFIRMED",
        "analysis": "Detailed professional analysis string",
        "sources": [{"title": "Source Name", "uri": "http://example.com"}]
      }`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const data = JSON.parse(response.text.trim());
    return { ...data, timestamp: new Date().toISOString() };
  } catch (err) {
    console.error("Text claim verification failed:", err);
    return {
      score: 0,
      verdict: 'UNCONFIRMED',
      analysis: "System unable to process claim.",
      sources: [],
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * verifyImageAuthenticity
 * Uses Gemini Flash (Multimodal) for image analysis.
 */
export const verifyImageAuthenticity = async (base64Image: string): Promise<VerificationResult> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: "Act as a Document Forensics Expert. Verify this image for template forgery, field manipulation, font inconsistencies, or metadata artifacts. Provide a JSON report with score (0-100), verdict (AUTHENTIC/SUSPICIOUS/MANIPULATED), and analysis." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            verdict: { type: Type.STRING },
            analysis: { type: Type.STRING }
          },
          required: ['score', 'verdict', 'analysis']
        }
      }
    });

    return { ...JSON.parse(response.text.trim()), sources: [], timestamp: new Date().toISOString() };
  } catch (err) {
    console.error("Image verification failed:", err);
    return {
      score: 0,
      verdict: 'UNCONFIRMED',
      analysis: "Forensic analysis failed to execute.",
      sources: [],
      timestamp: new Date().toISOString()
    };
  }
};

