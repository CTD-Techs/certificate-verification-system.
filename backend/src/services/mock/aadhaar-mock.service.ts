import logger from '../../utils/logger';

/**
 * Aadhaar verification response interface
 */
export interface AadhaarVerificationResponse {
  status: 'SUCCESS' | 'FAILED' | 'ERROR';
  verified?: boolean;
  aadhaarNumber?: string; // Masked format: XXXX-XXXX-1234
  demographicMatch?: {
    name: boolean;
    dob: boolean;
    gender: boolean;
    address: boolean;
    overallScore: number; // 0-100
  };
  holder?: {
    name: string;
    dob: string;
    gender: 'M' | 'F' | 'O';
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  verificationId?: string;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

/**
 * Aadhaar verification request interface
 */
export interface AadhaarVerificationRequest {
  aadhaarNumber: string;
  name: string;
  dob: string; // YYYY-MM-DD format
  gender?: 'M' | 'F' | 'O';
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

/**
 * Mock service for Aadhaar verification
 * Simulates UIDAI (Unique Identification Authority of India) API
 */
class AadhaarMockService {
  // Success rates for different scenarios (total = 100%)
  private readonly errorRate = 0.01; // 1% system error
  private readonly invalidAadhaarRate = 0.05; // 5% invalid Aadhaar
  private readonly mismatchRate = 0.02; // 2% demographic mismatch
  // successRate = 0.92 (92% success) - calculated as remainder

  // Response delay configuration (in milliseconds)
  private readonly responseDelayMin = 800;
  private readonly responseDelayMax = 3000;

  // Verhoeff algorithm multiplication table
  private readonly verhoeffMultiplicationTable = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  ];

  // Verhoeff algorithm permutation table
  private readonly verhoeffPermutationTable = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
  ];

  /**
   * Validate Aadhaar number using Verhoeff algorithm
   */
  private validateVerhoeff(aadhaarNumber: string): boolean {
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      return false;
    }

    let checksum = 0;
    const digits = aadhaarNumber.split('').map(Number).reverse();

    for (let i = 0; i < digits.length; i++) {
      const permutationIndex = i % 8;
      const permutedDigit = this.verhoeffPermutationTable[permutationIndex][digits[i]];
      checksum = this.verhoeffMultiplicationTable[checksum][permutedDigit];
    }

    return checksum === 0;
  }

