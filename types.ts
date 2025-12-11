
export enum AgreementStatus {
  ACTIVE = 'Active',
  EXPIRING_SOON = 'Expiring Soon',
  EXPIRED = 'Expired',
  PENDING_APPROVAL = 'Pending Approval',
}

export interface Agreement {
  id: string;
  fileName: string;
  type: string; // e.g., "Distributor", "Rental", "Vendor"
  partyA: string; // The user's company (usually)
  partyB: string; // The counterparty
  startDate: string;
  renewalDate: string;
  expiryDate: string;
  location: string;
  status: AgreementStatus;
  riskScore: number; // 0-100
  summary: string;
  rawContent?: string; // For generating new drafts
}

export interface ExtractionResult {
  type: string;
  partyA: string;
  partyB: string;
  startDate: string;
  renewalDate: string;
  expiryDate: string;
  location: string;
  summary: string;
  fullText: string;
}

export interface DashboardStats {
  total: number;
  active: number;
  expiring: number;
  expired: number;
  pending: number;
}

export interface AppSettings {
  waInstanceId: string;
  waAccessToken: string;
  waApiUrl: string;
  adminEmail: string;
  adminPhone: string; // The number to receive the WhatsApp notifications
  enableAutoNotify: boolean;
}
