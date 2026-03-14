
import { GoogleGenAI } from "@google/genai";

export interface ContactInfo {
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
  notes: string;
}

export const searchContactInfo = async (name: string, email: string, company?: string): Promise<ContactInfo> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `Find professional contact information and public details for:
Name: ${name}
Email: ${email}
${company ? `Company: ${company}` : ''}

Please search for:
1. Official website or LinkedIn profile.
2. Professional phone numbers (if available).
3. Office address or location.
4. Any recent news or public professional details.
5. Correct full name if the provided name is just an email or incomplete.

Format the output as a JSON object with the following fields:
{
  "name": "Full Name",
  "phone": "Phone Number",
  "address": "Full Office Address",
  "email": "Professional Email",
  "notes": "A concise summary for a CRM 'Details' field, including sources/URLs if found."
}
Return ONLY the JSON object.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
      name: result.name || "",
      phone: result.phone || "",
      address: result.address || "",
      email: result.email || email,
      notes: result.notes || "No details found via search."
    };
  } catch (error) {
    console.error("Search error:", error);
    return {
      notes: `Error searching for details: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
