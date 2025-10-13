import logger from '../../utils/logger';
import { DigiLockerResponse } from '../mock/digilocker-mock.service';
import { CBSEPortalResponse } from '../mock/cbse-portal-mock.service';
import { ForensicAnalysisResult } from '../mock/forensic-mock.service';

export interface VerificationEvidence {
  digilocker?: {
    status: string;
    verified: boolean;
    documentId?: string;
    issuer?: any;
    timestamp: string;
    error?: any;
  };
  cbse?: {
    found: boolean;
    rollNumber?: string;
    examYear?: string;
    studentName?: string;
    school?: any;
    result?: any;
    verificationCode?: string;
    timestamp: string;
    error?: any;
  };
  forensic?: {
    riskScore: number;
    findings: any[];
    recommendation: string;
    analysisTime: number;
    timestamp: string;
  };
  qrCode?: {
    valid: boolean;
    data?: any;
    timestamp: string;
  };
  aadhaar?: {
    status: string;
    verified: boolean;
    aadhaarNumber?: string;
    demographicMatch?: any;
    verificationId?: string;
    timestamp: string;
    error?: any;
  };
  pan?: {
    status: string;
    verified: boolean;
    panNumber?: string;
    holder?: any;
    aadhaarLinked?: boolean;
    nameMatch?: boolean;
    dobMatch?: boolean;
    verificationId?: string;
    timestamp: string;
    error?: any;
  };
  metadata: {
    collectedAt: string;
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
  };
}

/**
 * Service to collect and format verification evidence
 */
