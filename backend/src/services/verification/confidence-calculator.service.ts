import logger from '../../utils/logger';

export interface ConfidenceFactors {
  digilockerVerified?: boolean;
  cbseVerified?: boolean;
  forensicPassed?: boolean;
  qrCodeValid?: boolean;
  digitalSignatureValid?: boolean;
  forensicRiskScore?: number;
  aadhaarVerified?: boolean;
  panVerified?: boolean;
  identityVerified?: boolean;
  isIdentityDocument?: boolean;
}

export interface ConfidenceResult {
  score: number;
  factors: {
    name: string;
    weight: number;
    passed: boolean;
    contribution: number;
  }[];
  recommendation: 'ACCEPT' | 'REVIEW' | 'REJECT';
}

/**
 * Service to calculate verification confidence scores
 */
class ConfidenceCalculatorService {
  private readonly weights = {
    digilocker: 50,
    cbse: 40,
    forensic: 30,
    qrCode: 20,
    digitalSignature: 20,
    aadhaar: 60,
    pan: 55,
    identity: 80, // For identity documents (Aadhaar/PAN cards)
  };

  private readonly thresholds = {
    accept: 70,
    review: 40,
  };

  /**
   * Calculate confidence score based on verification factors
   */
  calculate(factors: ConfidenceFactors): ConfidenceResult {
    const scoreFactors: ConfidenceResult['factors'] = [];
    let totalScore = 0;

    // Special handling for identity documents (Aadhaar/PAN cards)
    if (factors.isIdentityDocument) {
      if (factors.identityVerified !== undefined) {
        const passed = factors.identityVerified;
        const contribution = passed ? this.weights.identity : 0;
        totalScore += contribution;
        scoreFactors.push({
          name: 'Identity Verification',
          weight: this.weights.identity,
          passed,
          contribution,
        });
      }

      // For identity documents, we rely primarily on the identity verification
      // Add a small bonus if additional checks pass
      if (factors.forensicPassed !== undefined) {
        const passed = factors.forensicPassed;
        const contribution = passed ? 20 : -10;
        totalScore += contribution;
        scoreFactors.push({
          name: 'Document Forensics',
          weight: 20,
          passed,
          contribution,
        });
      }

      // Ensure score is between 0 and 100
      const finalScore = Math.max(0, Math.min(100, totalScore));

      // Determine recommendation
      let recommendation: 'ACCEPT' | 'REVIEW' | 'REJECT';
      if (finalScore >= this.thresholds.accept) {
        recommendation = 'ACCEPT';
      } else if (finalScore >= this.thresholds.review) {
        recommendation = 'REVIEW';
      } else {
        recommendation = 'REJECT';
      }

      logger.info('Identity document confidence score calculated', {
        score: finalScore,
        recommendation,
        factorsCount: scoreFactors.length,
      });

      return {
        score: finalScore,
        factors: scoreFactors,
        recommendation,
      };
    }

    // Standard document verification (educational certificates, etc.)
    // DigiLocker verification
    if (factors.digilockerVerified !== undefined) {
      const passed = factors.digilockerVerified;
      const contribution = passed ? this.weights.digilocker : 0;
      totalScore += contribution;
      scoreFactors.push({
        name: 'DigiLocker Verification',
        weight: this.weights.digilocker,
        passed,
        contribution,
      });
    }

    // CBSE portal verification
    if (factors.cbseVerified !== undefined) {
      const passed = factors.cbseVerified;
      const contribution = passed ? this.weights.cbse : 0;
      totalScore += contribution;
      scoreFactors.push({
        name: 'CBSE Portal Verification',
        weight: this.weights.cbse,
        passed,
        contribution,
      });
    }

    // Forensic analysis
    if (factors.forensicPassed !== undefined) {
      const passed = factors.forensicPassed;
      let contribution = 0;
      
      if (passed) {
        // If forensic passed, give full weight
        contribution = this.weights.forensic;
      } else if (factors.forensicRiskScore !== undefined) {
        // If failed, reduce score based on risk
        const riskPenalty = (factors.forensicRiskScore / 100) * this.weights.forensic;
        contribution = -riskPenalty;
      }
      
      totalScore += contribution;
      scoreFactors.push({
        name: 'Forensic Analysis',
        weight: this.weights.forensic,
        passed,
        contribution,
      });
    }

    // QR code validation
    if (factors.qrCodeValid !== undefined) {
      const passed = factors.qrCodeValid;
      const contribution = passed ? this.weights.qrCode : 0;
      totalScore += contribution;
      scoreFactors.push({
        name: 'QR Code Validation',
        weight: this.weights.qrCode,
        passed,
        contribution,
      });
    }

    // Digital signature validation
    if (factors.digitalSignatureValid !== undefined) {
      const passed = factors.digitalSignatureValid;
      const contribution = passed ? this.weights.digitalSignature : 0;
      totalScore += contribution;
      scoreFactors.push({
        name: 'Digital Signature',
        weight: this.weights.digitalSignature,
        passed,
        contribution,
      });
    }

    // Aadhaar verification (for educational certificates with identity data)
    if (factors.aadhaarVerified !== undefined) {
      const passed = factors.aadhaarVerified;
      const contribution = passed ? this.weights.aadhaar : 0;
      totalScore += contribution;
      scoreFactors.push({
        name: 'Aadhaar Verification',
        weight: this.weights.aadhaar,
        passed,
        contribution,
      });
    }

    // PAN verification (for educational certificates with identity data)
    if (factors.panVerified !== undefined) {
      const passed = factors.panVerified;
      const contribution = passed ? this.weights.pan : 0;
      totalScore += contribution;
      scoreFactors.push({
        name: 'PAN Verification',
        weight: this.weights.pan,
        passed,
        contribution,
      });
    }

    // Ensure score is between 0 and 100
    const finalScore = Math.max(0, Math.min(100, totalScore));

    // Determine recommendation
    let recommendation: 'ACCEPT' | 'REVIEW' | 'REJECT';
    if (finalScore >= this.thresholds.accept) {
      recommendation = 'ACCEPT';
    } else if (finalScore >= this.thresholds.review) {
      recommendation = 'REVIEW';
    } else {
      recommendation = 'REJECT';
    }

    logger.info('Confidence score calculated', {
      score: finalScore,
      recommendation,
      factorsCount: scoreFactors.length,
    });

    return {
      score: finalScore,
      factors: scoreFactors,
      recommendation,
    };
  }

  /**
   * Get confidence level description
   */
  getConfidenceLevel(score: number): string {
    if (score >= 90) return 'Very High';
    if (score >= 70) return 'High';
    if (score >= 50) return 'Medium';
    if (score >= 30) return 'Low';
    return 'Very Low';
  }

  /**
   * Check if manual review is required
   */
  requiresManualReview(score: number): boolean {
    return score < this.thresholds.accept;
  }
}

export default new ConfidenceCalculatorService();