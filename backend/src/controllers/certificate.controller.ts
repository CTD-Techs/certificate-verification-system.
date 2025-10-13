import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Certificate, CertificateStatus } from '../models';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response';
import { NotFoundError } from '../utils/error';
import logger from '../utils/logger';

const certificateRepository = AppDataSource.getRepository(Certificate);

/**
 * Upload a new certificate
 */
export const uploadCertificate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.sub;
    const certificateData = req.body;

    // Auto-generate certificate number if not provided
    let certificateNumber = certificateData.certificateNumber;
    
    if (!certificateNumber) {
      // Try to use registrationNumber from metadata as fallback
      if (certificateData.metadata?.registrationNumber) {
        certificateNumber = certificateData.metadata.registrationNumber;
      } else {
        // Generate certificate number from: ISSUER/YEAR/TYPE/RANDOM
        const issuer = (certificateData.issuerType || 'CERT').substring(0, 4).toUpperCase();
        const year = certificateData.examYear || new Date().getFullYear();
        const type = certificateData.certificateType?.split('_')[0] || 'GEN';
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        certificateNumber = `${issuer}/${year}/${type}/${random}`;
      }
    }

    // Create certificate
    const certificate = certificateRepository.create({
      userId,
      certificateNumber,
      certificateType: certificateData.certificateType,
      issuerType: certificateData.issuerType,
      issuerName: certificateData.issuerName,
      certificateData: {
        studentName: certificateData.studentName,
        rollNumber: certificateData.rollNumber,
        examYear: certificateData.examYear,
        issueDate: certificateData.issueDate,
        school: certificateData.school,
        subjects: certificateData.subjects,
        qrCode: certificateData.qrCode,
        digitalSignature: certificateData.digitalSignature,
        ...certificateData.metadata,
      },
      hasQrCode: !!certificateData.qrCode,
      hasDigitalSignature: !!certificateData.digitalSignature,
      issueDate: certificateData.issueDate ? new Date(certificateData.issueDate) : undefined,
      status: CertificateStatus.PENDING,
    });

    await certificateRepository.save(certificate);

    logger.info('Certificate uploaded', {
      certificateId: certificate.id,
      certificateNumber: certificate.certificateNumber,
      userId,
      type: certificate.certificateType,
    });

    sendSuccess(res, certificate, 'Certificate uploaded successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get certificate by ID
 */
export const getCertificate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.sub;

    const certificate = await certificateRepository.findOne({
      where: { id, userId },
      relations: ['verifications', 'manualReviews'],
    });

    if (!certificate) {
      throw new NotFoundError('Certificate not found');
    }

    sendSuccess(res, certificate, 'Certificate retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * List certificates for current user
 */
export const listCertificates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.sub;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // DEBUG: Log the userId being used for filtering
    logger.info('DEBUG: listCertificates called', {
      userId,
      userEmail: req.user!.email,
      userRole: req.user!.role
    });

    // DEBUG: Check all certificates in database
    const allCerts = await certificateRepository.find({ select: ['id', 'userId', 'certificateNumber'] });
    logger.info('DEBUG: All certificates in database', {
      totalCerts: allCerts.length,
      certificates: allCerts.map(c => ({ id: c.id, userId: c.userId, certNum: c.certificateNumber }))
    });

    const queryBuilder = certificateRepository
      .createQueryBuilder('certificate')
      .where('certificate.userId = :userId', { userId })
      .leftJoinAndSelect('certificate.verifications', 'verifications');

    // Apply filters
    if (req.query.certificateType) {
      queryBuilder.andWhere('certificate.certificateType = :type', {
        type: req.query.certificateType,
      });
    }

    if (req.query.issuerType) {
      queryBuilder.andWhere('certificate.issuerType = :issuerType', {
        issuerType: req.query.issuerType,
      });
    }

    if (req.query.status) {
      queryBuilder.andWhere('certificate.status = :status', {
        status: req.query.status,
      });
    }

    if (req.query.search) {
      queryBuilder.andWhere(
        '(certificate.issuerName ILIKE :search OR certificate.certificateData::text ILIKE :search)',
        { search: `%${req.query.search}%` }
      );
    }

    // Order by creation date
    queryBuilder.orderBy('certificate.createdAt', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const certificates = await queryBuilder.skip(skip).take(limit).getMany();

    // DEBUG: Log what we found
    logger.info('DEBUG: listCertificates results', {
      userId,
      total,
      returnedCount: certificates.length,
      certificateIds: certificates.map(c => c.id)
    });

    sendPaginatedSuccess(
      res,
      certificates,
      { page, limit, total },
      'Certificates retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update certificate
 */
export const updateCertificate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.sub;

    const certificate = await certificateRepository.findOne({
      where: { id, userId },
    });

    if (!certificate) {
      throw new NotFoundError('Certificate not found');
    }

    // Update certificate data
    if (req.body.certificateData) {
      certificate.certificateData = {
        ...certificate.certificateData,
        ...req.body.certificateData,
      };
    }

    await certificateRepository.save(certificate);

    logger.info('Certificate updated', { certificateId: id, userId });

    sendSuccess(res, certificate, 'Certificate updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete certificate
 */
export const deleteCertificate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.sub;

    const certificate = await certificateRepository.findOne({
      where: { id, userId },
    });

    if (!certificate) {
      throw new NotFoundError('Certificate not found');
    }

    await certificateRepository.remove(certificate);

    logger.info('Certificate deleted', { certificateId: id, userId });

    sendSuccess(res, null, 'Certificate deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get certificate statistics
 */
export const getCertificateStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.sub;

    const total = await certificateRepository.count({ where: { userId } });
    const verified = await certificateRepository.count({
      where: { userId, status: CertificateStatus.VERIFIED },
    });
    const pending = await certificateRepository.count({
      where: { userId, status: CertificateStatus.PENDING },
    });
    const unverified = await certificateRepository.count({
      where: { userId, status: CertificateStatus.UNVERIFIED },
    });

    sendSuccess(
      res,
      {
        total,
        verified,
        pending,
        unverified,
        inReview: await certificateRepository.count({
          where: { userId, status: CertificateStatus.MANUAL_REVIEW },
        }),
      },
      'Statistics retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};