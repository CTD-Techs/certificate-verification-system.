import logger from '../../utils/logger';

/**
 * PAN verification response interface
 */
export interface PANVerificationResponse {
  status: 'SUCCESS' | 'FAILED' | 'ERROR';
  verified?: boolean;
  panNumber?: string;
  holder?: {
    name: string;
    dob: string;
    category: 'Individual' | 'Company' | 'HUF' | 'Firm' | 'AOP' | 'Trust' | 'Government';
    status: 'Active' | 'Inactive' | 'Suspended';
    registrationDate: string;
  };
  aadhaarLinked?: boolean;
  aadhaarLinkageDate?: string;
  nameMatch?: boolean;
  dobMatch?: boolean;
  verificationId?: string;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

/**
 * PAN verification request interface
 */
export interface PANVerificationRequest {
  panNumber: string;
  name: string;
  dob: string; // YYYY-MM-DD format
  category?: 'Individual' | 'Company' | 'HUF' | 'Firm' | 'AOP' | 'Trust' | 'Government';
}

/**
 * PAN-Aadhaar linkage check request
 */
export interface PANAadhaarLinkageRequest {
  panNumber: string;
  aadhaarNumber: string;
}

/**
 * PAN-Aadhaar linkage response
 */
export interface PANAadhaarLinkageResponse {
  linked: boolean;
  linkageDate?: string;
  status?: 'LINKED' | 'NOT_LINKED' | 'PENDING';
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

/**
 * Mock service for PAN verification
 * Simulates Income Tax Department API
 */
class PANMockService {
  // Success rates for different scenarios (total = 100%)
  private readonly errorRate = 0.005; // 0.5% system error
  private readonly invalidPANRate = 0.04; // 4% invalid PAN
  private readonly inactivePANRate = 0.015; // 1.5% inactive PAN
  // successRate = 0.94 (94% success) - calculated as remainder

  // Response delay configuration (in milliseconds)
  private readonly responseDelayMin = 600;
  private readonly responseDelayMax = 2500;

  // PAN-Aadhaar linkage rate (85% of valid PANs are linked to Aadhaar)
  private readonly aadhaarLinkageRate = 0.85;

  /**
   * Validate PAN format (5 letters + 4 digits + 1 letter)
   * Format: ABCDE1234F
   * - First 3 characters: Alphabetic series (AAA to ZZZ)
   * - 4th character: Type of holder (P=Individual, C=Company, H=HUF, F=Firm, A=AOP, T=Trust, G=Government)
   * - 5th character: First letter of PAN holder's name/surname
   * - Next 4 characters: Sequential number (0001 to 9999)
   * - Last character: Alphabetic check digit
   */
  private validatePANFormat(panNumber: string): {
    valid: boolean;
    error?: string;
    category?: string;
  } {
    if (!panNumber) {
      return { valid: false, error: 'PAN number is required' };
    }

    // Convert to uppercase for validation
    const pan = panNumber.toUpperCase();

    // Check length
    if (pan.length !== 10) {
      return { valid: false, error: 'PAN must be 10 characters long' };
    }

    // Check format: 5 letters + 4 digits + 1 letter
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    if (!panRegex.test(pan)) {
      return {
        valid: false,
        error: 'Invalid PAN format. Expected: 5 letters + 4 digits + 1 letter',
      };
    }

    // Validate 4th character (holder type)
    const holderType = pan.charAt(3);
    const validHolderTypes = ['P', 'C', 'H', 'F', 'A', 'T', 'G', 'L', 'J', 'B'];
    if (!validHolderTypes.includes(holderType)) {
      return { valid: false, error: 'Invalid PAN holder type' };
    }

    // Map holder type to category
    const categoryMap: Record<string, string> = {
      P: 'Individual',
      C: 'Company',
      H: 'HUF',
      F: 'Firm',
      A: 'AOP',
      T: 'Trust',
      G: 'Government',
      L: 'Local Authority',
      J: 'Artificial Juridical Person',
      B: 'Body of Individuals',
    };

    return { valid: true, category: categoryMap[holderType] || 'Individual' };
  }

  /**
   * Simulate network delay with normal distribution
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
    const value = mean + z * ((max - min) / 6);
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Determine verification outcome based on probability
   */
  private determineOutcome(): 'success' | 'invalid' | 'inactive' | 'error' {
    const rand = Math.random();
    if (rand < this.errorRate) {
      return 'error';
    } else if (rand < this.errorRate + this.invalidPANRate) {
      return 'invalid';
    } else if (rand < this.errorRate + this.invalidPANRate + this.inactivePANRate) {
      return 'inactive';
    } else {
      return 'success';
    }
  }

