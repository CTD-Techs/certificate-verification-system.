import { AadhaarFields, PANFields } from '../aws/bedrock.service';
import logger from '../../utils/logger';

/**
 * PAN-Aadhaar Matching Service
 * Compares PAN and Aadhaar card data to verify identity consistency
 */
export class PANAadhaarMatcherService {
  /**
   * Match PAN and Aadhaar data
   * @param panFields - Extracted PAN card fields
   * @param aadhaarFields - Extracted Aadhaar card fields
   * @returns Match result with confidence score
   */
  matchDocuments(panFields: PANFields, aadhaarFields: AadhaarFields): MatchResult {
    logger.info('Starting PAN-Aadhaar matching', { panFields, aadhaarFields });

    const matches: FieldMatch[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // Match Name (Weight: 40%)
    const nameMatch = this.matchNames(panFields.name, aadhaarFields.name);
    matches.push(nameMatch);
    totalScore += nameMatch.score * 0.4;
    maxScore += 0.4;

    // Match Father's Name (Weight: 30%)
    const fatherNameMatch = this.matchNames(panFields.fatherName, aadhaarFields.fatherName);
    matches.push(fatherNameMatch);
    totalScore += fatherNameMatch.score * 0.3;
    maxScore += 0.3;

    // Match Date of Birth (Weight: 30%)
    const dobMatch = this.matchDOB(panFields.dateOfBirth, aadhaarFields.dateOfBirth);
    matches.push(dobMatch);
    totalScore += dobMatch.score * 0.3;
    maxScore += 0.3;

    // Calculate overall match confidence
    const matchConfidence = maxScore > 0 ? totalScore / maxScore : 0;

    // Determine match status
    let matchStatus: 'matched' | 'partial' | 'not_matched';
    if (matchConfidence >= 0.85) {
      matchStatus = 'matched';
    } else if (matchConfidence >= 0.6) {
      matchStatus = 'partial';
    } else {
      matchStatus = 'not_matched';
    }

    const result: MatchResult = {
      matchStatus,
      matchConfidence: Math.round(matchConfidence * 100) / 100,
      fieldMatches: matches,
      summary: this.generateMatchSummary(matches, matchStatus, matchConfidence),
    };

    logger.info('PAN-Aadhaar matching completed', {
      matchStatus,
      matchConfidence: result.matchConfidence,
    });

    return result;
  }

  /**
   * Match two names using fuzzy matching
   */
  private matchNames(name1: string | null, name2: string | null): FieldMatch {
    if (!name1 || !name2) {
      return {
        field: name1 ? 'name' : 'fatherName',
        value1: name1,
        value2: name2,
        score: 0,
        matched: false,
        reason: 'One or both names are missing',
      };
    }

    // Normalize names
    const normalized1 = this.normalizeName(name1);
    const normalized2 = this.normalizeName(name2);

    // Exact match
    if (normalized1 === normalized2) {
      return {
        field: 'name',
        value1: name1,
        value2: name2,
        score: 1.0,
        matched: true,
        reason: 'Exact match',
      };
    }

    // Calculate similarity using Levenshtein distance
    const similarity = this.calculateStringSimilarity(normalized1, normalized2);

    // Consider it a match if similarity is above 80%
    const matched = similarity >= 0.8;

    return {
      field: 'name',
      value1: name1,
      value2: name2,
      score: similarity,
      matched,
      reason: matched
        ? `High similarity (${Math.round(similarity * 100)}%)`
        : `Low similarity (${Math.round(similarity * 100)}%)`,
    };
  }

  /**
   * Match dates of birth
   */
  private matchDOB(dob1: string | null, dob2: string | null): FieldMatch {
    if (!dob1 || !dob2) {
      return {
        field: 'dateOfBirth',
        value1: dob1,
        value2: dob2,
        score: 0,
        matched: false,
        reason: 'One or both dates are missing',
      };
    }

    // Normalize dates (remove spaces, convert to same format)
    const normalized1 = dob1.replace(/\s/g, '');
    const normalized2 = dob2.replace(/\s/g, '');

    // Exact match
    if (normalized1 === normalized2) {
      return {
        field: 'dateOfBirth',
        value1: dob1,
        value2: dob2,
        score: 1.0,
        matched: true,
        reason: 'Exact match',
      };
    }

    // Try to parse and compare dates
    const date1 = this.parseDate(normalized1);
    const date2 = this.parseDate(normalized2);

    if (date1 && date2) {
      const dayMatch = date1.day === date2.day;
      const monthMatch = date1.month === date2.month;
      const yearMatch = date1.year === date2.year;

      if (dayMatch && monthMatch && yearMatch) {
        return {
          field: 'dateOfBirth',
          value1: dob1,
          value2: dob2,
          score: 1.0,
          matched: true,
          reason: 'Dates match',
        };
      }

      // Partial match (e.g., month and year match but day is off by 1-2)
      if (monthMatch && yearMatch && Math.abs(date1.day - date2.day) <= 2) {
        return {
          field: 'dateOfBirth',
          value1: dob1,
          value2: dob2,
          score: 0.9,
          matched: true,
          reason: 'Dates very close (possible OCR error)',
        };
      }
    }

    return {
      field: 'dateOfBirth',
      value1: dob1,
      value2: dob2,
      score: 0,
      matched: false,
      reason: 'Dates do not match',
    };
  }

  /**
   * Normalize name for comparison
   */
  private normalizeName(name: string): string {
    return name
      .toUpperCase()
      .replace(/[^A-Z\s]/g, '') // Remove non-alphabetic characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
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
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Parse date string (DD/MM/YYYY)
   */
  private parseDate(dateString: string): { day: number; month: number; year: number } | null {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateString.match(regex);

    if (!match) {
      return null;
    }

    return {
      day: parseInt(match[1], 10),
      month: parseInt(match[2], 10),
      year: parseInt(match[3], 10),
    };
  }

  /**
   * Generate match summary
   */
  private generateMatchSummary(
    matches: FieldMatch[],
    status: string,
    confidence: number
  ): string {
    const matchedFields = matches.filter((m) => m.matched).length;
    const totalFields = matches.length;

    let summary = `Match Status: ${status.toUpperCase()}\n`;
    summary += `Overall Confidence: ${Math.round(confidence * 100)}%\n`;
    summary += `Matched Fields: ${matchedFields}/${totalFields}\n\n`;

    summary += 'Field Details:\n';
    matches.forEach((match) => {
      const status = match.matched ? '✓' : '✗';
      summary += `${status} ${match.field}: ${match.reason}\n`;
    });

    return summary;
  }
}

// Types

export interface MatchResult {
  matchStatus: 'matched' | 'partial' | 'not_matched';
  matchConfidence: number;
  fieldMatches: FieldMatch[];
  summary: string;
}

export interface FieldMatch {
  field: string;
  value1: string | null;
  value2: string | null;
  score: number;
  matched: boolean;
  reason: string;
}

// Export singleton instance
export const panAadhaarMatcherService = new PANAadhaarMatcherService();