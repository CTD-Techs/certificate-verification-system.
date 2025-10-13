import logger from '../../utils/logger';

export interface ForensicFinding {
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  evidence?: string;
}

export interface ForensicAnalysisResult {
  riskScore: number; // 0-100
  findings: ForensicFinding[];
  recommendation: 'ACCEPT' | 'REVIEW' | 'REJECT';
  analysisTime: number;
  timestamp: string;
}

class ForensicAnalyzerMockService {
  private readonly analysisDelayMin = 2000;
  private readonly analysisDelayMax = 8000;

  /**
   * Simulate analysis delay
   */
  private async simulateDelay(): Promise<number> {
    const delay = Math.floor(
      Math.random() * (this.analysisDelayMax - this.analysisDelayMin) + this.analysisDelayMin
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
    return delay;
  }

  /**
   * Check font consistency
   */
  private checkFonts(): ForensicFinding | null {
    const hasFontIssue = Math.random() < 0.05;
    if (hasFontIssue) {
      return {
        category: 'FONT_ANALYSIS',
        severity: 'MEDIUM',
        description: 'Inconsistent font usage detected in certificate body',
        evidence: 'Multiple font families found: Arial, Times New Roman',
      };
    }
    return null;
  }

  /**
   * Check metadata
   */
  private checkMetadata(): ForensicFinding | null {
    const hasMetadataIssue = Math.random() < 0.03;
    if (hasMetadataIssue) {
      return {
        category: 'METADATA',
        severity: 'HIGH',
        description: 'Document creation date does not match issue date',
        evidence: 'Created: 2024-01-15, Issue Date: 2023-06-20',
      };
    }
    return null;
  }

  /**
   * Check template matching
   */
  private checkTemplate(): ForensicFinding | null {
    const hasTemplateIssue = Math.random() < 0.04;
    if (hasTemplateIssue) {
      return {
        category: 'TEMPLATE',
        severity: 'LOW',
        description: 'Minor deviations from standard certificate template',
        evidence: 'Logo placement differs by 2px from standard',
      };
    }
    return null;
  }

  /**
   * Check seal/signature
   */
  private checkSeal(): ForensicFinding | null {
    const hasSealIssue = Math.random() < 0.02;
    if (hasSealIssue) {
      return {
        category: 'SEAL',
        severity: 'HIGH',
        description: 'Official seal shows signs of digital manipulation',
        evidence: 'ELA analysis indicates copy-paste artifacts',
      };
    }
    return null;
  }

  /**
   * Calculate risk score based on findings
   */
  private calculateRiskScore(findings: ForensicFinding[]): number {
    if (findings.length === 0) return 0;

    const severityWeights = {
      LOW: 15,
      MEDIUM: 40,
      HIGH: 80,
    };

    const totalScore = findings.reduce(
      (sum, finding) => sum + severityWeights[finding.severity],
      0
    );

    return Math.min(100, totalScore);
  }

  /**
   * Get recommendation based on risk score
   */
  private getRecommendation(riskScore: number): 'ACCEPT' | 'REVIEW' | 'REJECT' {
    if (riskScore >= 70) return 'REJECT';
    if (riskScore >= 30) return 'REVIEW';
    return 'ACCEPT';
  }

  /**
   * Analyze certificate for tampering and anomalies (mock)
   */
  async analyze(_certificateData: any): Promise<ForensicAnalysisResult> {
    logger.info('Forensic analysis mock started');

    const analysisTime = await this.simulateDelay();

    // Run all checks
    const findings: ForensicFinding[] = [
      this.checkFonts(),
      this.checkMetadata(),
      this.checkTemplate(),
      this.checkSeal(),
    ].filter((finding): finding is ForensicFinding => finding !== null);

    const riskScore = this.calculateRiskScore(findings);
    const recommendation = this.getRecommendation(riskScore);

    logger.info('Forensic analysis mock completed', {
      riskScore,
      findingsCount: findings.length,
      recommendation,
    });

    return {
      riskScore,
      findings,
      recommendation,
      analysisTime,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Quick check for obvious tampering
   */
  async quickCheck(_certificateData: any): Promise<boolean> {
    // Simulate quick check (500ms)
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // 95% pass rate for quick check
    return Math.random() < 0.95;
  }
}

export default new ForensicAnalyzerMockService();