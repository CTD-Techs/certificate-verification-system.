# Configuration Changes Summary

## Overview

This document summarizes the configuration changes made to enable real AWS Textract and Bedrock services for document processing while keeping verification services as mock.

## Changes Made

### 1. Backend Environment Variables (`backend/.env`)

**Changed:**
```diff
# AWS Textract Configuration
AWS_TEXTRACT_ENABLED=true
- AWS_TEXTRACT_MOCK_MODE=true
+ AWS_TEXTRACT_MOCK_MODE=false

# AWS Bedrock Configuration
AWS_BEDROCK_ENABLED=true
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
- AWS_BEDROCK_MOCK_MODE=true
+ AWS_BEDROCK_MOCK_MODE=false
```

**Status:** ✅ Mock mode disabled for Textract and Bedrock

### 2. Backend Configuration (`backend/src/config/index.ts`)

**Added AWS configuration section:**
```typescript
// AWS Configuration
aws: {
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  s3Bucket: process.env.AWS_S3_BUCKET || 'certificate-verification-documents',
  textract: {
    enabled: process.env.AWS_TEXTRACT_ENABLED === 'true',
    mockMode: process.env.AWS_TEXTRACT_MOCK_MODE === 'true',
  },
  bedrock: {
    enabled: process.env.AWS_BEDROCK_ENABLED === 'true',
    modelId: process.env.AWS_BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    mockMode: process.env.AWS_BEDROCK_MOCK_MODE === 'true',
  },
},
```

**Status:** ✅ Configuration structure added

### 3. Environment Example (`backend/.env.example`)

**Added AWS configuration template:**
```env
# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET=certificate-verification-documents

# AWS Textract Configuration
AWS_TEXTRACT_ENABLED=true
AWS_TEXTRACT_MOCK_MODE=false

# AWS Bedrock Configuration
AWS_BEDROCK_ENABLED=true
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
AWS_BEDROCK_MOCK_MODE=false
```

**Status:** ✅ Template updated for new developers

### 4. Documentation

**Created:**
- [`AWS_SETUP_GUIDE.md`](AWS_SETUP_GUIDE.md) - Comprehensive AWS setup instructions

**Updated:**
- [`README.md`](README.md) - Added AWS setup section and reference to guide

**Status:** ✅ Documentation complete

## Service Status

| Service | Mode | Status |
|---------|------|--------|
| **AWS Textract** | Real | ✅ Enabled |
| **AWS Bedrock (Claude)** | Real | ✅ Enabled |
| **Aadhaar Verification** | Mock | ⚠️ Remains Mock |
| **PAN Verification** | Mock | ⚠️ Remains Mock |
| **DigiLocker** | Mock | ⚠️ Remains Mock |
| **CBSE Portal** | Mock | ⚠️ Remains Mock |

## Required Actions

### Before Using Real AWS Services

1. **Set up AWS Account**
   - Create IAM user with appropriate permissions
   - Generate access key and secret key

2. **Create S3 Bucket**
   - Bucket name: `certificate-verification-documents`
   - Region: `ap-south-1` (Mumbai)
   - Enable encryption

3. **Enable Bedrock Model Access**
   - Navigate to AWS Bedrock Console
   - Enable access to Claude 3.5 Sonnet v2

4. **Update Environment Variables**
   - Replace `your_access_key_here` with actual AWS Access Key ID
   - Replace `your_secret_key_here` with actual AWS Secret Access Key

5. **Restart Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

### Verification

After configuration, verify the setup:

1. **Check logs** for service initialization:
   ```
   TextractService initialized { region: 'ap-south-1', mockMode: false, enabled: true }
   BedrockService initialized { region: 'ap-south-1', modelId: '...', mockMode: false, enabled: true }
   ```

2. **Test document upload** through the API
3. **Verify AWS API calls** in CloudWatch logs
4. **Check extracted fields** in response

## Cost Implications

### Estimated Costs (per 1,000 documents)

- **AWS Textract**: ~$1.50
- **AWS Bedrock (Claude)**: ~$1-5
- **S3 Storage**: ~$0.02
- **Total**: ~$3-7 per 1,000 documents

### Cost Optimization

- Use S3 lifecycle policies to archive old documents
- Implement caching for repeated document processing
- Monitor usage with AWS Cost Explorer
- Set up billing alerts

## Rollback Instructions

To revert to mock mode:

1. **Update `backend/.env`:**
   ```env
   AWS_TEXTRACT_MOCK_MODE=true
   AWS_BEDROCK_MOCK_MODE=true
   ```

2. **Restart backend server**

3. **Verify mock mode** in logs:
   ```
   Mock: Text extracted from document
   Mock: Extracting Aadhaar fields
   ```

## Security Considerations

⚠️ **Important Security Notes:**

1. **Never commit AWS credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate credentials** regularly (every 90 days)
4. **Use IAM roles** when deploying to EC2/ECS (preferred over access keys)
5. **Enable CloudTrail** for audit logging
6. **Set up billing alerts** to monitor costs
7. **Use least privilege** principle for IAM permissions

## Troubleshooting

### Common Issues

1. **"Access Denied" errors**
   - Verify IAM permissions
   - Check AWS credentials are correct
   - Ensure Bedrock model access is enabled

2. **"Bucket does not exist"**
   - Create S3 bucket in correct region
   - Verify bucket name matches configuration

3. **Services still using mock mode**
   - Verify `.env` has `MOCK_MODE=false`
   - Restart backend server
   - Check logs for initialization messages

### Support Resources

- [AWS_SETUP_GUIDE.md](AWS_SETUP_GUIDE.md) - Detailed setup instructions
- [AWS Textract Documentation](https://docs.aws.amazon.com/textract/)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)

## Next Steps

1. ✅ Configuration changes complete
2. ⏳ Set up AWS account and services
3. ⏳ Update credentials in `.env`
4. ⏳ Test document processing
5. ⏳ Monitor costs and performance

---

**Last Updated:** 2025-10-13  
**Configuration Version:** 1.0  
**Status:** Ready for AWS Setup