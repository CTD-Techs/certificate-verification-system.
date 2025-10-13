# VeriDoc Certificate Verification System - Architecture & Flow Diagrams

This document contains comprehensive Mermaid.js diagrams illustrating the architecture, data flows, and processes of the VeriDoc Certificate Verification System.

## Table of Contents

1. [System Architecture Diagram](#1-system-architecture-diagram)
2. [Document Upload Flow](#2-document-upload-flow)
3. [Verification Pipeline Flow](#3-verification-pipeline-flow)
4. [Aadhaar Verification Flow](#4-aadhaar-verification-flow)
5. [PAN Verification Flow](#5-pan-verification-flow)
6. [PAN-Aadhaar Matching Flow](#6-pan-aadhaar-matching-flow)
7. [Signature Matching Flow](#7-signature-matching-flow)
8. [Database Schema Diagram](#8-database-schema-diagram)
9. [Authentication Flow](#9-authentication-flow)
10. [Component Architecture](#10-component-architecture)

---

## 1. System Architecture Diagram

This diagram shows the high-level system architecture with all major components and their interactions.

```mermaid
graph TB
    subgraph "Client Layer"
        A[React Frontend<br/>Vite + TypeScript]
    end
    
    subgraph "API Gateway"
        B[Express.js Server<br/>Port 3001]
        B1[Auth Middleware<br/>JWT Validation]
        B2[Rate Limiter]
        B3[CORS Handler]
    end
    
    subgraph "Application Services"
        C[Certificate Service]
        D[Verification Service]
        E[Document Processor]
        F[Auth Service]
        G[Manual Review Service]
        H[Notification Service]
    end
    
    subgraph "AWS Services"
        I[S3 Storage<br/>Document Files]
        J[Textract<br/>OCR Extraction]
        K[Bedrock Claude<br/>Field Extraction]
    end
    
    subgraph "Mock External APIs"
        L[Aadhaar Mock<br/>UIDAI Simulation]
        M[PAN Mock<br/>Income Tax Dept]
        N[DigiLocker Mock]
        O[CBSE Portal Mock]
        P[Forensic Mock]
    end
    
    subgraph "Data Layer"
        Q[(PostgreSQL RDS<br/>Primary Database)]
        R[(Redis Cache<br/>Sessions & Rate Limits)]
    end
    
    A -->|HTTPS/REST| B
    B --> B1
    B1 --> B2
    B2 --> B3
    B3 --> C
    B3 --> D
    B3 --> E
    B3 --> F
    
    C --> Q
    D --> Q
    D --> L
    D --> M
    D --> N
    D --> O
    D --> P
    
    E --> I
    E --> J
    E --> K
    E --> Q
    
    F --> Q
    F --> R
    G --> Q
    H --> Q
    
    style A fill:#e1f5ff
    style B fill:#fff4e6
    style Q fill:#f3e5f5
    style I fill:#e8f5e9
    style J fill:#e8f5e9
    style K fill:#e8f5e9
```

**Description:** The system follows a layered architecture with React frontend, Express.js backend, AWS services for document processing, mock external APIs for verification, and PostgreSQL + Redis for data persistence.

---

## 2. Document Upload Flow

This diagram illustrates the complete document upload and processing pipeline for Aadhaar/PAN cards.

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as Backend API
    participant S3 as AWS S3
    participant TX as AWS Textract
    participant BR as AWS Bedrock
    participant DB as PostgreSQL
    
    U->>F: Upload Document File
    F->>F: Validate File<br/>Type, Size, Format
    
    alt Invalid File
        F-->>U: Show Error Message
    else Valid File
        F->>API: POST /document-processing/aadhaar<br/>multipart/form-data
        
        API->>S3: Upload File
        S3-->>API: S3 Key & URL
        
        API->>TX: Extract Text OCR
        TX-->>API: OCR Result<br/>Lines, Confidence
        
        API->>BR: Extract Fields<br/>Claude AI
        BR-->>API: Structured Fields<br/>Name, Number, DOB
        
        API->>API: Validate Fields<br/>Format Check
        
        API->>DB: Save Processing Result<br/>DocumentProcessing Table
        DB-->>API: Record ID
        
        API-->>F: Processing Complete<br/>Extracted Fields
        F-->>U: Show Review Form<br/>Pre-filled Data
        
        U->>F: Review & Submit
        F->>API: POST /certificates<br/>Create Certificate
        API->>DB: Save Certificate
        DB-->>API: Certificate ID
        API-->>F: Success Response
        F-->>U: Redirect to Verification
    end
```

**Description:** Users upload documents which are stored in S3, processed through Textract for OCR, analyzed by Bedrock for field extraction, validated, and presented for user review before final submission.

---

## 3. Verification Pipeline Flow

This diagram shows the multi-step verification process for educational certificates.

```mermaid
flowchart TD
    Start([Certificate Submitted]) --> CheckType{Certificate<br/>Type?}
    
    CheckType -->|Identity Doc| IdentityFlow[Identity Verification<br/>Aadhaar/PAN]
    CheckType -->|Educational| EduFlow[Educational Verification]
    
    IdentityFlow --> IdentityAPI[Call Identity API<br/>Aadhaar/PAN Mock]
    IdentityAPI --> IdentityResult{Verified?}
    IdentityResult -->|Yes| IdentityConf[High Confidence<br/>Score >= 70]
    IdentityResult -->|No| IdentityLow[Low Confidence<br/>Score < 40]
    IdentityConf --> UpdateCert1[Update Certificate<br/>Status: VERIFIED]
    IdentityLow --> UpdateCert2[Update Certificate<br/>Status: UNVERIFIED]
    
    EduFlow --> HasQR{Has QR Code or<br/>Digital Signature?}
    HasQR -->|Yes| DigiLocker[DigiLocker<br/>Verification]
    HasQR -->|No| Portal[Portal Lookup]
    
    DigiLocker --> Portal
    Portal --> PortalCheck[CBSE/Board<br/>Portal Check]
    PortalCheck --> Forensic[Forensic Analysis<br/>Metadata, Tampering]
    
    Forensic --> OptionalIdentity{Identity Data<br/>Provided?}
    OptionalIdentity -->|Yes| RunIdentity[Verify Aadhaar/PAN]
    OptionalIdentity -->|No| CalcConf
    RunIdentity --> CalcConf[Calculate<br/>Confidence Score]
    
    CalcConf --> ConfCheck{Confidence<br/>Score?}
    ConfCheck -->|>= 70| Verified[Result: VERIFIED]
    ConfCheck -->|40-69| Manual[Result: INCONCLUSIVE<br/>Create Manual Review]
    ConfCheck -->|< 40| Unverified[Result: UNVERIFIED]
    
    Verified --> Notify[Send Notifications]
    Manual --> Notify
    Unverified --> Notify
    UpdateCert1 --> Notify
    UpdateCert2 --> Notify
    
    Notify --> Audit[Create Audit Log]
    Audit --> End([Verification Complete])
    
    style Start fill:#e1f5ff
    style End fill:#c8e6c9
    style Verified fill:#c8e6c9
    style Unverified fill:#ffcdd2
    style Manual fill:#fff9c4
```

**Description:** The verification pipeline adapts based on certificate type, running appropriate checks through multiple services, calculating confidence scores, and determining final verification status.

---

## 4. Aadhaar Verification Flow

This diagram details the Aadhaar card verification process with demographic matching.

```mermaid
sequenceDiagram
    participant API as Backend API
    participant Mock as Aadhaar Mock Service
    participant Calc as Confidence Calculator
    participant DB as Database
    
    API->>API: Extract Aadhaar Data<br/>from Certificate
    
    API->>Mock: verifyAadhaar()<br/>Number, Name, DOB, Gender
    
    Mock->>Mock: Validate Format<br/>12 Digits
    
    Mock->>Mock: Verhoeff Algorithm<br/>Checksum Validation
    
    alt Invalid Format
        Mock-->>API: FAILED<br/>INVALID_FORMAT
    else Valid Format
        Mock->>Mock: Simulate Network Delay<br/>800-3000ms
        
        Mock->>Mock: Determine Outcome<br/>Success/Error/Mismatch
        
        alt System Error 1%
            Mock-->>API: ERROR<br/>UIDAI_UNAVAILABLE
        else Not Found 5%
            Mock-->>API: FAILED<br/>AADHAAR_NOT_FOUND
        else Demographic Mismatch 2%
            Mock->>Mock: Calculate Match Score<br/>Name, DOB, Gender, Address
            Mock-->>API: FAILED<br/>Score < 70%<br/>DEMOGRAPHIC_MISMATCH
        else Success 92%
            Mock->>Mock: Fuzzy Name Matching<br/>Levenshtein Distance
            Mock->>Mock: DOB Exact Match
            Mock->>Mock: Gender Match
            Mock->>Mock: Address Partial Match
            Mock->>Mock: Calculate Overall Score<br/>Weighted Average
            Mock-->>API: SUCCESS<br/>Verified: true<br/>Match Score: 95%
        end
    end
    
    API->>Calc: Calculate Confidence<br/>Identity Verified
    Calc-->>API: Confidence Score
    
    API->>DB: Update Certificate<br/>identityVerified = true
    DB-->>API: Updated
    
    API->>DB: Save Verification Result
    DB-->>API: Saved
```

**Description:** Aadhaar verification validates format using Verhoeff algorithm, simulates UIDAI API calls with realistic delays and error rates, performs demographic matching with fuzzy logic, and updates certificate identity status.

---

## 5. PAN Verification Flow

This diagram shows the PAN card verification process including Aadhaar linkage check.

```mermaid
sequenceDiagram
    participant API as Backend API
    participant Mock as PAN Mock Service
    participant DB as Database
    
    API->>API: Extract PAN Data<br/>from Certificate
    
    API->>Mock: verifyPAN()<br/>PAN Number, Name, DOB
    
    Mock->>Mock: Validate Format<br/>5 Letters + 4 Digits + 1 Letter
    
    Mock->>Mock: Extract Category<br/>4th Character<br/>P=Individual, C=Company
    
    alt Invalid Format
        Mock-->>API: FAILED<br/>INVALID_FORMAT
    else Valid Format
        Mock->>Mock: Simulate Network Delay<br/>600-2500ms
        
        Mock->>Mock: Determine Outcome<br/>Success/Error/Invalid/Inactive
        
        alt System Error 0.5%
            Mock-->>API: ERROR<br/>SERVICE_UNAVAILABLE
        else Not Found 4%
            Mock-->>API: FAILED<br/>PAN_NOT_FOUND
        else Inactive 1.5%
            Mock-->>API: FAILED<br/>PAN_INACTIVE<br/>Status: Inactive
        else Success 94%
            Mock->>Mock: Fuzzy Name Matching<br/>85% Similarity Threshold
            Mock->>Mock: DOB Exact Match
            Mock->>Mock: Check Aadhaar Linkage<br/>85% Linked
            
            alt Aadhaar Linked
                Mock->>Mock: Generate Linkage Date<br/>Past 1-3 Years
                Mock-->>API: SUCCESS<br/>Verified: true<br/>Aadhaar Linked: true<br/>Linkage Date
            else Not Linked
                Mock-->>API: SUCCESS<br/>Verified: true<br/>Aadhaar Linked: false
            end
        end
    end
    
    API->>DB: Update Certificate<br/>identityVerified = true
    DB-->>API: Updated
    
    API->>DB: Save Verification Result
    DB-->>API: Saved
```

**Description:** PAN verification validates format, extracts holder category, performs name/DOB matching with fuzzy logic, checks Aadhaar linkage status, and updates certificate accordingly.

---

## 6. PAN-Aadhaar Matching Flow

This diagram illustrates the cross-document matching process for PAN and Aadhaar cards.

```mermaid
flowchart TD
    Start([User Selects<br/>PAN & Aadhaar Docs]) --> Fetch[Fetch Both Documents<br/>from Database]
    
    Fetch --> Validate{Both Documents<br/>Processed?}
    Validate -->|No| Error1[Error: Documents<br/>Not Processed]
    Validate -->|Yes| ExtractPAN[Extract PAN Fields<br/>Name, DOB, PAN Number]
    
    ExtractPAN --> ExtractAadhaar[Extract Aadhaar Fields<br/>Name, DOB, Aadhaar Number]
    
    ExtractAadhaar --> NameMatch[Compare Names<br/>Fuzzy Matching]
    NameMatch --> NameScore{Name<br/>Similarity?}
    NameScore -->|>= 85%| NameHigh[Name Match: HIGH<br/>Score: 100]
    NameScore -->|70-84%| NameMed[Name Match: MEDIUM<br/>Score: 75]
    NameScore -->|< 70%| NameLow[Name Match: LOW<br/>Score: 30]
    
    NameHigh --> DOBMatch
    NameMed --> DOBMatch
    NameLow --> DOBMatch
    
    DOBMatch[Compare DOB<br/>Exact Match]
    DOBMatch --> DOBCheck{DOB<br/>Match?}
    DOBCheck -->|Yes| DOBHigh[DOB Match: HIGH<br/>Score: 100]
    DOBCheck -->|No| DOBLow[DOB Match: LOW<br/>Score: 0]
    
    DOBHigh --> CalcOverall
    DOBLow --> CalcOverall
    
    CalcOverall[Calculate Overall Score<br/>Weighted Average<br/>Name: 60%, DOB: 40%]
    
    CalcOverall --> FinalScore{Overall<br/>Score?}
    FinalScore -->|>= 80| MatchHigh[Match Result: HIGH<br/>Confidence: 95%]
    FinalScore -->|60-79| MatchMed[Match Result: MEDIUM<br/>Confidence: 75%]
    FinalScore -->|< 60| MatchLow[Match Result: LOW<br/>Confidence: 40%]
    
    MatchHigh --> SaveResult[Save Match Result<br/>to Database]
    MatchMed --> SaveResult
    MatchLow --> SaveResult
    
    SaveResult --> GenerateReport[Generate Match Report<br/>Detailed Breakdown]
    GenerateReport --> End([Return Report<br/>to User])
    
    Error1 --> End
    
    style Start fill:#e1f5ff
    style End fill:#c8e6c9
    style MatchHigh fill:#c8e6c9
    style MatchLow fill:#ffcdd2
    style MatchMed fill:#fff9c4
```

**Description:** PAN-Aadhaar matching compares name fields using fuzzy matching with Levenshtein distance, performs exact DOB comparison, calculates weighted scores, and generates detailed match reports.

---

## 7. Signature Matching Flow

This diagram shows the signature comparison and matching process.

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as Backend API
    participant S3 as AWS S3
    participant Matcher as Signature Matcher
    participant DB as Database
    
    U->>F: Upload Two Signatures<br/>Reference & Test
    F->>F: Validate Images<br/>Format, Size
    
    F->>API: POST /document-processing/signature-match<br/>multipart/form-data
    
    API->>S3: Upload Reference Signature
    S3-->>API: S3 Key 1
    
    API->>S3: Upload Test Signature
    S3-->>API: S3 Key 2
    
    API->>Matcher: Extract Signature Regions<br/>Image Processing
    Matcher->>Matcher: Preprocess Images<br/>Grayscale, Normalize
    
    Matcher->>Matcher: Algorithm 1:<br/>Structural Similarity SSIM
    Matcher->>Matcher: Algorithm 2:<br/>Feature Matching ORB
    Matcher->>Matcher: Algorithm 3:<br/>Histogram Comparison
    
    Matcher->>Matcher: Calculate Individual Scores<br/>SSIM, Feature, Histogram
    
    Matcher->>Matcher: Weighted Average<br/>SSIM: 40%<br/>Feature: 35%<br/>Histogram: 25%
    
    Matcher-->>API: Match Result<br/>Overall Score<br/>Individual Scores
    
    API->>API: Determine Match Level<br/>High/Medium/Low
    
    alt Score >= 80
        API->>API: Match: HIGH<br/>Likely Same Person
    else Score 60-79
        API->>API: Match: MEDIUM<br/>Possible Match
    else Score < 60
        API->>API: Match: LOW<br/>Different Signatures
    end
    
    API->>DB: Save Match Result<br/>DocumentProcessing Table
    DB-->>API: Record ID
    
    API-->>F: Match Report<br/>Scores, Visualization
    F-->>U: Display Results<br/>Score Breakdown
```

**Description:** Signature matching uses multiple algorithms including SSIM for structural similarity, ORB for feature detection, and histogram comparison, combining scores with weighted averaging to determine match confidence.

---

## 8. Database Schema Diagram

This entity-relationship diagram shows the complete database structure.

```mermaid
erDiagram
    Users ||--o{ Certificates : creates
    Users ||--o{ ManualReviews : reviews
    Users ||--o{ AuditLogs : generates
    Users ||--o{ Notifications : receives
    
    Certificates ||--o{ Verifications : has
    Certificates ||--o{ ManualReviews : requires
    Certificates ||--o{ Consents : has
    Certificates ||--o{ DocumentProcessing : has
    
    Verifications ||--o{ VerificationSteps : contains
    
    Users {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        enum role
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    Certificates {
        uuid id PK
        uuid user_id FK
        string certificate_number
        enum certificate_type
        string issuer_name
        enum issuer_type
        jsonb certificate_data
        string file_path
        enum status
        boolean has_qr_code
        boolean has_digital_signature
        boolean identity_verified
        timestamp created_at
        timestamp verified_at
    }
    
    Verifications {
        uuid id PK
        uuid certificate_id FK
        enum verification_type
        enum status
        enum result
        decimal confidence_score
        jsonb result_data
        timestamp started_at
        timestamp completed_at
        integer duration_ms
    }
    
    VerificationSteps {
        uuid id PK
        uuid verification_id FK
        enum step_type
        string step_name
        enum status
        jsonb result
        jsonb evidence
        integer sequence_number
        timestamp executed_at
        integer duration_ms
    }
    
    ManualReviews {
        uuid id PK
        uuid certificate_id FK
        uuid verifier_id FK
        enum status
        enum priority
        enum decision
        text comments
        timestamp assigned_at
        timestamp completed_at
    }
    
    AuditLogs {
        uuid id PK
        enum entity_type
        uuid entity_id
        string action
        uuid user_id FK
        jsonb changes
        string hash
        string previous_hash
        timestamp created_at
    }
    
    Consents {
        uuid id PK
        uuid certificate_id FK
        uuid user_id FK
        enum purpose
        boolean granted
        timestamp granted_at
        timestamp expires_at
    }
    
    Notifications {
        uuid id PK
        uuid user_id FK
        enum type
        enum channel
        string recipient
        text body
        enum status
        timestamp sent_at
    }
    
    DocumentProcessing {
        uuid id PK
        uuid certificate_id FK
        enum document_type
        string s3_key
        string s3_url
        jsonb ocr_result
        jsonb extracted_fields
        decimal confidence_score
        enum status
        timestamp created_at
    }
```

**Description:** The database schema uses PostgreSQL with UUID primary keys, JSONB for flexible data storage, enums for type safety, and proper foreign key relationships. Audit logs implement hash chaining for tamper-evidence.

---

## 9. Authentication Flow

This diagram illustrates the JWT-based authentication and authorization process.

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as Backend API
    participant Auth as Auth Service
    participant DB as Database
    participant Redis as Redis Cache
    
    rect rgb(230, 240, 255)
        Note over U,Redis: Registration Flow
        U->>F: Enter Registration Details
        F->>API: POST /auth/register<br/>email, password, name
        API->>Auth: Validate Input<br/>Zod Schema
        Auth->>Auth: Hash Password<br/>bcrypt
        Auth->>DB: Create User Record
        DB-->>Auth: User Created
        Auth->>Auth: Generate JWT Token<br/>Payload: id, email, role
        Auth-->>API: User + Token
        API-->>F: Success Response<br/>User, Token
        F->>F: Store Token<br/>localStorage
        F-->>U: Redirect to Dashboard
    end
    
    rect rgb(255, 240, 230)
        Note over U,Redis: Login Flow
        U->>F: Enter Credentials
        F->>API: POST /auth/login<br/>email, password
        API->>Auth: Validate Credentials
        Auth->>DB: Find User by Email
        DB-->>Auth: User Record
        Auth->>Auth: Compare Password<br/>bcrypt.compare
        
        alt Invalid Credentials
            Auth-->>API: Error: Invalid
            API-->>F: 401 Unauthorized
            F-->>U: Show Error
        else Valid Credentials
            Auth->>Auth: Generate JWT Token<br/>Expires: 24h
            Auth->>DB: Update last_login_at
            Auth-->>API: User + Token
            API-->>F: Success Response
            F->>F: Store Token<br/>localStorage
            F-->>U: Redirect to Dashboard
        end
    end
    
    rect rgb(240, 255, 240)
        Note over U,Redis: Protected Request Flow
        U->>F: Access Protected Page
        F->>API: GET /certificates<br/>Authorization: Bearer token
        API->>Auth: Validate JWT Token
        Auth->>Auth: Verify Signature<br/>Check Expiry
        
        alt Invalid/Expired Token
            Auth-->>API: Error: Unauthorized
            API-->>F: 401 Unauthorized
            F->>F: Clear Token
            F-->>U: Redirect to Login
        else Valid Token
            Auth->>Redis: Check Rate Limit<br/>User ID
            Redis-->>Auth: Limit OK
            Auth->>Auth: Check Permissions<br/>Role-based Access
            Auth-->>API: Authorized
            API->>DB: Fetch Certificates
            DB-->>API: Certificate List
            API-->>F: Success Response
            F-->>U: Display Data
        end
    end
    
    rect rgb(255, 245, 240)
        Note over U,Redis: Logout Flow
        U->>F: Click Logout
        F->>API: POST /auth/logout
        API->>Redis: Add Token to Blacklist<br/>TTL: remaining time
        Redis-->>API: Blacklisted
        API-->>F: Success
        F->>F: Clear Token<br/>localStorage
        F-->>U: Redirect to Login
    end
```

**Description:** Authentication uses JWT tokens with bcrypt password hashing, role-based access control, Redis for rate limiting and token blacklisting, and automatic token expiry after 24 hours.

---

## 10. Component Architecture

This diagram shows the frontend component hierarchy and state management.

```mermaid
graph TB
    subgraph "Application Root"
        App[App.tsx<br/>Router Setup]
    end
    
    subgraph "Layout Components"
        Layout[Layout.tsx<br/>Main Container]
        Header[Header.tsx<br/>Top Navigation]
        Sidebar[Sidebar.tsx<br/>Side Menu]
    end
    
    subgraph "Page Components"
        Dashboard[DashboardPage<br/>Overview Stats]
        Certificates[CertificatesPage<br/>List View]
        Upload[UploadCertificatePage<br/>Form + Upload]
        Verifications[VerificationsPage<br/>List View]
        VerDetail[VerificationDetailPage<br/>Details + Steps]
        PANAadhaar[PANAadhaarMatchingPage<br/>Matching Tool]
        Signature[SignatureMatchingPage<br/>Comparison Tool]
        ReviewQueue[VerifierQueuePage<br/>Manual Reviews]
        Profile[ProfilePage<br/>User Settings]
    end
    
    subgraph "Feature Components"
        CertList[CertificateList<br/>Table Component]
        CertCard[CertificateCard<br/>Card Display]
        CertForm[CertificateForm<br/>Input Form]
        AadhaarForm[AadhaarCardForm<br/>Identity Form]
        PANForm[PANCardForm<br/>Identity Form]
        VerCard[VerificationCard<br/>Status Display]
        VerTimeline[VerificationTimeline<br/>Step Progress]
        VerEvidence[VerificationEvidence<br/>Proof Display]
        PANMatcher[PANAadhaarMatcher<br/>Match Component]
        SigMatcher[SignatureMatcher<br/>Compare Component]
        ReviewCard[ReviewCard<br/>Review Item]
    end
    
    subgraph "Common Components"
        Button[Button<br/>Reusable]
        Input[Input<br/>Form Field]
        Select[Select<br/>Dropdown]
        Modal[Modal<br/>Dialog]
        Table[Table<br/>Data Grid]
        FileUpload[FileUpload<br/>File Input]
        Badge[Badge<br/>Status Tag]
        Spinner[LoadingSpinner<br/>Loading State]
    end
    
    subgraph "State Management - Zustand"
        AuthStore[authStore<br/>User, Token, Login/Logout]
        CertStore[certificateStore<br/>Certificates, CRUD]
        VerStore[verificationStore<br/>Verifications, Steps]
        UIStore[uiStore<br/>Theme, Notifications]
    end
    
    subgraph "Services - API Layer"
        AuthService[authService<br/>Login, Register, Logout]
        CertService[certificateService<br/>CRUD Operations]
        VerService[verificationService<br/>Start, Get Status]
        DocService[documentProcessingService<br/>Upload, Process, Match]
        APIService[apiService<br/>Axios Instance]
    end
    
    App --> Layout
    Layout --> Header
    Layout --> Sidebar
    Layout --> Dashboard
    Layout --> Certificates
    Layout --> Upload
    Layout --> Verifications
    Layout --> VerDetail
    Layout --> PANAadhaar
    Layout --> Signature
    Layout --> ReviewQueue
    Layout --> Profile
    
    Certificates --> CertList
    CertList --> CertCard
    Upload --> CertForm
    Upload --> AadhaarForm
    Upload --> PANForm
    Upload --> FileUpload
    
    Verifications --> VerCard
    VerDetail --> VerTimeline
    VerDetail --> VerEvidence
    
    PANAadhaar --> PANMatcher
    Signature --> SigMatcher
    ReviewQueue --> ReviewCard
    
    CertForm --> Input
    CertForm --> Select
    CertForm --> Button
    CertList --> Table
    CertCard --> Badge
    
    Dashboard --> AuthStore
    Certificates --> CertStore
    Upload --> CertStore
    Verifications --> VerStore
    VerDetail --> VerStore
    Profile --> AuthStore
    Header --> UIStore
    
    CertStore --> CertService
    VerStore --> VerService
    AuthStore --> AuthService
    PANMatcher --> DocService
    SigMatcher --> DocService
    
    CertService --> APIService
    VerService --> APIService
    AuthService --> APIService
    DocService --> APIService
    
    style App fill:#e1f5ff
    style AuthStore fill:#fff4e6
    style CertStore fill:#fff4e6
    style VerStore fill:#fff4e6
    style UIStore fill:#fff4e6
    style APIService fill:#f3e5f5
```

**Description:** The frontend follows a component-based architecture with React, using Zustand for state management, service layer for API calls, reusable common components, and feature-specific components organized by domain.

---

## Diagram Usage Notes

### Viewing Diagrams
- These Mermaid.js diagrams can be viewed in:
  - GitHub (native Mermaid support)
  - VS Code (with Mermaid extension)
  - Online editors like mermaid.live
  - Documentation sites supporting Mermaid

### Diagram Types Used
- **Flowchart (graph TB/TD)**: System architecture, process flows
- **Sequence Diagram**: API interactions, time-based flows
- **Entity-Relationship Diagram**: Database schema
- **Flowchart (flowchart TD)**: Decision trees, conditional logic

### Color Coding
- **Blue (#e1f5ff)**: Entry points, start nodes
- **Green (#c8e6c9)**: Success states, completion
- **Red (#ffcdd2)**: Error states, failures
- **Yellow (#fff9c4)**: Warning states, manual review
- **Orange (#fff4e6)**: Processing states, middleware
- **Purple (#f3e5f5)**: Data storage, databases

---

## Document Information

**Version:** 1.0  
**Last Updated:** 2025-10-13  
**Created By:** VeriDoc Architecture Team  
**Status:** Complete

**Related Documents:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed system architecture
- [DATA_MODELS.md](./DATA_MODELS.md) - Database schemas and models
- [API_SPECIFICATION.md](./API_SPECIFICATION.md) - API endpoint documentation
- [TECHNOLOGY_STACK.md](./TECHNOLOGY_STACK.md) - Technology choices and rationale

---

**Note:** These diagrams represent the current system design. For implementation details, refer to the source code and related documentation files.