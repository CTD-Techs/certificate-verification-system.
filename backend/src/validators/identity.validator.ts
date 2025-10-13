import { z } from 'zod';

/**
 * Aadhaar number validation
 * - Must be exactly 12 digits
 * - Must pass Verhoeff algorithm checksum
 */
const aadhaarNumberSchema = z
  .string()
  .regex(/^\d{12}$/, 'Aadhaar number must be exactly 12 digits')
  .refine(
    (value) => {
      // Basic format check - actual Verhoeff validation is done in the service
      return /^\d{12}$/.test(value);
    },
    { message: 'Invalid Aadhaar number format' }
  );

/**
 * PAN number validation
 * Format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
 * - First 3 characters: Alphabetic series (AAA to ZZZ)
 * - 4th character: Type of holder (P/C/H/F/A/T/G/L/J/B)
 * - 5th character: First letter of name/surname
 * - Next 4 characters: Sequential number (0001 to 9999)
 * - Last character: Alphabetic check digit
 */
const panNumberSchema = z
  .string()
  .length(10, 'PAN must be exactly 10 characters')
  .regex(
    /^[A-Z]{5}[0-9]{4}[A-Z]$/,
    'Invalid PAN format. Expected: 5 letters + 4 digits + 1 letter'
  )
  .refine(
    (value) => {
      // Validate 4th character (holder type)
      const holderType = value.charAt(3);
      const validTypes = ['P', 'C', 'H', 'F', 'A', 'T', 'G', 'L', 'J', 'B'];
      return validTypes.includes(holderType);
    },
    { message: 'Invalid PAN holder type (4th character)' }
  );

/**
 * Date of birth validation (YYYY-MM-DD format)
 */
const dobSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
  .refine(
    (value) => {
      const date = new Date(value);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      return age >= 0 && age <= 150; // Reasonable age range
    },
    { message: 'Invalid date of birth' }
  );

/**
 * Gender validation
 */
const genderSchema = z.enum(['M', 'F', 'O'], {
  errorMap: () => ({ message: 'Gender must be M (Male), F (Female), or O (Other)' }),
});

/**
 * PAN category validation
 */
const panCategorySchema = z.enum(
  ['Individual', 'Company', 'HUF', 'Firm', 'AOP', 'Trust', 'Government'],
  {
    errorMap: () => ({ message: 'Invalid PAN category' }),
  }
);

/**
 * Address validation schema
 */
const addressSchema = z.object({
  line1: z.string().min(1).max(200).optional(),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional(),
});

/**
 * Aadhaar verification request validation schema
 */
export const verifyAadhaarSchema = z.object({
  body: z.object({
    aadhaarNumber: aadhaarNumberSchema,
    name: z.string().min(1).max(200),
    dob: dobSchema,
    gender: genderSchema.optional(),
    address: addressSchema.optional(),
  }),
});

/**
 * PAN verification request validation schema
 */
export const verifyPANSchema = z.object({
  body: z.object({
    panNumber: panNumberSchema,
    name: z.string().min(1).max(200),
    dob: dobSchema,
    category: panCategorySchema.optional(),
  }),
});

/**
 * PAN-Aadhaar linkage check validation schema
 */
export const checkPANAadhaarLinkageSchema = z.object({
  body: z.object({
    panNumber: panNumberSchema,
    aadhaarNumber: aadhaarNumberSchema,
  }),
});

/**
 * Upload Aadhaar card validation schema
 */
export const uploadAadhaarCardSchema = z.object({
  body: z.object({
    certificateType: z.literal('AADHAAR_CARD'),
    issuerType: z.literal('UIDAI'),
    issuerName: z.literal('Unique Identification Authority of India'),
    aadhaar: z.object({
      aadhaarNumber: aadhaarNumberSchema,
      name: z.string().min(1).max(200),
      dob: dobSchema,
      gender: genderSchema,
      address: addressSchema,
    }),
    qrCode: z.string().optional(),
    digitalSignature: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

/**
 * Upload PAN card validation schema
 */
export const uploadPANCardSchema = z.object({
  body: z.object({
    certificateType: z.literal('PAN_CARD'),
    issuerType: z.literal('INCOME_TAX'),
    issuerName: z.literal('Income Tax Department'),
    pan: z.object({
      panNumber: panNumberSchema,
      name: z.string().min(1).max(200),
      dob: dobSchema,
      category: panCategorySchema.optional(),
    }),
    qrCode: z.string().optional(),
    digitalSignature: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

/**
 * Aadhaar number format validation (standalone)
 */
export const validateAadhaarFormatSchema = z.object({
  body: z.object({
    aadhaarNumber: aadhaarNumberSchema,
  }),
});

/**
 * PAN number format validation (standalone)
 */
export const validatePANFormatSchema = z.object({
  body: z.object({
    panNumber: panNumberSchema,
  }),
});

// Export types
export type VerifyAadhaarInput = z.infer<typeof verifyAadhaarSchema>['body'];
export type VerifyPANInput = z.infer<typeof verifyPANSchema>['body'];
export type CheckPANAadhaarLinkageInput = z.infer<typeof checkPANAadhaarLinkageSchema>['body'];
export type UploadAadhaarCardInput = z.infer<typeof uploadAadhaarCardSchema>['body'];
export type UploadPANCardInput = z.infer<typeof uploadPANCardSchema>['body'];
export type ValidateAadhaarFormatInput = z.infer<typeof validateAadhaarFormatSchema>['body'];
export type ValidatePANFormatInput = z.infer<typeof validatePANFormatSchema>['body'];

// Export individual schemas for reuse
export {
  aadhaarNumberSchema,
  panNumberSchema,
  dobSchema,
  genderSchema,
  panCategorySchema,
  addressSchema,
};