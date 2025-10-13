export const APP_NAME = 'Certificate Verification System';
export const APP_VERSION = '1.0.0';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  CERTIFICATES: '/certificates',
  CERTIFICATE_DETAIL: '/certificates/:id',
  UPLOAD_CERTIFICATE: '/certificates/upload',
  VERIFICATIONS: '/verifications',
  VERIFICATION_DETAIL: '/verifications/:id',
  VERIFIER_QUEUE: '/verifier/queue',
  VERIFIER_REVIEW: '/verifier/review/:id',
  ADMIN_USERS: '/admin/users',
  ADMIN_STATS: '/admin/stats',
  PROFILE: '/profile',
};

export const CERTIFICATE_TYPES = [
  { value: 'SCHOOL_CERTIFICATE', label: 'School Certificate' },
  { value: 'DEGREE', label: 'Degree' },
  { value: 'DIPLOMA', label: 'Diploma' },
  { value: 'MARKSHEET', label: 'Marksheet' },
  { value: 'OTHER', label: 'Other' },
];

export const ISSUER_TYPES = [
  { value: 'CBSE', label: 'CBSE' },
  { value: 'ICSE', label: 'ICSE' },
  { value: 'STATE_BOARD', label: 'State Board' },
  { value: 'UNIVERSITY', label: 'University' },
  { value: 'OTHER', label: 'Other' },
];

export const USER_ROLES = [
  { value: 'API_USER', label: 'API User' },
  { value: 'VERIFIER', label: 'Verifier' },
  { value: 'ADMIN', label: 'Admin' },
];

export const VERIFICATION_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'gray' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'blue' },
  { value: 'COMPLETED', label: 'Completed', color: 'green' },
  { value: 'FAILED', label: 'Failed', color: 'red' },
];

export const VERIFICATION_RESULTS = [
  { value: 'VERIFIED', label: 'Verified', color: 'green' },
  { value: 'UNVERIFIED', label: 'Unverified', color: 'red' },
  { value: 'PENDING', label: 'Pending', color: 'yellow' },
  { value: 'REQUIRES_MANUAL_REVIEW', label: 'Requires Manual Review', color: 'orange' },
];

export const REVIEW_PRIORITIES = [
  { value: 'LOW', label: 'Low', color: 'gray' },
  { value: 'MEDIUM', label: 'Medium', color: 'blue' },
  { value: 'HIGH', label: 'High', color: 'orange' },
  { value: 'URGENT', label: 'Urgent', color: 'red' },
];

export const REVIEW_DECISIONS = [
  { value: 'APPROVED', label: 'Approved', color: 'green' },
  { value: 'REJECTED', label: 'Rejected', color: 'red' },
  { value: 'NEEDS_MORE_INFO', label: 'Needs More Info', color: 'yellow' },
];

// Helper functions to get labels from values
export const getCertificateTypeLabel = (value: string): string => {
  return CERTIFICATE_TYPES.find(t => t.value === value)?.label || value;
};

export const getIssuerTypeLabel = (value: string): string => {
  return ISSUER_TYPES.find(t => t.value === value)?.label || value;
};

export const getUserRoleLabel = (value: string): string => {
  return USER_ROLES.find(r => r.value === value)?.label || value;
};

export const getVerificationStatusLabel = (value: string): string => {
  return VERIFICATION_STATUSES.find(s => s.value === value)?.label || value;
};

export const getVerificationResultLabel = (value: string): string => {
  return VERIFICATION_RESULTS.find(r => r.value === value)?.label || value;
};

export const getReviewPriorityLabel = (value: string): string => {
  return REVIEW_PRIORITIES.find(p => p.value === value)?.label || value;
};

export const getReviewDecisionLabel = (value: string): string => {
  return REVIEW_DECISIONS.find(d => d.value === value)?.label || value;
};

// Helper functions to get colors
export const getVerificationStatusColor = (value: string): string => {
  return VERIFICATION_STATUSES.find(s => s.value === value)?.color || 'gray';
};

export const getVerificationResultColor = (value: string): string => {
  return VERIFICATION_RESULTS.find(r => r.value === value)?.color || 'gray';
};

export const getReviewPriorityColor = (value: string): string => {
  return REVIEW_PRIORITIES.find(p => p.value === value)?.color || 'gray';
};

export const getReviewDecisionColor = (value: string): string => {
  return REVIEW_DECISIONS.find(d => d.value === value)?.color || 'gray';
};