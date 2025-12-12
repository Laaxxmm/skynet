
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionResult, Agreement } from "../types";



// Initialize Gemini Client
// In a real production app, this should be proxied through a backend to protect the key.
const ai = new GoogleGenAI({ apiKey: (import.meta.env.VITE_GOOGLE_API_KEY || '').trim() });

const MODEL_NAME = 'gemini-2.5-flash';

/**
 * extracts metadata from a PDF or Image file using Gemini Vision capabilities
 */
export const extractAgreementData = async (
  fileBase64: string,
  mimeType: string
): Promise<ExtractionResult> => {
  const apiKey = (import.meta.env.VITE_GOOGLE_API_KEY || '').trim();
  if (!apiKey) {
    console.warn("No API Key found. Returning mock data.");
    return mockExtraction();
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBase64,
            },
          },
          {
            text: `Analyze this legal document image/pdf. 
            
            1. Extract the following details into the JSON structure: type, partyA, partyB, startDate, renewalDate, expiryDate, location, summary.
            IMPORTANT: 
            - For 'location', extract ONLY the City and State (e.g., "Bangalore, Karnataka"). Do not include full address.
            - For 'renewalDate', 'startDate', 'expiryDate': Extract ONLY the date in YYYY-MM-DD format. If the date is not explicitly mentioned as a specific calendar date, return null. DO NOT return clauses or sentences like "Renewable at option of...".
            
            2. Extract the FULL TEXT content of the document into the 'fullText' field. 
            IMPORTANT FORMATTING INSTRUCTIONS:
            - Use Markdown formatting (headers, bold, lists).
            - INSERT DOUBLE NEWLINES (\n\n) between every paragraph and section to ensure proper spacing. 
            - Do not return a single block of text. Structure it clearly.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            partyA: { type: Type.STRING },
            partyB: { type: Type.STRING },
            startDate: { type: Type.STRING },
            renewalDate: { type: Type.STRING },
            expiryDate: { type: Type.STRING },
            location: { type: Type.STRING },
            summary: { type: Type.STRING },
            fullText: { type: Type.STRING },
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text) as ExtractionResult;

    // Return the result directly. The calling component (Uploader) will handle saving 
    // after adding metadata like status and risk score.
    return result;

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};

/**
 * Generates a renewal draft based on previous agreement data
 */
export const generateRenewalDraft = async (
  agreement: Agreement
): Promise<string> => {
  const apiKey = (import.meta.env.VITE_GOOGLE_API_KEY || '').trim();
  if (!apiKey) return mockRenewalDraft(agreement);

  try {
    let prompt = "";
    const today = new Date().toISOString().split('T')[0];
    const newStartDate = agreement.expiryDate;
    // Calculate new expiry (approx 1 year later)
    const d = new Date(agreement.expiryDate);
    d.setFullYear(d.getFullYear() + 1);
    const newExpiryDate = d.toISOString().split('T')[0];

    if (agreement.rawContent && agreement.rawContent.length > 50) {
      // High Fidelity Mode: Rewrite the existing text
      prompt = `
        You are a legal document expert.
        
        Input Document Text:
        """
        ${agreement.rawContent}
        """
        
        Task:
        Generate a "Renewal Agreement" document.
        You MUST preserve the EXACT structure, clause numbering, and legal language of the original document provided above. 
        Do not summarize. Do not skip clauses.
        
        REQUIRED MODIFICATIONS:
        1. **Date Updates**: 
           - Change the execution date to Today (${today}).
           - Change the Agreement/Start Date to ${newStartDate}.
           - Change the Expiry Date to ${newExpiryDate}.
        2. **Financials**: 
           - If a specific Rent amount or Fee is mentioned numerically, calculate a 5% increase and replace the old amount with the new amount.
        3. **Signatures**: 
           - Keep the signatory sections but replace the signatures with "[Pending E-Signature]".
        
        Output the full, professional legal text in Markdown. 
        CRITICAL: Use DOUBLE NEWLINES (\n\n) between all paragraphs and clauses to ensure proper rendering.
      `;
    } else {
      // Fallback Mode: Generate from scratch
      prompt = `
        Act as a senior legal consultant.
        Draft a full legal "Renewal Agreement" based on these details:
        Type: ${agreement.type}
        Parties: ${agreement.partyA} and ${agreement.partyB}
        Location: ${agreement.location}
        
        Instructions:
        1. Create a professional renewal agreement with standard clauses (Appointment, Term, Payment, Termination, Jurisdiction).
        2. Set Start Date: ${newStartDate}.
        3. Set End Date: ${newExpiryDate}.
        4. Include a 5% rent/fee escalation clause.
        5. Maintain the "Cross Regional Sales" penalty clause if it is a Distributor Agreement.
        6. Output full text in Markdown.
      `;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Failed to generate draft.";
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};


// --- MOCK DATA FOR DEMO IF NO KEY ---
const mockExtraction = async (): Promise<ExtractionResult> => {
  await new Promise(r => setTimeout(r, 2000));
  return {
    type: "Distributor Agreement",
    partyA: "SKYNET ELECTRONIC PVT LTD",
    partyB: "KONNECT COMMUNICATION",
    startDate: "2025-08-25",
    renewalDate: "2026-07-25",
    expiryDate: "2026-08-24",
    location: "Hubli, Karnataka",
    summary: "Distributor agreement for OPPO brand mobile phones and accessories in the Bijapur Region.",
    fullText: `DISTRIBUTOR AGREEMENT

This Agreement is made on this 25th day of August, 2024 at Hubli.

BETWEEN

SKYNET ELECTRONIC PVT LTD, having its registered office at Hubli (hereinafter referred to as the "Company")
AND
KONNECT COMMUNICATION, having its office at Bijapur (hereinafter referred to as the "Distributor")

1. APPOINTMENT
The Company hereby appoints the Distributor for the sale of OPPO Mobile Phones in the territory of Bijapur.

2. TERM
This agreement shall be valid for a period of 11 months, expiring on 24th August 2025.

3. PRICING
The Distributor shall purchase products at the Dealer Price defined by the Company.

4. PENALTY
4.7 Cross Regional Sales: The Distributor is strictly prohibited from selling goods outside the designated Bijapur territory. Any violation will attract a penalty of INR 50,000 per instance.

IN WITNESS WHEREOF the parties have signed this agreement.`
  };
};

const mockRenewalDraft = (agreement: Agreement) => {
  const newStart = new Date().toISOString().split('T')[0];

  // High fidelity mock replacement
  if (agreement.rawContent) {
    let content = agreement.rawContent;
    content = content.replace(/2016/g, "2024").replace(/2024/g, "2025").replace(/2025/g, "2026");
    content = content.replace(/11 months/g, "12 months");
    content = content.replace(/Rs. 25,000/g, "Rs. 26,250 (Incl 5% Escalation)");
    return content;
  }

  return `RENEWAL AGREEMENT

THIS RENEWAL AGREEMENT is made on ${newStart}.

BETWEEN

${agreement.partyA} ("Company/Lessor")

AND

${agreement.partyB} ("Distributor/Lessee")

1. BACKGROUND
The Parties entered into an agreement dated ${agreement.startDate} ("Original Agreement"). The Parties now wish to renew said agreement.

2. EXTENSION OF TERM
The term of the Original Agreement is hereby extended for a period of 12 months, commencing from ${agreement.expiryDate}.

3. COMMERCIAL TERMS
(a) The commercial terms including Rent/Margin shall be increased by 5% over the last paid amount.
(b) All other financial covenants remain valid.

4. GOVERNING LAW
This Renewal shall be governed by the laws of India and subject to the jurisdiction of courts in ${agreement.location}.

IN WITNESS WHEREOF, the parties have executed this Renewal Agreement.

For ${agreement.partyA}
[Pending E-Signature]

For ${agreement.partyB}
[Pending Signature]`;
};
