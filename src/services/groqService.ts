/**
 * Groq AI Service for Legal Metrology Declaration Structuring
 * Leverages high-performance LLMs on Groq (openai/gpt-oss-120b, qwen3.8-27b, llama-3.3)
 * to transform messy OCR output into structured, verified Legal Metrology declarations.
 */
import Constants from 'expo-constants';

export interface GroqStructuredDeclaration {
  productName: string;
  category: string;
  mrp: string | null;
  netQuantity: string | null;
  unitSalePrice: string | null;
  dateOfManufacture: string | null;
  bestBefore: string | null;
  fssaiLicense: string | null;
  batchNo: string | null;
  manufacturer: string | null;
  address: string | null;
  consumerCare: string | null;
  countryOfOrigin: string | null;
  observations: string[];
}

// Model fallback cascade: tries 120B first, then 20B, then Qwen, then LLaMA
const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

export function getGroqApiKey(): string | null {
  const envKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (envKey && envKey.trim().length > 0 && !envKey.includes('your_groq_api_key')) {
    return envKey.trim();
  }

  const extraKey = Constants.expoConfig?.extra?.groqApiKey;
  if (extraKey && typeof extraKey === 'string' && extraKey.trim().length > 0) {
    return extraKey.trim();
  }

  return null;
}

export function isGroqConfigured(): boolean {
  return Boolean(getGroqApiKey());
}