  /**
   * Fuzzy string matching for names (handles minor variations)
   */
  private fuzzyMatch(str1: string, str2: string): boolean {
    const normalize = (s: string) =>
      s.toLowerCase().replace(/[^a-z]/g, '').trim();
    
    const n1 = normalize(str1);
    const n2 = normalize(str2);

    // Exact match
    if (n1 === n2) return true;

    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(n1, n2);
    const maxLength = Math.max(n1.length, n2.length);
    const similarity = 1 - distance / maxLength;

    // Accept if similarity is above 85%
    return similarity >= 0.85;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Generate mock PAN holder data
   */
  private generateMockHolderData(
    request: PANVerificationRequest,
    category: string
  ): any {
    // Generate registration date (random date in the past 5-20 years)
    const yearsAgo = Math.floor(Math.random() * 15) + 5;
    const registrationDate = new Date();
    registrationDate.setFullYear(registrationDate.getFullYear() - yearsAgo);

    return {
      name: request.name,
      dob: request.dob,
      category: category as any,
      status: 'Active' as const,
      registrationDate: registrationDate.toISOString().split('T')[0],
    };
  }

  /**
   * Determine if PAN is linked to Aadhaar
   */
  private isAadhaarLinked(): {
    linked: boolean;
    linkageDate?: string;
  } {
    const linked = Math.random() < this.aadhaarLinkageRate;
    
    if (linked) {
      // Generate linkage date (random date in the past 1-3 years)
      const yearsAgo = Math.random() * 2 + 1;
      const linkageDate = new Date();
      linkageDate.setFullYear(linkageDate.getFullYear() - yearsAgo);
      
      return {
        linked: true,
        linkageDate: linkageDate.toISOString().split('T')[0],
      };
    }

    return { linked: false };
  }

  /**
   * Verify PAN details (mock implementation)
   */
  async verifyPAN(request: PANVerificationRequest): Promise<PANVerificationResponse> {
    logger.info('PAN mock verification started', {
      panNumber: request.panNumber,
    });

    // Validate PAN format
    const formatValidation = this.validatePANFormat(request.panNumber);
    if (!formatValidation.valid) {
      logger.warn('PAN mock: Invalid format', { error: formatValidation.error });
      return {
        status: 'FAILED',
        error: {
          code: 'INVALID_FORMAT',
          message: formatValidation.error || 'Invalid PAN format',
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Simulate network delay
    await this.simulateDelay();

    const outcome = this.determineOutcome();

    // Handle error scenario
    if (outcome === 'error') {
      logger.warn('PAN mock: System error simulated');
      return {
        status: 'ERROR',
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Income Tax Department service temporarily unavailable',
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Handle invalid PAN scenario
    if (outcome === 'invalid') {
      logger.warn('PAN mock: PAN not found in database');
      return {
        status: 'FAILED',
        error: {
          code: 'PAN_NOT_FOUND',
          message: 'PAN not found in Income Tax Department database',
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Generate mock holder data
    const holderData = this.generateMockHolderData(
      request,
      formatValidation.category || 'Individual'
    );

    // Handle inactive PAN scenario
    if (outcome === 'inactive') {
      logger.warn('PAN mock: Inactive PAN');
      holderData.status = 'Inactive';
      
      return {
        status: 'FAILED',
        verified: false,
        panNumber: request.panNumber.toUpperCase(),
        holder: holderData,
        error: {
          code: 'PAN_INACTIVE',
          message: 'PAN is inactive or suspended',
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Check name and DOB match
    const nameMatch = this.fuzzyMatch(request.name, holderData.name);
    const dobMatch = request.dob === holderData.dob;

    // Check Aadhaar linkage
    const aadhaarLinkage = this.isAadhaarLinked();

    // Success scenario
    logger.info('PAN mock: Verification successful', {
      nameMatch,
      dobMatch,
      aadhaarLinked: aadhaarLinkage.linked,
    });

    return {
      status: 'SUCCESS',
      verified: nameMatch && dobMatch,
      panNumber: request.panNumber.toUpperCase(),
      holder: holderData,
      aadhaarLinked: aadhaarLinkage.linked,
      aadhaarLinkageDate: aadhaarLinkage.linkageDate,
      nameMatch,
      dobMatch,
      verificationId: `PAN-VER-${new Date().getFullYear()}-${Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase()}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check PAN-Aadhaar linkage status (mock implementation)
   */
  async checkPANAadhaarLinkage(
    request: PANAadhaarLinkageRequest
  ): Promise<PANAadhaarLinkageResponse> {
    logger.info('PAN-Aadhaar linkage check started', {
      panNumber: request.panNumber,
    });

    // Validate PAN format
    const formatValidation = this.validatePANFormat(request.panNumber);
    if (!formatValidation.valid) {
      return {
        linked: false,
        status: 'NOT_LINKED',
        error: {
          code: 'INVALID_PAN',
          message: formatValidation.error || 'Invalid PAN format',
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Simulate network delay
    await this.simulateDelay();

    // Determine linkage status
    const linkage = this.isAadhaarLinked();

    if (linkage.linked) {
      logger.info('PAN-Aadhaar linkage: Linked');
      return {
        linked: true,
        linkageDate: linkage.linkageDate,
        status: 'LINKED',
        timestamp: new Date().toISOString(),
      };
    } else {
      logger.info('PAN-Aadhaar linkage: Not linked');
      return {
        linked: false,
        status: 'NOT_LINKED',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check Income Tax Department service availability (mock)
   */
  async checkAvailability(): Promise<boolean> {
    // 98% uptime simulation
    return Math.random() < 0.98;
  }

  /**
   * Validate PAN format only (without full verification)
   */
  validatePANFormatOnly(panNumber: string): {
    valid: boolean;
    category?: string;
    error?: string;
  } {
    return this.validatePANFormat(panNumber);
  }

  /**
   * Get PAN holder category from PAN number
   */
  getPANCategory(panNumber: string): string | null {
    if (panNumber.length !== 10) return null;

    const holderType = panNumber.charAt(3).toUpperCase();
    const categoryMap: Record<string, string> = {
      P: 'Individual',
      C: 'Company',
      H: 'HUF',
      F: 'Firm',
      A: 'AOP',
      T: 'Trust',
      G: 'Government',
      L: 'Local Authority',
      J: 'Artificial Juridical Person',
      B: 'Body of Individuals',
    };

    return categoryMap[holderType] || null;
  }
}

export default new PANMockService();