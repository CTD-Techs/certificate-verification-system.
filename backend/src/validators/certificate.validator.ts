import { z } from 'zod';
import { CertificateType, IssuerType } from '../models';

/**
 * Upload certificate validation schema
 */
export const uploadCertificateSchema = z.object({
  body: z.object({
    certificateType: z.nativeEnum(CertificateType),
    issuerType: z.nativeEnum(IssuerType),
    studentName: z.string().min(1).max(200),
    rollNumber: z.string().min(1).max(50),
    examYear: z.string().regex(/^\d{4}$/, 'Invalid year format'),
    issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    issuerName: z.string().min(1).max(200),
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
    qrCode: z.string().optional(),
    digitalSignature: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
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