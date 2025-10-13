import {
  TextractClient,
  DetectDocumentTextCommand,
  Block,
} from '@aws-sdk/client-textract';
import logger from '../../utils/logger';

/**
 * AWS Textract Service for OCR and document text extraction
 * Handles document text detection and confidence scoring
 */
export class TextractService {
  private textractClient: TextractClient;
  private region: string;
  private mockMode: boolean;
  private enabled: boolean;

  constructor() {
    this.region = process.env.AWS_REGION || 'ap-south-1';
    this.mockMode = process.env.AWS_TEXTRACT_MOCK_MODE === 'true';
    this.enabled = process.env.AWS_TEXTRACT_ENABLED === 'true';

    // DIAGNOSTIC LOGGING - Debug environment variables
    console.log('========================================');
    console.log('[TEXTRACT DIAGNOSTIC] Environment Variables:');
    console.log('[TEXTRACT] AWS_REGION:', process.env.AWS_REGION);
    console.log('[TEXTRACT] AWS_TEXTRACT_MOCK_MODE:', process.env.AWS_TEXTRACT_MOCK_MODE);
    console.log('[TEXTRACT] AWS_TEXTRACT_ENABLED:', process.env.AWS_TEXTRACT_ENABLED);
    console.log('[TEXTRACT] AWS_ACCESS_KEY_ID present:', !!process.env.AWS_ACCESS_KEY_ID);
    console.log('[TEXTRACT] AWS_SECRET_ACCESS_KEY present:', !!process.env.AWS_SECRET_ACCESS_KEY);
    console.log('[TEXTRACT] Computed mockMode:', this.mockMode);
    console.log('[TEXTRACT] Computed enabled:', this.enabled);
    console.log('[TEXTRACT] Will use MOCK:', this.mockMode || !this.enabled);
    console.log('========================================');

    // Initialize Textract client
    this.textractClient = new TextractClient({
      region: this.region,
      credentials: this.mockMode
        ? undefined
        : {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
    });

    logger.info('TextractService initialized', {
      region: this.region,
      mockMode: this.mockMode,
      enabled: this.enabled,
    });
  }

  /**
   * Extract text from document using AWS Textract
   * @param imageBuffer - Document image buffer
   * @returns Extracted text and confidence scores
   */
  async extractText(imageBuffer: Buffer): Promise<TextractResult> {
    try {
      if (this.mockMode || !this.enabled) {
        return this.mockExtractText();
      }

      const command = new DetectDocumentTextCommand({
        Document: {
          Bytes: imageBuffer,
        },
      });

      const response = await this.textractClient.send(command);

      if (!response.Blocks || response.Blocks.length === 0) {
        throw new Error('No text detected in document');
      }

      // Process blocks to extract text and confidence
      const result = this.processBlocks(response.Blocks);

      // Log OCR text for debugging
      console.log('[TEXTRACT] Raw OCR text extracted:', result.fullText);
      console.log('[TEXTRACT] OCR text length:', result.fullText.length);
      console.log('[TEXTRACT] Number of lines:', result.lines.length);
      
      logger.info('Text extracted from document', {
        lineCount: result.lines.length,
        wordCount: result.words.length,
        averageConfidence: result.averageConfidence,
        textPreview: result.fullText.substring(0, 200),
      });

      return result;
    } catch (error) {
      logger.error('Error extracting text from document', { error });
      throw new Error(
        `Failed to extract text from document: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Extract text from document stored in S3
   * @param s3Bucket - S3 bucket name
   * @param s3Key - S3 object key
   * @returns Extracted text and confidence scores
   */
  async extractTextFromS3(s3Bucket: string, s3Key: string): Promise<TextractResult> {
    try {
      if (this.mockMode || !this.enabled) {
        return this.mockExtractText();
      }

      const command = new DetectDocumentTextCommand({
        Document: {
          S3Object: {
            Bucket: s3Bucket,
            Name: s3Key,
          },
        },
      });

      const response = await this.textractClient.send(command);

      if (!response.Blocks || response.Blocks.length === 0) {
        throw new Error('No text detected in document');
      }

      const result = this.processBlocks(response.Blocks);

      // Log OCR text for debugging
      console.log('[TEXTRACT] Raw OCR text from S3:', result.fullText);
      console.log('[TEXTRACT] OCR text length:', result.fullText.length);
      console.log('[TEXTRACT] Number of lines:', result.lines.length);

      logger.info('Text extracted from S3 document', {
        s3Bucket,
        s3Key,
        lineCount: result.lines.length,
        wordCount: result.words.length,
        averageConfidence: result.averageConfidence,
        textPreview: result.fullText.substring(0, 200),
      });

      return result;
    } catch (error) {
      logger.error('Error extracting text from S3 document', { error, s3Bucket, s3Key });
      throw new Error(
        `Failed to extract text from S3 document: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Process Textract blocks to extract structured text data
   * @param blocks - Textract blocks from API response
   * @returns Processed text result
   */
  private processBlocks(blocks: Block[]): TextractResult {
    const lines: TextLine[] = [];
    const words: TextWord[] = [];
    let totalConfidence = 0;
    let confidenceCount = 0;

    for (const block of blocks) {
      if (!block.BlockType || !block.Confidence) {
        continue;
      }

      totalConfidence += block.Confidence;
      confidenceCount++;

      if (block.BlockType === 'LINE' && block.Text) {
        lines.push({
          text: block.Text,
          confidence: block.Confidence,
          boundingBox: block.Geometry?.BoundingBox
            ? {
                left: block.Geometry.BoundingBox.Left || 0,
                top: block.Geometry.BoundingBox.Top || 0,
                width: block.Geometry.BoundingBox.Width || 0,
                height: block.Geometry.BoundingBox.Height || 0,
              }
            : undefined,
        });
      }

      if (block.BlockType === 'WORD' && block.Text) {
        words.push({
          text: block.Text,
          confidence: block.Confidence,
          boundingBox: block.Geometry?.BoundingBox
            ? {
                left: block.Geometry.BoundingBox.Left || 0,
                top: block.Geometry.BoundingBox.Top || 0,
                width: block.Geometry.BoundingBox.Width || 0,
                height: block.Geometry.BoundingBox.Height || 0,
              }
            : undefined,
        });
      }
    }

    const averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

    // Combine all text
    const fullText = lines.map((line) => line.text).join('\n');

    return {
      fullText,
      lines,
      words,
      averageConfidence,
      blockCount: blocks.length,
    };
  }

  /**
   * Mock text extraction for local testing
   */
  private mockExtractText(): TextractResult {
    const mockLines: TextLine[] = [
      {
        text: 'GOVERNMENT OF INDIA',
        confidence: 98.5,
        boundingBox: { left: 0.1, top: 0.05, width: 0.8, height: 0.05 },
      },
      {
        text: 'UNIQUE IDENTIFICATION AUTHORITY OF INDIA',
        confidence: 97.8,
        boundingBox: { left: 0.1, top: 0.12, width: 0.8, height: 0.05 },
      },
      {
        text: 'Name: RAJESH KUMAR SHARMA',
        confidence: 96.2,
        boundingBox: { left: 0.1, top: 0.25, width: 0.6, height: 0.04 },
      },
      {
        text: 'DOB: 15/08/1990',
        confidence: 95.5,
        boundingBox: { left: 0.1, top: 0.32, width: 0.4, height: 0.04 },
      },
      {
        text: 'Aadhaar Number: 1234 5678 9012',
        confidence: 97.1,
        boundingBox: { left: 0.1, top: 0.39, width: 0.5, height: 0.04 },
      },
      {
        text: 'Address: 123 Main Street, Mumbai, Maharashtra - 400001',
        confidence: 94.8,
        boundingBox: { left: 0.1, top: 0.46, width: 0.8, height: 0.04 },
      },
    ];

    const mockWords: TextWord[] = [];
    mockLines.forEach((line) => {
      line.text.split(' ').forEach((word) => {
        mockWords.push({
          text: word,
          confidence: line.confidence + (Math.random() * 2 - 1),
          boundingBox: line.boundingBox,
        });
      });
    });

    const fullText = mockLines.map((line) => line.text).join('\n');
    const averageConfidence = mockLines.reduce((sum, line) => sum + line.confidence, 0) / mockLines.length;

    logger.info('Mock: Text extracted from document', {
      lineCount: mockLines.length,
      wordCount: mockWords.length,
      averageConfidence,
    });

    return {
      fullText,
      lines: mockLines,
      words: mockWords,
      averageConfidence,
      blockCount: mockLines.length + mockWords.length,
    };
  }
}

// Types

export interface TextractResult {
  fullText: string;
  lines: TextLine[];
  words: TextWord[];
  averageConfidence: number;
  blockCount: number;
}

export interface TextLine {
  text: string;
  confidence: number;
  boundingBox?: BoundingBox;
}

export interface TextWord {
  text: string;
  confidence: number;
  boundingBox?: BoundingBox;
}

export interface BoundingBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Export singleton instance
export const textractService = new TextractService();