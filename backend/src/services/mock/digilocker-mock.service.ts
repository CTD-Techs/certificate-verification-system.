import logger from '../../utils/logger';

export interface DigiLockerResponse {
  status: 'SUCCESS' | 'FAILED' | 'ERROR';
  documentId?: string;
  verified?: boolean;
  issuer?: {
    name: string;
    code: string;
    verified: boolean;
  };
  document?: {
    type: string;
    issueDate: string;
    validUntil?: string;
  };
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

class DigiLockerMockService {
  private readonly successRate = 0.95;
  private readonly responseDelayMin = 500;
  private readonly responseDelayMax = 2000;
  private readonly networkErrorRate = 0.02;

  /**
   * Simulate delay with normal distribution
   */
  private async simulateDelay(): Promise<void> {
    const delay = this.normalDistribution(
      this.responseDelayMin,
      this.responseDelayMax,
      (this.responseDelayMin + this.responseDelayMax) / 2
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Normal distribution for realistic delays
   */
  private normalDistribution(min: number, max: number, mean: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const value = mean + z * (max - min) / 6;
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Determine outcome based on probability
   */
  private determineOutcome(): 'success' | 'invalid' | 'error' {
    const rand = Math.random();
    if (rand < this.networkErrorRate) {
      return 'error';
    } else if (rand < this.successRate) {
      return 'success';
    } else {
      return 'invalid';
    }
  }

  /**
   * Verify document via DigiLocker (mock)
   */
  async verifyDocument(qrCode: string, certificateData: any): Promise<DigiLockerResponse> {
    logger.info('DigiLocker mock verification started', { qrCode });

    // Simulate network delay
    await this.simulateDelay();

    const outcome = this.determineOutcome();

    if (outcome === 'error') {
      logger.warn('DigiLocker mock: Network error simulated');
      return {
        status: 'ERROR',
        error: {
          code: 'NETWORK_TIMEOUT',
          message: 'Request timed out',
        },
        timestamp: new Date().toISOString(),
      };
    }

    if (outcome === 'invalid') {
      logger.warn('DigiLocker mock: Invalid signature simulated');
      return {
        status: 'FAILED',
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Digital signature verification failed',
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Success response
    logger.info('DigiLocker mock: Verification successful');
    return {
      status: 'SUCCESS',
      documentId: `DL-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      verified: true,
      issuer: {
        name: certificateData.issuerName || 'Central Board of Secondary Education',
        code: certificateData.issuerType || 'CBSE',
        verified: true,
      },
      document: {
        type: 'CERTIFICATE',
        issueDate: certificateData.issueDate || new Date().toISOString().split('T')[0],
        validUntil: undefined,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if DigiLocker service is available (mock)
   */
  async checkAvailability(): Promise<boolean> {
    // 95% uptime simulation
    return Math.random() < 0.95;
  }
}

export default new DigiLockerMockService();