export async function structureWithGroq(
  ocrLines: string[]
): Promise<GroqStructuredDeclaration | null> {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    console.log('[Groq] No API key found');
    return null;
  }

  const fullText = ocrLines.join('\n');
  if (fullText.trim().length < 5) {
    return null;
  }

  const systemPrompt = `You are an official Legal Metrology & statutory compliance inspector for packaged commodities in India.
Your task is to take messy, clumsy optical character recognition (OCR) text extracted across multiple packaging angles/panels (such as Front Brand Display, Back Statutory Declarations, Bottom/Rim MRP stamp, or Side Panels) and synthesize them into a clean, unified, fully-formatted Legal Metrology dossier.

Key Rules for Multi-Angle Packaging Synthesis:
1. Reconcile declarations distributed across different panels:
   - Front Display: Brand/Product Title, Net Quantity.
   - Back Panel: Manufacturer name, complete address with PIN code, customer helpline & email, FSSAI license (14 digits).
   - Bottom / Rim / Crimp: Stamped MRP, Batch No, Date of Manufacture (MFD/PKD), Expiry / Best Before.
2. CRITICAL EXPERTISE FOR DOT-MATRIX & INKJET PRINTED TEXT:
   Inkjet/dot-matrix stamps for MRP, MFD, EXP, Batch, and FSSAI often have broken or dotted strokes that OCR confuses:
   - 'A' vs '4' (e.g., 'MRP Rs. AS.00' is 'Rs. 45.00'; 'B4TCH' is 'BATCH')
   - 'B' vs '8' (e.g., '0B/26' is '08/26'; 'Rs. BO' is 'Rs. 80.00'; 'BATCH B142' vs '8142')
   - 'S' vs '5' (e.g., 'S00g' is '500 g'; 'Rs. 3S' is 'Rs. 35.00'; '1S/08' is '15/08')
   - '0' vs 'O' / 'D' (e.g., 'Rs. 1OO' is 'Rs. 100.00'; 'OS/26' is '05/26')
   - '1' vs 'I' / 'L' / '|' (e.g., FSSAI 14-digit numbers or numeric dates)
   Intelligently disambiguate using statutory context: MRP and USP are strictly numbers; Net Quantities have standard units (g, ml, kg, L); dates are valid calendar months/years; FSSAI is strictly a 14-digit integer.
3. Clean optical noise, typos, and OCR glitches (e.g. FSSA1 -> FSSAI, B.No -> Batch No, Rs./₹ formatting).
4. If a declaration appears on multiple panels, prioritize the most complete and legible value.

Respond ONLY with a valid JSON object with the following structure:
{
  "productName": "Clean Title of Product or Brand",
  "category": "Food & Beverages" or "Personal Care" or "Household" or "Packaged Commodity",
  "mrp": "Maximum retail price with currency e.g. 'Rs. 45.00' or null",
  "netQuantity": "Net quantity with metric unit e.g. '500 g', '1 L', '100 ml' or null",
  "unitSalePrice": "Unit sale price e.g. 'Rs. 0.09 / g' or null",
  "dateOfManufacture": "Month/Year or Date of manufacture/packing or null",
  "bestBefore": "Expiry or Best before duration/date or null",
  "fssaiLicense": "14-digit statutory FSSAI license number or null",
  "batchNo": "Batch, Lot or code or null",
  "manufacturer": "Name of Manufacturer / Packer / Importer or null",
  "address": "Postal address including 6-digit PIN code or null",
  "consumerCare": "Customer helpline number and/or email or null",
  "countryOfOrigin": "Country of origin e.g. 'India' or null",
  "observations": ["Brief bullet points of statutory findings, warnings, or missing mandatory clauses (e.g. missing MRP, non-standard unit of measure, missing customer helpline)"]
}`;

  for (const model of GROQ_MODELS) {
    try {
      console.log(`[Groq] Structuring OCR text with model: ${model}...`);
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: `Extracted Packaging Label OCR Text:\n\n${fullText}`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[Groq] Model ${model} returned error status ${response.status}:`, errText);
        continue; // Try next model in cascade
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) continue;

      const parsed = JSON.parse(content);
      console.log(`[Groq] Successfully structured declarations with ${model}! Product:`, parsed.productName);

      // Handle observations whether returned as string or array
      let obsList: string[] = [];
      if (Array.isArray(parsed.observations)) {
        obsList = parsed.observations.filter((o: any) => typeof o === 'string' && o.trim().length > 0);
      } else if (typeof parsed.observations === 'string' && parsed.observations.trim().length > 0) {
        obsList = [parsed.observations.trim()];
      }

      // Format MRP cleanly (e.g. 30 -> Rs. 30.00 or Rs. 30)
      let formattedMrp: string | null = null;
      if (parsed.mrp !== null && parsed.mrp !== undefined && String(parsed.mrp).trim().length > 0) {
        const raw = String(parsed.mrp).trim();
        formattedMrp = /^(?:rs\.?|₹)/i.test(raw) ? raw : `Rs. ${raw}`;
      }

      // Format USP cleanly
      let formattedUsp: string | null = null;
      if (parsed.unitSalePrice !== null && parsed.unitSalePrice !== undefined && String(parsed.unitSalePrice).trim().length > 0) {
        const raw = String(parsed.unitSalePrice).trim();
        formattedUsp = /^(?:rs\.?|₹)/i.test(raw) ? raw : `Rs. ${raw}`;
      }

      return {
        productName: parsed.productName || 'Scanned Product',
        category: parsed.category || 'Packaged Commodity',
        mrp: formattedMrp,
        netQuantity: parsed.netQuantity ? String(parsed.netQuantity).trim() : null,
        unitSalePrice: formattedUsp,
        dateOfManufacture: parsed.dateOfManufacture ? String(parsed.dateOfManufacture).trim() : null,
        bestBefore: parsed.bestBefore ? String(parsed.bestBefore).trim() : null,
        fssaiLicense: parsed.fssaiLicense ? String(parsed.fssaiLicense).trim() : null,
        batchNo: parsed.batchNo ? String(parsed.batchNo).trim() : null,
        manufacturer: parsed.manufacturer ? String(parsed.manufacturer).trim() : null,
        address: parsed.address ? String(parsed.address).trim() : null,
        consumerCare: parsed.consumerCare ? String(parsed.consumerCare).trim() : null,
        countryOfOrigin: parsed.countryOfOrigin ? String(parsed.countryOfOrigin).trim() : 'India',
        observations: obsList,
      };
    } catch (err) {
      console.warn(`[Groq] Attempt with model ${model} threw error:`, err);
    }
  }

  return null;
}
