import logger from '../../utils/logger';
import config from '../../config';
import { VerificationResult, VerificationStatus } from '../../models';

export interface NotificationPayload {
  verificationId: string;
  certificateId: string;
  status: VerificationStatus;
  result?: VerificationResult;
  confidenceScore?: number;
  recipientEmail?: string;
  webhookUrl?: string;
}

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export interface WebhookNotification {
  url: string;
  payload: any;
  headers?: Record<string, string>;
}

/**
 * Mock notification service for sending emails and webhooks
 */
class NotificationService {
  /**
   * Send verification completion notification
   */
  async sendVerificationComplete(payload: NotificationPayload): Promise<void> {
    logger.info('Sending verification completion notification', {
      verificationId: payload.verificationId,
      status: payload.status,
      result: payload.result,
    });

    // Send email notification if recipient provided
    if (payload.recipientEmail) {
      await this.sendEmail({
        to: payload.recipientEmail,
        subject: this.getEmailSubject(payload),
        body: this.getEmailBody(payload),
        html: this.getEmailHtml(payload),
      });
    }

    // Send webhook notification if URL provided
    if (payload.webhookUrl) {
      await this.sendWebhook({
        url: payload.webhookUrl,
        payload: {
          event: 'verification.completed',
          data: {
            verificationId: payload.verificationId,
            certificateId: payload.certificateId,
            status: payload.status,
            result: payload.result,
            confidenceScore: payload.confidenceScore,
            timestamp: new Date().toISOString(),
          },
        },
      });
    }
  }

  /**
   * Send manual review notification
   */
  async sendManualReviewRequired(payload: NotificationPayload): Promise<void> {
    logger.info('Sending manual review notification', {
      verificationId: payload.verificationId,
    });

    if (payload.recipientEmail) {
      await this.sendEmail({
        to: payload.recipientEmail,
        subject: 'Certificate Verification - Manual Review Required',
        body: `Your certificate verification (ID: ${payload.verificationId}) requires manual review. You will be notified once the review is complete.`,
      });
    }

    if (payload.webhookUrl) {
      await this.sendWebhook({
        url: payload.webhookUrl,
        payload: {
          event: 'verification.manual_review_required',
          data: {
            verificationId: payload.verificationId,
            certificateId: payload.certificateId,
            confidenceScore: payload.confidenceScore,
            timestamp: new Date().toISOString(),
          },
        },
      });
    }
  }

  /**
   * Send email notification (mock)
   */
  private async sendEmail(notification: EmailNotification): Promise<void> {
    if (config.email.mockMode) {
      logger.info('Mock email sent', {
        to: notification.to,
        subject: notification.subject,
      });
      
      // Simulate email sending delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // In mock mode, just log the email
      console.log('\n=== MOCK EMAIL ===');
      console.log(`To: ${notification.to}`);
      console.log(`Subject: ${notification.subject}`);
      console.log(`Body:\n${notification.body}`);
      console.log('==================\n');
    } else {
      // In production, integrate with actual email service (SendGrid, AWS SES, etc.)
      logger.info('Email sent', { to: notification.to });
    }
  }

  /**
   * Send webhook notification (mock)
   */
  private async sendWebhook(notification: WebhookNotification): Promise<void> {
    logger.info('Sending webhook notification', { url: notification.url });

    // Simulate webhook delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (config.email.mockMode) {
      // In mock mode, just log the webhook
      console.log('\n=== MOCK WEBHOOK ===');
      console.log(`URL: ${notification.url}`);
      console.log(`Payload: ${JSON.stringify(notification.payload, null, 2)}`);
      console.log('====================\n');
    } else {
      // In production, make actual HTTP request
      // await axios.post(notification.url, notification.payload, {
      //   headers: notification.headers,
      // });
      logger.info('Webhook sent', { url: notification.url });
    }
  }

  /**
   * Get email subject based on verification result
   */
  private getEmailSubject(payload: NotificationPayload): string {
    if (payload.status === VerificationStatus.COMPLETED) {
      if (payload.result === VerificationResult.VERIFIED) {
        return 'Certificate Verification - VERIFIED';
      } else if (payload.result === VerificationResult.UNVERIFIED) {
        return 'Certificate Verification - UNVERIFIED';
      }
    }
    return 'Certificate Verification - Status Update';
  }

  /**
   * Get email body text
   */
  private getEmailBody(payload: NotificationPayload): string {
    const lines: string[] = [];
    
    lines.push('Certificate Verification Result');
    lines.push('================================');
    lines.push('');
    lines.push(`Verification ID: ${payload.verificationId}`);
    lines.push(`Certificate ID: ${payload.certificateId}`);
    lines.push(`Status: ${payload.status}`);
    
    if (payload.result) {
      lines.push(`Result: ${payload.result}`);
    }
    
    if (payload.confidenceScore !== undefined) {
      lines.push(`Confidence Score: ${payload.confidenceScore}%`);
    }
    
    lines.push('');
    lines.push('Thank you for using our verification service.');
    
    return lines.join('\n');
  }

  /**
   * Get email HTML body
   */
  private getEmailHtml(payload: NotificationPayload): string {
    const resultColor = payload.result === VerificationResult.VERIFIED 
      ? '#28a745' 
      : payload.result === VerificationResult.UNVERIFIED 
      ? '#dc3545' 
      : '#ffc107';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8f9fa; }
          .result { font-size: 24px; font-weight: bold; color: ${resultColor}; margin: 20px 0; }
          .details { background: white; padding: 15px; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Certificate Verification Result</h1>
          </div>
          <div class="content">
            <div class="result">${payload.result || payload.status}</div>
            <div class="details">
              <p><strong>Verification ID:</strong> ${payload.verificationId}</p>
              <p><strong>Certificate ID:</strong> ${payload.certificateId}</p>
              <p><strong>Status:</strong> ${payload.status}</p>
              ${payload.confidenceScore !== undefined ? `<p><strong>Confidence Score:</strong> ${payload.confidenceScore}%</p>` : ''}
            </div>
          </div>
          <div class="footer">
            <p>This is an automated notification from the Certificate Verification System.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new NotificationService();