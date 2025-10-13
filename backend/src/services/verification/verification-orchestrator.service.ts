import { AppDataSource } from '../../config/database';
import {
  Verification,
  VerificationType,
  VerificationStatus,
  VerificationResult,
  VerificationStep,
  StepType,
  StepStatus,
  Certificate,
  AuditLog,
  ReviewPriority,
} from '../../models';
import { NotFoundError } from '../../utils/error';
import logger from '../../utils/logger';
import { generateAuditHash } from '../../utils/crypto';
import digilockerMock from '../mock/digilocker-mock.service';
import cbseMock from '../mock/cbse-portal-mock.service';
import forensicMock from '../mock/forensic-mock.service';
import confidenceCalculator from './confidence-calculator.service';
import evidenceCollector from './evidence-collector.service';
import notificationService from './notification.service';
import manualReviewService from './manual-review.service';

export interface VerificationRequest {
  certificateId: string;
  verificationType: VerificationType;
  userId?: string;
  priority?: string;
  metadata?: any;
}

/**
 * Main verification pipeline orchestrator
 */
class VerificationOrchestratorService {
  private verificationRepository = AppDataSource.getRepository(Verification);
  private stepRepository = AppDataSource.getRepository(VerificationStep);
  private certificateRepository = AppDataSource.getRepository(Certificate);
  private auditRepository = AppDataSource.getRepository(AuditLog);

  /**
   * Start verification process
   */
  async startVerification(request: VerificationRequest): Promise<Verification> {
    logger.info('Starting verification', { certificateId: request.certificateId });

    // Get certificate
    const certificate = await this.certificateRepository.findOne({
      where: { id: request.certificateId },
    });

    if (!certificate) {
      throw new NotFoundError('Certificate not found');
    }

    // Create verification record
    const verification = this.verificationRepository.create({
      certificateId: request.certificateId,
      verificationType: request.verificationType,
      status: VerificationStatus.IN_PROGRESS,
      startedAt: new Date(),
    });

    await this.verificationRepository.save(verification);

    // Create audit log
    await this.createAuditLog({
      entityType: 'VERIFICATION',
      entityId: verification.id,
      action: 'VERIFICATION_STARTED',
      userId: request.userId,
      metadata: { certificateId: request.certificateId },
    });

    // Run verification pipeline asynchronously
    this.runVerificationPipeline(verification.id, certificate, request.userId)
      .catch((error) => {
        logger.error('Verification pipeline failed', {
          verificationId: verification.id,
          error: error.message,
        });
      });

    return verification;
  }

