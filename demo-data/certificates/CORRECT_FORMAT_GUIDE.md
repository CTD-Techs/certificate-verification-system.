# Certificate JSON Format Guide

## ⚠️ Important: Correct JSON Structure

The backend validation expects a **specific structure** for certificate uploads. This guide explains the correct format.

## Problem with Original Sample Files

The original sample files (`cbse-10th-verified.json`, etc.) have **incorrect field names and structure** that don't match the backend validator. This causes "invalid data" errors when uploading.

### Common Issues:
1. ❌ `qrCodeData` → ✅ Should be `qrCode`
2. ❌ `school` as string → ✅ Should be object with `name` and `code`
3. ❌ `subjects` in metadata → ✅ Should be at root level with specific structure
4. ❌ Extra fields at root → ✅ Should be in `metadata` object

## Correct JSON Structure

### Required Fields

```json
{
  "certificateType": "SCHOOL_CERTIFICATE | DEGREE | DIPLOMA | MARKSHEET | OTHER",
  "issuerType": "CBSE | STATE_BOARD | UNIVERSITY | PROFESSIONAL_BODY | OTHER",
  "studentName": "string (1-200 chars)",
  "rollNumber": "string (1-50 chars)",
  "examYear": "string (4 digits, e.g., '2023')",
  "issueDate": "string (YYYY-MM-DD format)",
  "issuerName": "string (1-200 chars)"
}
```

### Optional Fields

```json
{
  "school": {
    "name": "string (1-200 chars)",
    "code": "string (1-50 chars)"
  },
  "subjects": [
    {
      "name": "string (1-100 chars)",
      "marks": "number (0-100)",
      "maxMarks": "number (0-100)",
      "grade": "string (max 10 chars, optional)"
    }
  ],
  "qrCode": "string (optional)",
  "digitalSignature": "string (optional)",
  "metadata": {
    // Any additional data as key-value pairs
  }
}
```

## Complete Working Example

See [`cbse-10th-verified-corrected.json`](cbse-10th-verified-corrected.json) for a complete working example.

```json
{
  "certificateType": "SCHOOL_CERTIFICATE",
  "issuerType": "CBSE",
  "studentName": "Rahul Sharma",
  "rollNumber": "1234567",
  "examYear": "2023",
  "issueDate": "2023-06-20",
  "issuerName": "Central Board of Secondary Education",
  "school": {
    "name": "Delhi Public School, New Delhi",
    "code": "DPS001"
  },
  "subjects": [
    {
      "name": "Mathematics",
      "marks": 95,
      "maxMarks": 100,
      "grade": "A1"
    }
  ],
  "qrCode": "https://digilocker.gov.in/verify/CBSE/2023/10TH/001234",
  "digitalSignature": "c2lnbmF0dXJlX0NCU0UvMjAyMy8xMFRILzAwMTIzNA==",
  "metadata": {
    "dateOfBirth": "2007-05-15",
    "grade": "10th",
    "board": "CBSE",
    "registrationNumber": "CBSE/2023/10TH/001234",
    "totalMarks": 458,
    "percentage": 91.6,
    "result": "PASS",
    "division": "FIRST"
  }
}
```

## Field Validation Rules

### certificateType
- Must be one of: `SCHOOL_CERTIFICATE`, `DEGREE`, `DIPLOMA`, `MARKSHEET`, `OTHER`

### issuerType
- Must be one of: `CBSE`, `STATE_BOARD`, `UNIVERSITY`, `PROFESSIONAL_BODY`, `OTHER`

### examYear
- Must be exactly 4 digits (e.g., "2023")
- Validated with regex: `^\d{4}$`

### issueDate
- Must be in YYYY-MM-DD format (e.g., "2023-06-20")
- Validated with regex: `^\d{4}-\d{2}-\d{2}$`

### school (optional)
- If provided, must have both `name` and `code` properties
- `name`: 1-200 characters
- `code`: 1-50 characters

### subjects (optional)
- Array of subject objects
- Each subject must have:
  - `name`: 1-100 characters
  - `marks`: number between 0-100
  - `maxMarks`: number between 0-100
  - `grade`: optional, max 10 characters

## How to Use

1. **Copy the corrected format** from `cbse-10th-verified-corrected.json`
2. **Modify the values** to match your certificate data
3. **Keep the structure intact** - don't change field names
4. **Upload via the frontend** or API

## Testing Your JSON

Before uploading, verify:
- ✅ All required fields are present
- ✅ Field names match exactly (case-sensitive)
- ✅ `examYear` is 4 digits as a string
- ✅ `issueDate` is in YYYY-MM-DD format
- ✅ `certificateType` and `issuerType` use valid enum values
- ✅ If `school` is provided, it has both `name` and `code`
- ✅ If `subjects` is provided, each has required fields

## Common Errors and Solutions

### Error: "Invalid data"
**Cause**: Field names don't match validator expectations
**Solution**: Use exact field names from this guide

### Error: "Invalid year format"
**Cause**: `examYear` is not 4 digits or is a number instead of string
**Solution**: Use string format: `"2023"` not `2023`

### Error: "Invalid date format"
**Cause**: `issueDate` is not in YYYY-MM-DD format
**Solution**: Use format: `"2023-06-20"`

### Error: Validation fails on school
**Cause**: `school` is a string instead of object
**Solution**: Use object format: `{"name": "...", "code": "..."}`

## Backend Validator Reference

The validation is defined in [`backend/src/validators/certificate.validator.ts`](../../backend/src/validators/certificate.validator.ts).

The validator uses Zod schema validation and expects the structure documented in this guide.