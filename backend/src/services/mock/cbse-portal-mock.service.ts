import logger from '../../utils/logger';

export interface CBSEPortalResponse {
  found: boolean;
  rollNumber?: string;
  examYear?: string;
  studentName?: string;
  school?: {
    name: string;
    code: string;
  };
  result?: {
    status: 'PASS' | 'FAIL';
    percentage: number;
    subjects: Array<{
      name: string;
      marks: number;
      maxMarks: number;
      grade?: string;
    }>;
  };
  verificationCode?: string;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

class CBSEPortalMockService {
  private readonly responseDelayMin = 1000;
  private readonly responseDelayMax = 4000;
  private readonly portalDownRate = 0.05;
  private readonly recordNotFoundRate = 0.07;

  /**
   * Simulate delay
   */
  private async simulateDelay(): Promise<void> {
    const delay = Math.floor(
      Math.random() * (this.responseDelayMax - this.responseDelayMin) + this.responseDelayMin
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Determine outcome
   */
  private determineOutcome(): 'success' | 'not_found' | 'portal_down' {
    const rand = Math.random();
    if (rand < this.portalDownRate) {
      return 'portal_down';
    } else if (rand < this.portalDownRate + this.recordNotFoundRate) {
      return 'not_found';
    } else {
      return 'success';
    }
  }

  /**
   * Generate mock subjects
   */
  private generateSubjects(): Array<{ name: string; marks: number; maxMarks: number; grade: string }> {
    const subjects = [
      'Mathematics',
      'Physics',
      'Chemistry',
      'English',
      'Computer Science',
    ];

    return subjects.map((name) => {
      const marks = Math.floor(Math.random() * 20) + 80; // 80-100
      return {
        name,
        marks,
        maxMarks: 100,
        grade: marks >= 90 ? 'A+' : marks >= 80 ? 'A' : 'B+',
      };
    });
  }

  /**
   * Verify certificate via CBSE portal (mock)
   */
  async verifyCertificate(
    rollNumber: string,
    examYear: string,
    certificateData: any
  ): Promise<CBSEPortalResponse> {
    logger.info('CBSE portal mock verification started', { rollNumber, examYear });

    // Simulate network delay
    await this.simulateDelay();

    const outcome = this.determineOutcome();

    if (outcome === 'portal_down') {
      logger.warn('CBSE portal mock: Portal unavailable');
      return {
        found: false,
        error: {
          code: 'PORTAL_UNAVAILABLE',
          message: 'CBSE portal is temporarily unavailable',
        },
        timestamp: new Date().toISOString(),
      };
    }

    if (outcome === 'not_found') {
      logger.warn('CBSE portal mock: Record not found');
      return {
        found: false,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Certificate record not found in CBSE database',
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Success response
    const subjects = this.generateSubjects();
    const totalMarks = subjects.reduce((sum, s) => sum + s.marks, 0);
    const maxMarks = subjects.reduce((sum, s) => sum + s.maxMarks, 0);
    const percentage = (totalMarks / maxMarks) * 100;

    logger.info('CBSE portal mock: Verification successful');
    return {
      found: true,
      rollNumber,
      examYear,
      studentName: certificateData.studentName || 'John Doe',
      school: {
        name: certificateData.school?.name || 'Delhi Public School',
        code: certificateData.school?.code || '1234567',
      },
      result: {
        status: 'PASS',
        percentage: Math.round(percentage * 100) / 100,
        subjects,
      },
      verificationCode: `CBSE-VER-${examYear}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check portal availability
   */
  async checkAvailability(): Promise<boolean> {
    return Math.random() < 0.90; // 90% uptime
  }
}

export default new CBSEPortalMockService();