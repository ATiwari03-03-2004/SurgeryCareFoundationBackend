export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const AUTH = {
  SALT_ROUNDS: 12,
  MAX_SESSIONS_PER_USER: 10,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  EMAIL_VERIFICATION_EXPIRES_HOURS: 24,
  PASSWORD_RESET_EXPIRES_HOURS: 1,
} as const;

export const UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_DOC_TYPES: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  SIGNED_URL_EXPIRES_SECONDS: 3600,
} as const;

export const RATE_LIMITS = {
  AUTH: { windowMs: 15 * 60 * 1000, max: 20 },
  DONATION: { windowMs: 60 * 1000, max: 10 },
  PUBLIC: { windowMs: 60 * 1000, max: 60 },
  DEFAULT: { windowMs: 60 * 1000, max: 100 },
} as const;

export enum Role {
  VISITOR = 'visitor',
  DONOR = 'donor',
  CAMPAIGN_CREATOR = 'campaign_creator',
  MODERATOR = 'moderator',
  FINANCE_MANAGER = 'finance_manager',
  SUPER_ADMIN = 'super_admin',
}

export enum Permission {
  CAMPAIGN_CREATE = 'campaign:create',
  CAMPAIGN_UPDATE_OWN = 'campaign:update_own',
  CAMPAIGN_SUBMIT_OWN = 'campaign:submit_own',
  CAMPAIGN_VIEW_PRIVATE_OWN = 'campaign:view_private_own',
  CAMPAIGN_MODERATE = 'campaign:moderate',
  CAMPAIGN_APPROVE = 'campaign:approve',
  CAMPAIGN_REJECT = 'campaign:reject',
  PAYMENT_VIEW_ALL = 'payment:view_all',
  WITHDRAWAL_REQUEST_OWN = 'withdrawal:request_own',
  WITHDRAWAL_APPROVE = 'withdrawal:approve',
  WITHDRAWAL_DISBURSE = 'withdrawal:disburse',
  DONATION_VIEW_OWN = 'donation:view_own',
  DONATION_VIEW_ALL = 'donation:view_all',
  RECEIPT_VIEW_OWN = 'receipt:view_own',
  ANALYTICS_VIEW_ADMIN = 'analytics:view_admin',
  ADMIN_MANAGE_CONTENT = 'admin:manage_content',
  AUDIT_VIEW = 'audit:view',
  USER_MANAGE = 'user:manage',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.VISITOR]: [],
  [Role.DONOR]: [
    Permission.DONATION_VIEW_OWN,
    Permission.RECEIPT_VIEW_OWN,
  ],
  [Role.CAMPAIGN_CREATOR]: [
    Permission.CAMPAIGN_CREATE,
    Permission.CAMPAIGN_UPDATE_OWN,
    Permission.CAMPAIGN_SUBMIT_OWN,
    Permission.CAMPAIGN_VIEW_PRIVATE_OWN,
    Permission.WITHDRAWAL_REQUEST_OWN,
    Permission.DONATION_VIEW_OWN,
    Permission.RECEIPT_VIEW_OWN,
  ],
  [Role.MODERATOR]: [
    Permission.CAMPAIGN_MODERATE,
    Permission.CAMPAIGN_APPROVE,
    Permission.CAMPAIGN_REJECT,
    Permission.DONATION_VIEW_ALL,
  ],
  [Role.FINANCE_MANAGER]: [
    Permission.PAYMENT_VIEW_ALL,
    Permission.WITHDRAWAL_APPROVE,
    Permission.WITHDRAWAL_DISBURSE,
    Permission.DONATION_VIEW_ALL,
    Permission.ANALYTICS_VIEW_ADMIN,
  ],
  [Role.SUPER_ADMIN]: Object.values(Permission),
};

export enum CampaignStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  ACTIVE = 'active',
  PAUSED = 'paused',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CLOSED = 'closed',
}

export enum DonationStatus {
  INITIATED = 'initiated',
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum WithdrawalStatus {
  REQUESTED = 'requested',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PARTIALLY_DISBURSED = 'partially_disbursed',
  FULLY_DISBURSED = 'fully_disbursed',
  CANCELLED = 'cancelled',
}

export enum DocumentStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum AccountStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}