class EvidenceCollectorService {
  /**
   * Collect all evidence from verification steps
   */
  collect(data: {
    digilockerResponse?: DigiLockerResponse;
    cbseResponse?: CBSEPortalResponse;
    forensicResult?: ForensicAnalysisResult;
    qrCodeValid?: boolean;
    qrCodeData?: any;
    aadhaarResponse?: any;
    panResponse?: any;
    aadhaarVerified?: boolean;
    panVerified?: boolean;
    identityResponse?: any;
    identityVerified?: boolean;
  }): VerificationEvidence {
    let passedChecks = 0;
    let totalChecks = 0;

    const evidence: VerificationEvidence = {
      metadata: {
        collectedAt: new Date().toISOString(),
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
      },
    };

    // DigiLocker evidence
    if (data.digilockerResponse) {
      totalChecks++;
      const verified = data.digilockerResponse.status === 'SUCCESS' && 
                      data.digilockerResponse.verified === true;
      if (verified) passedChecks++;

      evidence.digilocker = {
        status: data.digilockerResponse.status,
        verified,
        documentId: data.digilockerResponse.documentId,
        issuer: data.digilockerResponse.issuer,
        timestamp: data.digilockerResponse.timestamp,
        error: data.digilockerResponse.error,
      };
    }

    // CBSE portal evidence
    if (data.cbseResponse) {
      totalChecks++;
      if (data.cbseResponse.found) passedChecks++;

      evidence.cbse = {
        found: data.cbseResponse.found,
        rollNumber: data.cbseResponse.rollNumber,
        examYear: data.cbseResponse.examYear,
        studentName: data.cbseResponse.studentName,
        school: data.cbseResponse.school,
        result: data.cbseResponse.result,
        verificationCode: data.cbseResponse.verificationCode,
        timestamp: data.cbseResponse.timestamp,
        error: data.cbseResponse.error,
      };
    }

    // Forensic analysis evidence
    if (data.forensicResult) {
      totalChecks++;
      const passed = data.forensicResult.recommendation === 'ACCEPT';
      if (passed) passedChecks++;

      evidence.forensic = {
        riskScore: data.forensicResult.riskScore,
        findings: data.forensicResult.findings,
        recommendation: data.forensicResult.recommendation,
        analysisTime: data.forensicResult.analysisTime,
        timestamp: data.forensicResult.timestamp,
      };
    }

    // QR code evidence
    if (data.qrCodeValid !== undefined) {
      totalChecks++;
      if (data.qrCodeValid) passedChecks++;

      evidence.qrCode = {
        valid: data.qrCodeValid,
        data: data.qrCodeData,
        timestamp: new Date().toISOString(),
      };
    }

    // Aadhaar verification evidence
    if (data.aadhaarResponse) {
      totalChecks++;
      const verified = data.aadhaarResponse.status === 'SUCCESS' &&
                      data.aadhaarResponse.verified === true;
      if (verified) passedChecks++;

      evidence.aadhaar = {
        status: data.aadhaarResponse.status,
        verified,
        aadhaarNumber: data.aadhaarResponse.aadhaarNumber,
        demographicMatch: data.aadhaarResponse.demographicMatch,
        verificationId: data.aadhaarResponse.verificationId,
        timestamp: data.aadhaarResponse.timestamp,
        error: data.aadhaarResponse.error,
      };
    }

    // PAN verification evidence
    if (data.panResponse) {
      totalChecks++;
      const verified = data.panResponse.status === 'SUCCESS' &&
                      data.panResponse.verified === true;
      if (verified) passedChecks++;

      evidence.pan = {
        status: data.panResponse.status,
        verified,
        panNumber: data.panResponse.panNumber,
        holder: data.panResponse.holder,
        aadhaarLinked: data.panResponse.aadhaarLinked,
        nameMatch: data.panResponse.nameMatch,
        dobMatch: data.panResponse.dobMatch,
        verificationId: data.panResponse.verificationId,
        timestamp: data.panResponse.timestamp,
        error: data.panResponse.error,
      };
    }

    // Identity verification evidence (for identity documents)
    if (data.identityResponse) {
      totalChecks++;
      if (data.identityVerified) passedChecks++;

      // Determine if it's Aadhaar or PAN based on response structure
      if (data.identityResponse.aadhaarNumber) {
        evidence.aadhaar = {
          status: data.identityResponse.status,
          verified: data.identityVerified || false,
          aadhaarNumber: data.identityResponse.aadhaarNumber,
          demographicMatch: data.identityResponse.demographicMatch,
          verificationId: data.identityResponse.verificationId,
          timestamp: data.identityResponse.timestamp,
          error: data.identityResponse.error,
        };
      } else if (data.identityResponse.panNumber) {
        evidence.pan = {
          status: data.identityResponse.status,
          verified: data.identityVerified || false,
          panNumber: data.identityResponse.panNumber,
          holder: data.identityResponse.holder,
          aadhaarLinked: data.identityResponse.aadhaarLinked,
          nameMatch: data.identityResponse.nameMatch,
          dobMatch: data.identityResponse.dobMatch,
          verificationId: data.identityResponse.verificationId,
          timestamp: data.identityResponse.timestamp,
          error: data.identityResponse.error,
        };
      }
    }

    // Update metadata
    evidence.metadata.totalChecks = totalChecks;
    evidence.metadata.passedChecks = passedChecks;
    evidence.metadata.failedChecks = totalChecks - passedChecks;

    logger.info('Evidence collected', {
      totalChecks,
      passedChecks,
      failedChecks: totalChecks - passedChecks,
    });

    return evidence;
  }

