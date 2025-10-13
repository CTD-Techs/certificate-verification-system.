import { z } from 'zod';
import { CertificateType, IssuerType } from '../models';
import {
  aadhaarNumberSchema,
  panNumberSchema,
  dobSchema,
  genderSchema,
  panCategorySchema,
  addressSchema,
} from './identity.validator';

/**
 * Base certificate fields (common to all certificate types)
 */
const baseCertificateSchema = z.object({
  certificateType: z.nativeEnum(CertificateType),
  issuerType: z.nativeEnum(IssuerType),
  issuerName: z.string().min(1).max(200),
  qrCode: z.string().optional(),
  digitalSignature: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Educational certificate fields
 */
const educationalCertificateSchema = baseCertificateSchema.extend({
  certificateType: z.enum([
    CertificateType.SCHOOL_CERTIFICATE,
    CertificateType.DEGREE,
    CertificateType.DIPLOMA,
    CertificateType.MARKSHEET,
    CertificateType.OTHER,
  ]),
  studentName: z.string().min(1).max(200),
  rollNumber: z.string().min(1).max(50),
  examYear: z.string().regex(/^\d{4}$/, 'Invalid year format'),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  school: z.object({
    name: z.string().min(1).max(200),
    code: z.string().min(1).max(50),
  }).optional(),
  subjects: z.array(
    z.object({
      name: z.string().min(1).max(100),
      marks: z.number().min(0).max(100),
      maxMarks: z.number().min(0).max(100),
      grade: z.string().max(10).optional(),
    })
  ).optional(),
  // Optional identity verification data for educational certificates
  aadhaar: z.object({
    aadhaarNumber: aadhaarNumberSchema,
    name: z.string().min(1).max(200),
    dob: dobSchema,
    gender: genderSchema.optional(),
    address: addressSchema.optional(),
  }).optional(),
  pan: z.object({
    panNumber: panNumberSchema,
    name: z.string().min(1).max(200),
    dob: dobSchema,
    category: panCategorySchema.optional(),
  }).optional(),
});

/**
 * Aadhaar card certificate fields
 */
const aadhaarCardSchema = baseCertificateSchema.extend({
  certificateType: z.literal(CertificateType.AADHAAR_CARD),
  issuerType: z.literal(IssuerType.UIDAI),
  issuerName: z.literal('Unique Identification Authority of India'),
  aadhaar: z.object({
    aadhaarNumber: aadhaarNumberSchema,
    name: z.string().min(1).max(200),
    dob: dobSchema,
    gender: genderSchema,
    address: addressSchema,
  }),
});

/**
 * PAN card certificate fields
 */
const panCardSchema = baseCertificateSchema.extend({
  certificateType: z.literal(CertificateType.PAN_CARD),
  issuerType: z.literal(IssuerType.INCOME_TAX),
  issuerName: z.literal('Income Tax Department'),
  pan: z.object({
    panNumber: panNumberSchema,
    name: z.string().min(1).max(200),
    dob: dobSchema,
    category: panCategorySchema.optional(),
  }),
});

/**
 * Upload certificate validation schema (discriminated union)
 */
export const uploadCertificateSchema = z.object({
  body: z.discriminatedUnion('certificateType', [
    educationalCertificateSchema,
    aadhaarCardSchema,
    panCardSchema,
  ]),
});

/**
 * Get certificate by ID validation schema
 */
export const getCertificateSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid certificate ID'),
  }),
});

/**
 * List certificates validation schema
 */
export const listCertificatesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    certificateType: z.nativeEnum(CertificateType).optional(),
    issuerType: z.nativeEnum(IssuerType).optional(),
    status: z.string().optional(),
    search: z.string().optional(),
  }),
});

/**
 * Delete certificate validation schema
 */
export const deleteCertificateSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid certificate ID'),
  }),
});

export type UploadCertificateInput = z.infer<typeof uploadCertificateSchema>['body'];
export type GetCertificateInput = z.infer<typeof getCertificateSchema>['params'];
export type ListCertificatesInput = z.infer<typeof listCertificatesSchema>['query'];
export type DeleteCertificateInput = z.infer<typeof deleteCertificateSchema>['params'];