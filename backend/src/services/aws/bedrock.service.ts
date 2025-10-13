import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import logger from '../../utils/logger';

/**
 * AWS Bedrock Service for AI-powered field extraction
 * Uses Claude 3.5 Sonnet for intelligent document field extraction
 */
export class BedrockService {
  private bedrockClient: BedrockRuntimeClient;
  private region: string;
  private modelId: string;
  private mockMode: boolean;
  private enabled: boolean;

  constructor() {
    this.region = process.env.AWS_REGION || 'ap-south-1';
    this.modelId = process.env.AWS_BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
    this.mockMode = process.env.AWS_BEDROCK_MOCK_MODE === 'true';
    this.enabled = process.env.AWS_BEDROCK_ENABLED === 'true';

    // Initialize Bedrock client
    this.bedrockClient = new BedrockRuntimeClient({
      region: this.region,
      credentials: this.mockMode
        ? undefined
        : {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
    });

    logger.info('BedrockService initialized', {
      region: this.region,
      modelId: this.modelId,
      mockMode: this.mockMode,
      enabled: this.enabled,
    });
  }

  /**
   * Extract Aadhaar card fields from OCR text
   * @param ocrText - Raw OCR text from Textract
   * @returns Extracted Aadhaar fields
   */
  async extractAadhaarFields(ocrText: string): Promise<AadhaarFields> {
    try {
      if (this.mockMode || !this.enabled) {
        return this.mockExtractAadhaarFields();
      }

      const prompt = this.buildAadhaarPrompt(ocrText);
      const response = await this.invokeModel(prompt);

      const fields = this.parseAadhaarResponse(response);

      logger.info('Aadhaar fields extracted (first attempt)', { fields });

      // Check if critical fields are missing and retry with more explicit prompt
      if (!fields.name || !fields.address) {
        logger.warn('Critical fields missing, retrying with enhanced prompt', {
          missingName: !fields.name,
          missingAddress: !fields.address,
        });

        const retryPrompt = this.buildAadhaarRetryPrompt(ocrText, fields);
        const retryResponse = await this.invokeModel(retryPrompt);
        const retryFields = this.parseAadhaarResponse(retryResponse);

        logger.info('Aadhaar fields extracted (retry attempt)', { retryFields });

        // Merge results, preferring retry fields if they have more data
        return {
          name: retryFields.name || fields.name,
          dateOfBirth: retryFields.dateOfBirth || fields.dateOfBirth,
          aadhaarNumber: retryFields.aadhaarNumber || fields.aadhaarNumber,
          gender: retryFields.gender || fields.gender,
          address: retryFields.address || fields.address,
          fatherName: retryFields.fatherName || fields.fatherName,
          mobileNumber: retryFields.mobileNumber || fields.mobileNumber,
          confidence: Math.max(retryFields.confidence, fields.confidence),
        };
      }

      return fields;
    } catch (error) {
      logger.error('Error extracting Aadhaar fields', { error });
      throw new Error(
        `Failed to extract Aadhaar fields: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Extract PAN card fields from OCR text
   * @param ocrText - Raw OCR text from Textract
   * @returns Extracted PAN fields
   */
  async extractPANFields(ocrText: string): Promise<PANFields> {
    try {
      if (this.mockMode || !this.enabled) {
        return this.mockExtractPANFields();
      }

      const prompt = this.buildPANPrompt(ocrText);
      const response = await this.invokeModel(prompt);

      const fields = this.parsePANResponse(response);

      logger.info('PAN fields extracted', { fields });

      return fields;
    } catch (error) {
      logger.error('Error extracting PAN fields', { error });
      throw new Error(
        `Failed to extract PAN fields: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Invoke Claude model via Bedrock
   * @param prompt - Prompt for the model
   * @returns Model response text
   */
  private async invokeModel(prompt: string): Promise<string> {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2000,
      temperature: 0.0, // Changed from 0.1 to 0.0 for maximum consistency
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await this.bedrockClient.send(command);

    if (!response.body) {
      throw new Error('No response body from Bedrock');
    }

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    if (!responseBody.content || !responseBody.content[0] || !responseBody.content[0].text) {
      throw new Error('Invalid response format from Bedrock');
    }

    return responseBody.content[0].text;
  }

  /**
   * Build prompt for Aadhaar field extraction
   */
  private buildAadhaarPrompt(ocrText: string): string {
    // Log the OCR text for debugging
    logger.info('[BEDROCK] Raw OCR text for Aadhaar extraction', {
      textLength: ocrText.length,
      lineCount: ocrText.split('\n').length,
      preview: ocrText.substring(0, 200),
    });
    console.log('[BEDROCK] Full OCR text:', ocrText);

    return `You are an expert at extracting information from Indian Aadhaar cards.

CRITICAL INSTRUCTIONS:
1. Extract ALL available information from the OCR text below
2. Do NOT skip any fields - if a field exists in the text, extract it
3. Names are usually in CAPITAL LETTERS
4. Aadhaar numbers may have spaces (XXXX XXXX XXXX format)
5. Addresses may span multiple lines - combine them into a complete address
6. Look for keywords like "Name:", "DOB:", "Gender:", "Address:", "S/O:", "D/O:", "C/O:"
7. Father's name often appears after "S/O" (Son Of), "D/O" (Daughter Of), or "C/O" (Care Of)

REQUIRED FIELDS TO EXTRACT:
- name: Full name of the person (usually in capital letters, look for the main name on the card)
- dateOfBirth: Date of birth in DD/MM/YYYY or DD-MM-YYYY format
- aadhaarNumber: 12-digit number (may have spaces like "1234 5678 9012")
- gender: Male, Female, or Transgender
- address: Complete residential address including house number, street, locality, city, state, and pincode
- fatherName: Father's name (look for "S/O:", "D/O:", "C/O:" prefixes)
- mobileNumber: Mobile number if present (10 digits)

OCR TEXT FROM AADHAAR CARD:
${ocrText}

RESPONSE FORMAT:
Return ONLY a valid JSON object (no markdown code blocks, no explanations, no extra text):
{
  "name": "FULL NAME IN CAPITALS or null",
  "dateOfBirth": "DD/MM/YYYY or null",
  "aadhaarNumber": "12-digit number with or without spaces or null",
  "gender": "Male/Female/Transgender or null",
  "address": "Complete address with house, street, locality, city, state, pincode or null",
  "fatherName": "Father's name or null",
  "mobileNumber": "10-digit mobile number or null",
  "confidence": 0.95
}

IMPORTANT:
- Set confidence to 0.95 if you found name, DOB, Aadhaar number, and address
- Set confidence to 0.80 if you found name, DOB, and Aadhaar number but missing address
- Set confidence to 0.60 if you found only partial information
- If a field is not found in the OCR text, set it to null
- Do NOT make up information - only extract what is clearly visible in the OCR text`;
  }

  /**
   * Build prompt for PAN field extraction
   */
  private buildPANPrompt(ocrText: string): string {
    return `You are an expert at extracting structured information from Indian PAN cards.

Given the following OCR text from a PAN card, extract the following fields:
- Full Name (as it appears on the card)
- Father's Name (as it appears on the card)
- Date of Birth (in DD/MM/YYYY format)
- PAN Number (10-character alphanumeric)

OCR Text:
${ocrText}

Return ONLY a valid JSON object with the following structure (no markdown, no explanation):
{
  "name": "extracted name or null",
  "fatherName": "father's name or null",
  "dateOfBirth": "DD/MM/YYYY or null",
  "panNumber": "10-character PAN or null",
  "confidence": 0.0 to 1.0
}

If a field cannot be extracted with confidence, set it to null. The confidence score should reflect overall extraction quality.`;
  }

  /**
   * Build retry prompt for Aadhaar field extraction when initial attempt is incomplete
   */
  private buildAadhaarRetryPrompt(ocrText: string, previousFields: AadhaarFields): string {
    const missingFields: string[] = [];
    if (!previousFields.name) missingFields.push('NAME');
    if (!previousFields.address) missingFields.push('ADDRESS');

    logger.info('[BEDROCK] Building retry prompt for missing fields', { missingFields });

    return `You are an expert at extracting information from Indian Aadhaar cards.

CRITICAL: The previous extraction attempt missed these fields: ${missingFields.join(', ')}

Please carefully re-examine the OCR text and extract ALL information, paying special attention to:
${!previousFields.name ? '- The FULL NAME (usually in CAPITAL LETTERS, the largest text on the card)\n' : ''}
${!previousFields.address ? '- The COMPLETE ADDRESS (may span multiple lines, includes house number, street, locality, city, state, pincode)\n' : ''}

EXTRACTION TIPS:
1. The name is usually the most prominent text in capital letters
2. Address often starts with house/flat number and includes multiple lines
3. Look for text patterns like "123, Main Street" or "Flat 4B, Building Name"
4. State names like "Maharashtra", "Karnataka", "Delhi" indicate address
5. 6-digit numbers (like 400001, 560001) are pincodes
6. Combine all address-related text into one complete address string

OCR TEXT FROM AADHAAR CARD:
${ocrText}

Return ONLY valid JSON (no markdown, no explanations):
{
  "name": "FULL NAME or null",
  "dateOfBirth": "DD/MM/YYYY or null",
  "aadhaarNumber": "12-digit number or null",
  "gender": "Male/Female/Transgender or null",
  "address": "Complete address string or null",
  "fatherName": "Father's name or null",
  "mobileNumber": "Mobile number or null",
  "confidence": 0.90
}`;
  }

  /**
   * Parse Aadhaar extraction response
   */
  private parseAadhaarResponse(response: string): AadhaarFields {
    try {
      // Remove markdown code blocks if present
      const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanResponse);

      return {
        name: parsed.name || null,
        dateOfBirth: parsed.dateOfBirth || null,
        aadhaarNumber: parsed.aadhaarNumber || null,
        gender: parsed.gender || null,
        address: parsed.address || null,
        fatherName: parsed.fatherName || null,
        mobileNumber: parsed.mobileNumber || null,
        confidence: parsed.confidence || 0,
      };
    } catch (error) {
      logger.error('Error parsing Aadhaar response', { error, response });
      throw new Error('Failed to parse Aadhaar extraction response');
    }
  }

  /**
   * Parse PAN extraction response
   */
  private parsePANResponse(response: string): PANFields {
    try {
      // Remove markdown code blocks if present
      const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanResponse);

      return {
        name: parsed.name || null,
        fatherName: parsed.fatherName || null,
        dateOfBirth: parsed.dateOfBirth || null,
        panNumber: parsed.panNumber || null,
        confidence: parsed.confidence || 0,
      };
    } catch (error) {
      logger.error('Error parsing PAN response', { error, response });
      throw new Error('Failed to parse PAN extraction response');
    }
  }

  /**
   * Mock Aadhaar field extraction for local testing
   */
  private mockExtractAadhaarFields(): AadhaarFields {
    logger.info('Mock: Extracting Aadhaar fields');

    return {
      name: 'RAJESH KUMAR SHARMA',
      dateOfBirth: '15/08/1990',
      aadhaarNumber: '123456789012',
      gender: 'Male',
      address: '123 Main Street, Mumbai, Maharashtra - 400001',
      fatherName: 'RAMESH SHARMA',
      mobileNumber: '9876543210',
      confidence: 0.95,
    };
  }

  /**
   * Mock PAN field extraction for local testing
   */
  private mockExtractPANFields(): PANFields {
    logger.info('Mock: Extracting PAN fields');

    return {
      name: 'RAJESH KUMAR SHARMA',
      fatherName: 'RAMESH SHARMA',
      dateOfBirth: '15/08/1990',
      panNumber: 'ABCDE1234F',
      confidence: 0.96,
    };
  }
}

// Types

export interface AadhaarFields {
  name: string | null;
  dateOfBirth: string | null;
  aadhaarNumber: string | null;
  gender: string | null;
  address: string | null;
  fatherName: string | null;
  mobileNumber: string | null;
  confidence: number;
}

export interface PANFields {
  name: string | null;
  fatherName: string | null;
  dateOfBirth: string | null;
  panNumber: string | null;
  confidence: number;
}

// Export singleton instance
export const bedrockService = new BedrockService();