  /**
   * Format evidence for display
   */
  format(evidence: VerificationEvidence): string {
    const sections: string[] = [];

    sections.push('=== VERIFICATION EVIDENCE ===\n');

    if (evidence.digilocker) {
      sections.push('DigiLocker Verification:');
      sections.push(`  Status: ${evidence.digilocker.status}`);
      sections.push(`  Verified: ${evidence.digilocker.verified ? 'Yes' : 'No'}`);
      if (evidence.digilocker.documentId) {
        sections.push(`  Document ID: ${evidence.digilocker.documentId}`);
      }
      if (evidence.digilocker.error) {
        sections.push(`  Error: ${evidence.digilocker.error.message}`);
      }
      sections.push('');
    }

    if (evidence.cbse) {
      sections.push('CBSE Portal Verification:');
      sections.push(`  Found: ${evidence.cbse.found ? 'Yes' : 'No'}`);
      if (evidence.cbse.found) {
        sections.push(`  Roll Number: ${evidence.cbse.rollNumber}`);
        sections.push(`  Student: ${evidence.cbse.studentName}`);
        sections.push(`  Verification Code: ${evidence.cbse.verificationCode}`);
      }
      if (evidence.cbse.error) {
        sections.push(`  Error: ${evidence.cbse.error.message}`);
      }
      sections.push('');
    }

    if (evidence.forensic) {
      sections.push('Forensic Analysis:');
      sections.push(`  Risk Score: ${evidence.forensic.riskScore}/100`);
      sections.push(`  Recommendation: ${evidence.forensic.recommendation}`);
      sections.push(`  Findings: ${evidence.forensic.findings.length}`);
      sections.push('');
    }

    if (evidence.qrCode) {
      sections.push('QR Code Validation:');
      sections.push(`  Valid: ${evidence.qrCode.valid ? 'Yes' : 'No'}`);
      sections.push('');
    }

    if (evidence.aadhaar) {
      sections.push('Aadhaar Verification:');
      sections.push(`  Status: ${evidence.aadhaar.status}`);
      sections.push(`  Verified: ${evidence.aadhaar.verified ? 'Yes' : 'No'}`);
      if (evidence.aadhaar.aadhaarNumber) {
        sections.push(`  Aadhaar: ${evidence.aadhaar.aadhaarNumber}`);
      }
      if (evidence.aadhaar.demographicMatch) {
        sections.push(`  Demographic Match Score: ${evidence.aadhaar.demographicMatch.overallScore}%`);
      }
      if (evidence.aadhaar.verificationId) {
        sections.push(`  Verification ID: ${evidence.aadhaar.verificationId}`);
      }
      if (evidence.aadhaar.error) {
        sections.push(`  Error: ${evidence.aadhaar.error.message}`);
      }
      sections.push('');
    }

    if (evidence.pan) {
      sections.push('PAN Verification:');
      sections.push(`  Status: ${evidence.pan.status}`);
      sections.push(`  Verified: ${evidence.pan.verified ? 'Yes' : 'No'}`);
      if (evidence.pan.panNumber) {
        sections.push(`  PAN: ${evidence.pan.panNumber}`);
      }
      if (evidence.pan.holder) {
        sections.push(`  Holder: ${evidence.pan.holder.name}`);
        sections.push(`  Status: ${evidence.pan.holder.status}`);
      }
      if (evidence.pan.aadhaarLinked !== undefined) {
        sections.push(`  Aadhaar Linked: ${evidence.pan.aadhaarLinked ? 'Yes' : 'No'}`);
      }
      if (evidence.pan.nameMatch !== undefined) {
        sections.push(`  Name Match: ${evidence.pan.nameMatch ? 'Yes' : 'No'}`);
      }
      if (evidence.pan.verificationId) {
        sections.push(`  Verification ID: ${evidence.pan.verificationId}`);
      }
      if (evidence.pan.error) {
        sections.push(`  Error: ${evidence.pan.error.message}`);
      }
      sections.push('');
    }

    sections.push('Summary:');
    sections.push(`  Total Checks: ${evidence.metadata.totalChecks}`);
    sections.push(`  Passed: ${evidence.metadata.passedChecks}`);
    sections.push(`  Failed: ${evidence.metadata.failedChecks}`);

    return sections.join('\n');
  }

  /**
   * Extract key findings from evidence
   */
  extractKeyFindings(evidence: VerificationEvidence): string[] {
    const findings: string[] = [];

    if (evidence.digilocker?.verified) {
      findings.push('Certificate verified via DigiLocker');
    }

    if (evidence.cbse?.found) {
      findings.push('Certificate found in CBSE database');
    }

    if (evidence.forensic) {
      if (evidence.forensic.recommendation === 'ACCEPT') {
        findings.push('Forensic analysis passed');
      } else if (evidence.forensic.recommendation === 'REJECT') {
        findings.push(`Forensic analysis failed (Risk: ${evidence.forensic.riskScore}%)`);
      } else {
        findings.push('Forensic analysis requires review');
      }
    }

    if (evidence.qrCode?.valid) {
      findings.push('QR code validated successfully');
    }

    if (evidence.aadhaar?.verified) {
      findings.push('Aadhaar verification successful');
      if (evidence.aadhaar.demographicMatch) {
        findings.push(`Demographic match: ${evidence.aadhaar.demographicMatch.overallScore}%`);
      }
    }

    if (evidence.pan?.verified) {
      findings.push('PAN verification successful');
      if (evidence.pan.aadhaarLinked) {
        findings.push('PAN is linked to Aadhaar');
      }
    }

    return findings;
  }
}

export default new EvidenceCollectorService();