  /**
   * Run the complete verification pipeline
   */
  private async runVerificationPipeline(
    verificationId: string,
    certificate: Certificate,
    userId?: string
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('Running verification pipeline', { verificationId });

      const verification = await this.verificationRepository.findOne({
        where: { id: verificationId },
      });

      if (!verification) {
        throw new NotFoundError('Verification not found');
      }

      // Step 1: Check for QR code/digital signature → DigiLocker
      let digilockerResponse;
      let digilockerVerified = false;
      
      if (certificate.hasQrCode || certificate.hasDigitalSignature) {
        const step = await this.createStep(verificationId, StepType.API_CALL, 'Verifying via DigiLocker', 1);
        
        try {
          const qrCode = certificate.certificateData.qrCodeData || certificate.certificateData.qrCode || certificate.certificateData.digitalSignature || '';
          digilockerResponse = await digilockerMock.verifyDocument(
            qrCode,
            certificate.certificateData
          );
          
          digilockerVerified = digilockerResponse.status === 'SUCCESS' && digilockerResponse.verified === true;
          
          await this.updateStep(step.id, {
            status: digilockerVerified ? StepStatus.COMPLETED : StepStatus.FAILED,
            result: digilockerResponse,
          });
        } catch (error: any) {
          await this.updateStep(step.id, {
            status: StepStatus.FAILED,
            errorMessage: error.message,
          });
        }
      }

      // Step 2: CBSE Portal verification
      let cbseResponse;
      let cbseVerified = false;
      
      const cbseStep = await this.createStep(verificationId, StepType.PORTAL_LOOKUP, 'Verifying via CBSE Portal', 2);
      
      try {
        const rollNumber = certificate.certificateData.rollNumber || '';
        const examYear = certificate.certificateData.examYear || '';
        cbseResponse = await cbseMock.verifyCertificate(
          rollNumber,
          examYear,
          certificate.certificateData
        );
        
        cbseVerified = cbseResponse.found === true;
        
        await this.updateStep(cbseStep.id, {
          status: cbseVerified ? StepStatus.COMPLETED : StepStatus.FAILED,
          result: cbseResponse,
        });
      } catch (error: any) {
        await this.updateStep(cbseStep.id, {
          status: StepStatus.FAILED,
          errorMessage: error.message,
        });
      }

      // Step 3: Forensic analysis (always run)
      const forensicStep = await this.createStep(verificationId, StepType.METADATA_CHECK, 'Running forensic analysis', 3);
      
      let forensicResult;
      let forensicPassed = false;
      
      try {
        forensicResult = await forensicMock.analyze(certificate.certificateData);
        forensicPassed = forensicResult.recommendation === 'ACCEPT';
        
        await this.updateStep(forensicStep.id, {
          status: forensicPassed ? StepStatus.COMPLETED : StepStatus.FAILED,
          result: forensicResult,
        });
      } catch (error: any) {
        await this.updateStep(forensicStep.id, {
          status: StepStatus.FAILED,
          errorMessage: error.message,
        });
      }

      // Step 4: Calculate confidence score
      const confidenceResult = confidenceCalculator.calculate({
        digilockerVerified,
        cbseVerified,
        forensicPassed,
        qrCodeValid: !!certificate.hasQrCode && digilockerVerified,
        digitalSignatureValid: !!certificate.hasDigitalSignature && digilockerVerified,
        forensicRiskScore: forensicResult?.riskScore,
      });

      logger.info('Confidence score calculated', {
        verificationId,
        score: confidenceResult.score,
        recommendation: confidenceResult.recommendation,
      });

      // Step 5: Collect evidence
      const evidence = evidenceCollector.collect({
        digilockerResponse,
        cbseResponse,
        forensicResult,
        qrCodeValid: !!certificate.hasQrCode && digilockerVerified,
        qrCodeData: certificate.certificateData.qrCode,
      });

      // Step 6: Determine result
      let finalResult: VerificationResult;
      let finalStatus: VerificationStatus;

      if (confidenceResult.score >= 70) {
        finalResult = VerificationResult.VERIFIED;
        finalStatus = VerificationStatus.COMPLETED;
      } else if (confidenceResult.score < 40) {
        finalResult = VerificationResult.UNVERIFIED;
        finalStatus = VerificationStatus.COMPLETED;
      } else {
        // Requires manual review
        finalResult = VerificationResult.INCONCLUSIVE;
        finalStatus = VerificationStatus.COMPLETED;
        
        // Create manual review
        await manualReviewService.createReview({
          certificateId: certificate.id,
          reason: `Low confidence score: ${confidenceResult.score}%. Requires manual verification.`,
          priority: confidenceResult.score < 50 ? ReviewPriority.HIGH : ReviewPriority.MEDIUM,
        });

        logger.info('Manual review created', { verificationId, score: confidenceResult.score });
      }

      // Step 7: Update verification
      const duration = Date.now() - startTime;
      
      verification.status = finalStatus;
      verification.result = finalResult;
      verification.confidenceScore = confidenceResult.score;
      verification.resultData = {
        evidence,
        confidenceFactors: confidenceResult.factors,
        recommendation: confidenceResult.recommendation,
      };
      verification.completedAt = new Date();
      verification.durationMs = duration;

      await this.verificationRepository.save(verification);

      // Step 8: Create audit log
      await this.createAuditLog({
        entityType: 'VERIFICATION',
        entityId: verification.id,
        action: 'VERIFICATION_COMPLETED',
        userId,
        metadata: {
          result: finalResult,
          confidenceScore: confidenceResult.score,
          duration,
        },
      });

      // Step 9: Send notifications
      await notificationService.sendVerificationComplete({
        verificationId: verification.id,
        certificateId: certificate.id,
        status: finalStatus,
        result: finalResult,
        confidenceScore: confidenceResult.score,
      });

      logger.info('Verification pipeline completed', {
        verificationId,
        result: finalResult,
        score: confidenceResult.score,
        duration,
      });

    } catch (error: any) {
      logger.error('Verification pipeline error', {
        verificationId,
        error: error.message,
        stack: error.stack,
        errorName: error.name,
        errorType: typeof error,
      });

      // Update verification as failed
      try {
        await this.verificationRepository.update(verificationId, {
          status: VerificationStatus.FAILED,
          completedAt: new Date(),
          durationMs: Date.now() - startTime,
        });
      } catch (updateError: any) {
        logger.error('Failed to update verification status', {
          verificationId,
          updateError: updateError.message,
        });
      }

      throw error;
    }
  }

  /**
   * Get verification by ID
   */
  async getVerification(verificationId: string): Promise<Verification> {
    const verification = await this.verificationRepository.findOne({
      where: { id: verificationId },
      relations: ['certificate', 'steps'],
    });

    if (!verification) {
      throw new NotFoundError('Verification not found');
    }

    return verification;
  }

  /**
   * Get verification steps
   */
  async getVerificationSteps(verificationId: string): Promise<VerificationStep[]> {
    const steps = await this.stepRepository.find({
      where: { verificationId },
      order: { executedAt: 'ASC' },
    });

    return steps;
  }

  /**
   * Retry failed verification
   */
  async retryVerification(verificationId: string, userId?: string): Promise<Verification> {
    const verification = await this.getVerification(verificationId);

    if (verification.status !== VerificationStatus.FAILED) {
      throw new Error('Can only retry failed verifications');
    }

    // Reset verification
    verification.status = VerificationStatus.IN_PROGRESS;
    verification.result = undefined;
    verification.confidenceScore = undefined;
    verification.resultData = undefined;
    verification.completedAt = undefined;
    verification.durationMs = undefined;
    verification.startedAt = new Date();

    await this.verificationRepository.save(verification);

    // Delete old steps
    await this.stepRepository.delete({ verificationId });

    // Run pipeline again
    this.runVerificationPipeline(verificationId, verification.certificate, userId)
      .catch((error) => {
        logger.error('Retry verification failed', {
          verificationId,
          error: error.message,
        });
      });

    return verification;
  }

  /**
   * Create verification step
   */
  private async createStep(
    verificationId: string,
    stepType: StepType,
    stepName: string,
    sequenceNumber: number
  ): Promise<VerificationStep> {
    const step = this.stepRepository.create({
      verificationId,
      stepType,
      stepName,
      status: StepStatus.IN_PROGRESS,
      sequenceNumber,
      executedAt: new Date(),
    });

    await this.stepRepository.save(step);
    return step;
  }

  /**
   * Update verification step
   */
  private async updateStep(
    stepId: string,
    data: {
      status: StepStatus;
      result?: any;
      errorMessage?: string;
    }
  ): Promise<void> {
    const step = await this.stepRepository.findOne({ where: { id: stepId } });
    
    if (step) {
      const startTime = step.executedAt.getTime();
      const endTime = Date.now();
      
      step.status = data.status;
      step.durationMs = endTime - startTime;
      
      if (data.result) {
        step.result = data.result;
      }
      
      if (data.errorMessage) {
        step.errorMessage = data.errorMessage;
      }
      
      await this.stepRepository.save(step);
    }
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(data: {
    entityType: string;
    entityId: string;
    action: string;
    userId?: string;
    metadata?: any;
  }): Promise<void> {
    // Get the last audit log to chain hashes
    const lastAuditLog = await this.auditRepository
      .createQueryBuilder('audit_log')
      .orderBy('audit_log.created_at', 'DESC')
      .limit(1)
      .getOne();

    // Prepare audit data for hashing
    const auditData = {
      entityType: data.entityType,
      entityId: data.entityId,
      action: data.action,
      userId: data.userId,
      metadata: data.metadata,
      timestamp: new Date().toISOString(),
    };

    // Generate hash
    const hash = generateAuditHash(auditData, lastAuditLog?.hash);

    const auditLog = this.auditRepository.create({
      entityType: data.entityType as any,
      entityId: data.entityId,
      action: data.action,
      userId: data.userId,
      metadata: data.metadata,
      ipAddress: '127.0.0.1', // Would be from request in real implementation
      userAgent: 'System',
      hash,
      previousHash: lastAuditLog?.hash,
    });

    await this.auditRepository.save(auditLog);
  }
}

export default new VerificationOrchestratorService();