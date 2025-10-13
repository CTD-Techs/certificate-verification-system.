# AWS Setup Guide for Real Document Processing

This guide explains how to configure real AWS Textract and Bedrock services for document extraction while keeping verification services as mock.

## Overview

The system uses:
- ✅ **REAL AWS Textract** - For OCR and text extraction from documents
- ✅ **REAL AWS Bedrock (Claude)** - For intelligent field extraction from OCR text
- ⚠️ **MOCK Verification Services** - Aadhaar and PAN verification remain mocked

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured (optional but recommended)
3. **Valid AWS Credentials** (Access Key ID and Secret Access Key)

## Step 1: AWS IAM Setup

### Create IAM User

1. Log in to AWS Console
2. Navigate to IAM → Users → Create User
3. User name: `certificate-verification-app`
4. Enable "Programmatic access"

### Attach Permissions

Create a custom policy with the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3BucketAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::certificate-verification-documents",
        "arn:aws:s3:::certificate-verification-documents/*"
      ]
    },
    {
      "Sid": "TextractAccess",
      "Effect": "Allow",
      "Action": [
        "textract:DetectDocumentText",
        "textract:AnalyzeDocument"
      ],
      "Resource": "*"
    },
    {
      "Sid": "BedrockAccess",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:ap-south-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
    }
  ]
}
```

### Save Credentials

After creating the user, save the:
- **Access Key ID**
- **Secret Access Key**

⚠️ **Important**: Store these securely. You won't be able to view the secret key again.

## Step 2: Create S3 Bucket

### Using AWS Console

1. Navigate to S3 → Create Bucket
2. Bucket name: `certificate-verification-documents`
3. Region: `ap-south-1` (Mumbai)
4. Block all public access: ✅ Enabled
5. Bucket versioning: Optional
6. Encryption: Enable (recommended)

### Using AWS CLI

```bash
aws s3 mb s3://certificate-verification-documents --region ap-south-1
```

## Step 3: Enable Bedrock Model Access

1. Navigate to AWS Bedrock Console
2. Go to "Model access" in the left sidebar
3. Click "Manage model access"
4. Find "Anthropic Claude 3.5 Sonnet v2"
5. Enable access to the model
6. Wait for approval (usually instant)

## Step 4: Configure Backend Environment

Update [`backend/.env`](backend/.env):

```env
# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=certificate-verification-documents

# AWS Textract Configuration
AWS_TEXTRACT_ENABLED=true
AWS_TEXTRACT_MOCK_MODE=false

# AWS Bedrock Configuration
AWS_BEDROCK_ENABLED=true
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
AWS_BEDROCK_MOCK_MODE=false
```

⚠️ **Security Note**: Never commit real AWS credentials to version control!

## Step 5: Verify Configuration

### Check Services Status

The services will log their initialization status:

```
TextractService initialized { region: 'ap-south-1', mockMode: false, enabled: true }
BedrockService initialized { region: 'ap-south-1', modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0', mockMode: false, enabled: true }
```

### Test Document Upload

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Upload a test Aadhaar or PAN document through the API
3. Check logs for AWS service calls
4. Verify extracted fields in the response

## Cost Estimation

### AWS Textract
- **DetectDocumentText**: $1.50 per 1,000 pages
- Typical document: ~$0.0015 per page

### AWS Bedrock (Claude 3.5 Sonnet)
- **Input tokens**: $3.00 per million tokens
- **Output tokens**: $15.00 per million tokens
- Typical extraction: ~$0.001-0.005 per document

### S3 Storage
- **Storage**: $0.023 per GB/month
- **PUT requests**: $0.005 per 1,000 requests
- **GET requests**: $0.0004 per 1,000 requests

**Estimated cost for 1,000 documents/month**: ~$5-10 USD

## Troubleshooting

### Error: "Access Denied" for Textract

**Solution**: Verify IAM permissions include `textract:DetectDocumentText`

### Error: "Access Denied" for Bedrock

**Solution**: 
1. Check model access is enabled in Bedrock console
2. Verify IAM permissions for `bedrock:InvokeModel`
3. Ensure correct model ARN in permissions

### Error: "Bucket does not exist"

**Solution**: 
1. Create S3 bucket in `ap-south-1` region
2. Verify bucket name matches `.env` configuration

### Error: "Invalid credentials"

**Solution**:
1. Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are correct
2. Check credentials haven't expired
3. Ensure IAM user is active

### Services still using mock mode

**Solution**:
1. Verify `.env` has `AWS_TEXTRACT_MOCK_MODE=false`
2. Verify `.env` has `AWS_BEDROCK_MOCK_MODE=false`
3. Restart the backend server after changes

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate credentials** regularly
4. **Use IAM roles** when deploying to EC2/ECS (preferred over access keys)
5. **Enable CloudTrail** for audit logging
6. **Set up billing alerts** to monitor costs
7. **Use least privilege** principle for IAM permissions

## Switching Back to Mock Mode

To disable real AWS services and use mock mode:

```env
AWS_TEXTRACT_MOCK_MODE=true
AWS_BEDROCK_MOCK_MODE=true
```

Restart the backend server for changes to take effect.

## Verification Services (Still Mock)

The following services remain as mock implementations:
- ✅ Aadhaar verification via UIDAI
- ✅ PAN verification via NSDL
- ✅ DigiLocker integration
- ✅ CBSE portal verification

These can be enabled separately when real API access is available.

## Support

For issues or questions:
1. Check application logs in `backend/logs/`
2. Review AWS CloudWatch logs
3. Verify IAM permissions
4. Check AWS service quotas and limits

## Additional Resources

- [AWS Textract Documentation](https://docs.aws.amazon.com/textract/)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)