  /**
   * Mask Aadhaar number (show only last 4 digits)
   */
  private maskAadhaarNumber(aadhaarNumber: string): string {
    const lastFour = aadhaarNumber.slice(-4);
    return `XXXX-XXXX-${lastFour}`;
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
  private determineOutcome(): 'success' | 'invalid' | 'mismatch' | 'error' {
    const rand = Math.random();
    if (rand < this.errorRate) {
      return 'error';
    } else if (rand < this.errorRate + this.invalidAadhaarRate) {
      return 'invalid';
    } else if (rand < this.errorRate + this.invalidAadhaarRate + this.mismatchRate) {
      return 'mismatch';
    } else {
      return 'success';
    }
  }

  /**
   * Calculate demographic match score
   */
  private calculateDemographicMatch(
    provided: AadhaarVerificationRequest,
    stored: any
  ): {
    name: boolean;
    dob: boolean;
    gender: boolean;
    address: boolean;
    overallScore: number;
  } {
    const nameMatch = this.fuzzyMatch(provided.name, stored.name);
    const dobMatch = provided.dob === stored.dob;
    const genderMatch = !provided.gender || provided.gender === stored.gender;
    
    let addressMatch = true;
    let addressScore = 100;
    
    if (provided.address) {
      const matches: boolean[] = [];
      if (provided.address.pincode) {
        matches.push(provided.address.pincode === stored.address.pincode);
      }
      if (provided.address.state) {
        matches.push(
          provided.address.state.toLowerCase() === stored.address.state.toLowerCase()
        );
      }
      if (provided.address.city) {
        matches.push(
          provided.address.city.toLowerCase() === stored.address.city.toLowerCase()
        );
      }
      
      if (matches.length > 0) {
        addressScore = (matches.filter(Boolean).length / matches.length) * 100;
        addressMatch = addressScore >= 50;
      }
    }

    const scores = [
      nameMatch ? 100 : 0,
      dobMatch ? 100 : 0,
      genderMatch ? 100 : 0,
      addressScore,
    ];

    const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    return {
      name: nameMatch,
      dob: dobMatch,
      gender: genderMatch,
      address: addressMatch,
      overallScore,
    };
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
   * Generate mock holder data
   */
  private generateMockHolderData(request: AadhaarVerificationRequest): any {
    return {
      name: request.name,
      dob: request.dob,
      gender: request.gender || 'M',
      address: {
        line1: request.address?.line1 || '123, Sample Street',
        line2: request.address?.line2 || 'Near City Center',
        city: request.address?.city || 'Mumbai',
        state: request.address?.state || 'Maharashtra',
        pincode: request.address?.pincode || '400001',
      },
    };
  }

  /**
   * Verify Aadhaar details (mock implementation)
   */
  async verifyAadhaar(
    request: AadhaarVerificationRequest
  ): Promise<AadhaarVerificationResponse> {
    logger.info('Aadhaar mock verification started', {
      aadhaarNumber: this.maskAadhaarNumber(request.aadhaarNumber),
    });

    // Validate Aadhaar number format
    if (!/^\d{12}$/.test(request.aadhaarNumber)) {
      logger.warn('Aadhaar mock: Invalid format');
      return {
        status: 'FAILED',
        error: {
          code: 'INVALID_FORMAT',
          message: 'Aadhaar number must be 12 digits',
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Validate using Verhoeff algorithm
    if (!this.validateVerhoeff(request.aadhaarNumber)) {
      logger.warn('Aadhaar mock: Invalid Aadhaar number (Verhoeff check failed)');
      return {
        status: 'FAILED',
        error: {
          code: 'INVALID_AADHAAR',
          message: 'Invalid Aadhaar number',
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Simulate network delay
    await this.simulateDelay();

    const outcome = this.determineOutcome();

    // Handle error scenario
    if (outcome === 'error') {
      logger.warn('Aadhaar mock: System error simulated');
      return {
        status: 'ERROR',
        error: {
          code: 'UIDAI_UNAVAILABLE',
          message: 'UIDAI service temporarily unavailable',
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Handle invalid Aadhaar scenario
    if (outcome === 'invalid') {
      logger.warn('Aadhaar mock: Aadhaar not found in database');
      return {
        status: 'FAILED',
        error: {
          code: 'AADHAAR_NOT_FOUND',
          message: 'Aadhaar number not found in UIDAI database',
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Generate mock holder data
    const storedData = this.generateMockHolderData(request);

    // Calculate demographic match
    const demographicMatch = this.calculateDemographicMatch(request, storedData);

    // Handle mismatch scenario
    if (outcome === 'mismatch') {
      logger.warn('Aadhaar mock: Demographic mismatch');
      // Artificially reduce match scores for mismatch scenario
      demographicMatch.name = false;
      demographicMatch.overallScore = Math.floor(Math.random() * 40) + 30; // 30-70%
      
      return {
        status: 'FAILED',
        verified: false,
        aadhaarNumber: this.maskAadhaarNumber(request.aadhaarNumber),
        demographicMatch,
        error: {
          code: 'DEMOGRAPHIC_MISMATCH',
          message: 'Provided demographic details do not match Aadhaar records',
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Success scenario
    logger.info('Aadhaar mock: Verification successful');
    return {
      status: 'SUCCESS',
      verified: true,
      aadhaarNumber: this.maskAadhaarNumber(request.aadhaarNumber),
      demographicMatch,
      holder: storedData,
      verificationId: `UIDAI-VER-${new Date().getFullYear()}-${Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase()}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check UIDAI service availability (mock)
   */
  async checkAvailability(): Promise<boolean> {
    // 97% uptime simulation
    return Math.random() < 0.97;
  }

  /**
   * Validate Aadhaar number format only (without full verification)
   */
  validateAadhaarFormat(aadhaarNumber: string): {
    valid: boolean;
    error?: string;
  } {
    if (!aadhaarNumber) {
      return { valid: false, error: 'Aadhaar number is required' };
    }

    if (!/^\d{12}$/.test(aadhaarNumber)) {
      return { valid: false, error: 'Aadhaar number must be 12 digits' };
    }

    if (!this.validateVerhoeff(aadhaarNumber)) {
      return { valid: false, error: 'Invalid Aadhaar number (checksum failed)' };
    }

    return { valid: true };
  }
}

export default new AadhaarMockService();