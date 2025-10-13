# Sample Certificate JSON Files

⚠️ **IMPORTANT**: The original sample files have incorrect JSON structure. Please use the **corrected** versions with `-corrected` suffix.

📖 **See [`CORRECT_FORMAT_GUIDE.md`](CORRECT_FORMAT_GUIDE.md) for detailed format documentation.**

This directory contains sample certificate JSON files for testing the Certificate Verification Mock Demo application.

## Files

### ✅ Corrected Files (Use These)

### 1. cbse-10th-verified-corrected.json
- **Type**: CBSE 10th Grade Certificate
- **Status**: Verified
- **Features**: Has QR code and digital signature
- **Use Case**: Testing successful verification with all security features
- ✅ **Correct format** - matches backend validator

### 2. cbse-12th-verified-corrected.json
- **Type**: CBSE 12th Grade Certificate
- **Status**: Verified
- **Features**: Has QR code and digital signature
- **Use Case**: Testing successful verification for higher secondary certificates
- ✅ **Correct format** - matches backend validator

### 3. university-degree-corrected.json
- **Type**: University Degree (B.Com)
- **Status**: Verified
- **Features**: Has digital signature
- **Use Case**: Testing university degree verification
- ✅ **Correct format** - matches backend validator

### 4. diploma-corrected.json
- **Type**: Diploma Certificate
- **Status**: Verified
- **Features**: Complete subject details
- **Use Case**: Testing diploma verification
- ✅ **Correct format** - matches backend validator

### ❌ Original Files (Incorrect - Do Not Use)

The following files have **incorrect JSON structure** and will fail validation:
- `cbse-10th-verified.json` ❌
- `cbse-12th-verified.json` ❌
- `university-degree-pending.json` ❌
- `diploma-unverified.json` ❌
- `school-certificate-manual-review.json` ❌

**Issues**: Wrong field names (`qrCodeData` vs `qrCode`), incorrect structure for `school` and `subjects`, extra fields at root level.

## Usage

### Upload via API

```bash
# Upload certificate JSON
curl -X POST http://localhost:3000/api/v1/certificates/upload-json \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d @cbse-10th-verified.json
```

### Upload via Frontend

1. Login to the application
2. Navigate to "Upload Certificate"
3. Select "JSON Upload" tab
4. Choose one of these JSON files
5. Click "Upload"

## JSON Structure

⚠️ **See [`CORRECT_FORMAT_GUIDE.md`](CORRECT_FORMAT_GUIDE.md) for complete format documentation.**

### Quick Reference - Correct Structure:

```json
{
  "certificateType": "SCHOOL_CERTIFICATE",
  "issuerType": "CBSE",
  "studentName": "Student Name",
  "rollNumber": "123456",
  "examYear": "2023",
  "issueDate": "2023-06-20",
  "issuerName": "Issuing Authority",
  "school": {
    "name": "School Name",
    "code": "SCH001"
  },
  "subjects": [
    {
      "name": "Mathematics",
      "marks": 95,
      "maxMarks": 100,
      "grade": "A1"
    }
  ],
  "qrCode": "https://example.com/verify",
  "digitalSignature": "base64signature",
  "metadata": {
    // Additional data here
  }
}
```

**Key Points**:
- Use `qrCode` not `qrCodeData`
- `school` must be object with `name` and `code`
- `subjects` at root level, not in metadata
- `examYear` must be 4-digit string
- `issueDate` must be YYYY-MM-DD format

## Testing Scenarios

### Scenario 1: CBSE 10th Certificate
Use `cbse-10th-verified-corrected.json`
- Expected: Certificate verified successfully
- Features: QR code, digital signature, complete subjects
- Confidence Score: High (85-100%)

### Scenario 2: CBSE 12th Certificate
Use `cbse-12th-verified-corrected.json`
- Expected: Certificate verified successfully
- Features: QR code, digital signature, science stream subjects
- Confidence Score: High (85-100%)

### Scenario 3: University Degree
Use `university-degree-corrected.json`
- Expected: Certificate verified successfully
- Features: Digital signature, B.Com degree details
- Confidence Score: Medium-High (70-90%)

### Scenario 4: Diploma Certificate
Use `diploma-corrected.json`
- Expected: Certificate verified successfully
- Features: Complete subject details, DCA diploma
- Confidence Score: Medium (60-80%)

## Notes

- All sample data is fictional and for testing purposes only
- Digital signatures are base64-encoded dummy values
- QR codes point to mock verification URLs
- Adjust the data as needed for your testing scenarios