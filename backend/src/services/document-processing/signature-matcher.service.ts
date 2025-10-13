import sharp from 'sharp';
import logger from '../../utils/logger';

/**
 * Signature Matching Service
 * Compares signature images from different documents using image similarity algorithms
 */
export class SignatureMatcherService {
  /**
   * Match two signature images
   * @param signature1Buffer - First signature image buffer
   * @param signature2Buffer - Second signature image buffer
   * @returns Match result with confidence score
   */
  async matchSignatures(
    signature1Buffer: Buffer,
    signature2Buffer: Buffer
  ): Promise<SignatureMatchResult> {
    logger.info('Starting signature matching');

    try {
      // Preprocess images
      const processed1 = await this.preprocessSignature(signature1Buffer);
      const processed2 = await this.preprocessSignature(signature2Buffer);

      // Calculate perceptual hash similarity
      const hashSimilarity = await this.calculatePerceptualHashSimilarity(
        processed1,
        processed2
      );

      // Calculate structural similarity (SSIM-like approach)
      const structuralSimilarity = await this.calculateStructuralSimilarity(
        processed1,
        processed2
      );

      // Calculate histogram similarity
      const histogramSimilarity = await this.calculateHistogramSimilarity(
        processed1,
        processed2
      );

      // Weighted average of all similarity metrics
      const overallSimilarity =
        hashSimilarity * 0.4 + structuralSimilarity * 0.4 + histogramSimilarity * 0.2;

      // Determine match status
      let matchStatus: 'matched' | 'partial' | 'not_matched';
      if (overallSimilarity >= 0.8) {
        matchStatus = 'matched';
      } else if (overallSimilarity >= 0.6) {
        matchStatus = 'partial';
      } else {
        matchStatus = 'not_matched';
      }

      const result: SignatureMatchResult = {
        matchStatus,
        matchConfidence: Math.round(overallSimilarity * 100) / 100,
        metrics: {
          perceptualHash: Math.round(hashSimilarity * 100) / 100,
          structural: Math.round(structuralSimilarity * 100) / 100,
          histogram: Math.round(histogramSimilarity * 100) / 100,
        },
        summary: this.generateMatchSummary(matchStatus, overallSimilarity),
      };

      logger.info('Signature matching completed', {
        matchStatus,
        matchConfidence: result.matchConfidence,
      });

      return result;
    } catch (error) {
      logger.error('Error matching signatures', { error });
      throw new Error(
        `Failed to match signatures: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Preprocess signature image for comparison
   * - Convert to grayscale
   * - Resize to standard size
   * - Normalize brightness/contrast
   */
  private async preprocessSignature(imageBuffer: Buffer): Promise<Buffer> {
    return await sharp(imageBuffer)
      .resize(200, 100, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
      .grayscale()
      .normalize()
      .png()
      .toBuffer();
  }

  /**
   * Calculate perceptual hash similarity
   * Uses difference hash (dHash) algorithm
   */
  private async calculatePerceptualHashSimilarity(
    image1: Buffer,
    image2: Buffer
  ): Promise<number> {
    const hash1 = await this.calculatePerceptualHash(image1);
    const hash2 = await this.calculatePerceptualHash(image2);

    // Calculate Hamming distance
    const hammingDistance = this.calculateHammingDistance(hash1, hash2);

    // Convert to similarity score (0 to 1)
    const maxDistance = hash1.length * 8; // 8 bits per byte
    const similarity = 1 - hammingDistance / maxDistance;

    return similarity;
  }

  /**
   * Calculate perceptual hash (dHash)
   */
  private async calculatePerceptualHash(imageBuffer: Buffer): Promise<string> {
    // Resize to 9x8 for dHash
    const { data } = await sharp(imageBuffer)
      .resize(9, 8, { fit: 'fill' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Calculate hash based on horizontal gradients
    let hash = '';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const leftPixel = data[row * 9 + col];
        const rightPixel = data[row * 9 + col + 1];
        hash += leftPixel < rightPixel ? '1' : '0';
      }
    }

    // Convert binary string to hex
    return this.binaryToHex(hash);
  }

  /**
   * Calculate Hamming distance between two hashes
   */
  private calculateHammingDistance(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) {
      throw new Error('Hashes must be the same length');
    }

    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
      const byte1 = parseInt(hash1.substr(i * 2, 2), 16);
      const byte2 = parseInt(hash2.substr(i * 2, 2), 16);
      const xor = byte1 ^ byte2;

      // Count set bits
      let bits = xor;
      while (bits > 0) {
        distance += bits & 1;
        bits >>= 1;
      }
    }

    return distance;
  }

  /**
   * Calculate structural similarity (simplified SSIM)
   */
  private async calculateStructuralSimilarity(
    image1: Buffer,
    image2: Buffer
  ): Promise<number> {
    // Get raw pixel data
    const { data: data1 } = await sharp(image1).raw().toBuffer({ resolveWithObject: true });
    const { data: data2 } = await sharp(image2).raw().toBuffer({ resolveWithObject: true });

    if (data1.length !== data2.length) {
      return 0;
    }

    // Calculate mean and variance
    let sum1 = 0,
      sum2 = 0;
    for (let i = 0; i < data1.length; i++) {
      sum1 += data1[i];
      sum2 += data2[i];
    }
    const mean1 = sum1 / data1.length;
    const mean2 = sum2 / data2.length;

    let variance1 = 0,
      variance2 = 0,
      covariance = 0;
    for (let i = 0; i < data1.length; i++) {
      const diff1 = data1[i] - mean1;
      const diff2 = data2[i] - mean2;
      variance1 += diff1 * diff1;
      variance2 += diff2 * diff2;
      covariance += diff1 * diff2;
    }

    variance1 /= data1.length;
    variance2 /= data2.length;
    covariance /= data1.length;

    // Simplified SSIM formula
    const c1 = 6.5025; // (0.01 * 255)^2
    const c2 = 58.5225; // (0.03 * 255)^2

    const numerator = (2 * mean1 * mean2 + c1) * (2 * covariance + c2);
    const denominator =
      (mean1 * mean1 + mean2 * mean2 + c1) * (variance1 + variance2 + c2);

    const ssim = numerator / denominator;

    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, (ssim + 1) / 2));
  }

  /**
   * Calculate histogram similarity
   */
  private async calculateHistogramSimilarity(
    image1: Buffer,
    image2: Buffer
  ): Promise<number> {
    const histogram1 = await this.calculateHistogram(image1);
    const histogram2 = await this.calculateHistogram(image2);

    // Calculate correlation coefficient
    let sum1 = 0,
      sum2 = 0,
      sum1Sq = 0,
      sum2Sq = 0,
      pSum = 0;

    for (let i = 0; i < histogram1.length; i++) {
      sum1 += histogram1[i];
      sum2 += histogram2[i];
      sum1Sq += histogram1[i] * histogram1[i];
      sum2Sq += histogram2[i] * histogram2[i];
      pSum += histogram1[i] * histogram2[i];
    }

    const n = histogram1.length;
    const numerator = pSum - (sum1 * sum2) / n;
    const denominator = Math.sqrt(
      (sum1Sq - (sum1 * sum1) / n) * (sum2Sq - (sum2 * sum2) / n)
    );

    if (denominator === 0) {
      return 0;
    }

    const correlation = numerator / denominator;

    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, (correlation + 1) / 2));
  }

  /**
   * Calculate image histogram
   */
  private async calculateHistogram(imageBuffer: Buffer): Promise<number[]> {
    const { data } = await sharp(imageBuffer).raw().toBuffer({ resolveWithObject: true });

    const histogram = new Array(256).fill(0);

    for (let i = 0; i < data.length; i++) {
      histogram[data[i]]++;
    }

    // Normalize histogram
    const total = data.length;
    return histogram.map((count) => count / total);
  }

  /**
   * Convert binary string to hex
   */
  private binaryToHex(binary: string): string {
    let hex = '';
    for (let i = 0; i < binary.length; i += 4) {
      const chunk = binary.substr(i, 4);
      hex += parseInt(chunk, 2).toString(16);
    }
    return hex;
  }

  /**
   * Generate match summary
   */
  private generateMatchSummary(status: string, confidence: number): string {
    let summary = `Signature Match Status: ${status.toUpperCase()}\n`;
    summary += `Overall Confidence: ${Math.round(confidence * 100)}%\n\n`;

    if (status === 'matched') {
      summary += 'The signatures appear to be from the same person.\n';
      summary += 'High similarity across multiple comparison metrics.';
    } else if (status === 'partial') {
      summary += 'The signatures show some similarities but also differences.\n';
      summary += 'Manual review recommended for final verification.';
    } else {
      summary += 'The signatures appear to be different.\n';
      summary += 'Low similarity across comparison metrics.';
    }

    return summary;
  }
}

// Types

export interface SignatureMatchResult {
  matchStatus: 'matched' | 'partial' | 'not_matched';
  matchConfidence: number;
  metrics: {
    perceptualHash: number;
    structural: number;
    histogram: number;
  };
  summary: string;
}

// Export singleton instance
export const signatureMatcherService = new SignatureMatcherService();