// Core Skip Tracing Types

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  aliases?: string[];
  dateOfBirth?: string;
  age?: number;
  ssn?: string; // Last 4 only for display
  gender?: string;

  // Contact Info
  phones: PhoneRecord[];
  emails: EmailRecord[];
  addresses: AddressRecord[];

  // Relationships
  relatives?: RelativeRecord[];
  associates?: AssociateRecord[];

  // Employment
  employment?: EmploymentRecord[];

  // Assets
  properties?: PropertyRecord[];
  vehicles?: VehicleRecord[];

  // Legal
  courtRecords?: CourtRecord[];
  liens?: LienRecord[];
  judgments?: JudgmentRecord[];
  bankruptcies?: BankruptcyRecord[];
  uccFilings?: UCCRecord[];

  // Licenses
  professionalLicenses?: LicenseRecord[];

  // Social
  socialProfiles?: SocialProfile[];

  // Meta
  confidence: number;
  sources: string[];
  lastUpdated: string;
}

export interface PhoneRecord {
  number: string;
  type: 'mobile' | 'landline' | 'voip' | 'unknown';
  carrier?: string;
  lineType?: string;
  isConnected?: boolean;
  lastSeen?: string;
  confidence: number;
  source: string;
}

export interface EmailRecord {
  address: string;
  type: 'personal' | 'work' | 'unknown';
  isValid?: boolean;
  provider?: string;
  lastSeen?: string;
  confidence: number;
  source: string;
}

export interface AddressRecord {
  street: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  county?: string;
  type: 'current' | 'previous' | 'mailing' | 'unknown';
  dateFirst?: string;
  dateLast?: string;
  isOwned?: boolean;
  propertyValue?: number;
  confidence: number;
  source: string;
}

export interface RelativeRecord {
  firstName: string;
  lastName: string;
  relationship: 'spouse' | 'parent' | 'child' | 'sibling' | 'other';
  age?: number;
  sharedAddresses?: string[];
  phones?: string[];
  confidence: number;
}

export interface AssociateRecord {
  firstName: string;
  lastName: string;
  relationship: 'business' | 'neighbor' | 'coworker' | 'other';
  sharedAddresses?: string[];
  confidence: number;
}

export interface EmploymentRecord {
  company: string;
  title?: string;
  department?: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  address?: string;
  phone?: string;
  confidence: number;
  source: string;
}

export interface PropertyRecord {
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  parcelId?: string;
  ownerName: string;
  ownerType: 'individual' | 'trust' | 'llc' | 'corporation';
  purchaseDate?: string;
  purchasePrice?: number;
  assessedValue?: number;
  marketValue?: number;
  taxAmount?: number;
  yearBuilt?: number;
  sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  lotSize?: string;
  propertyType: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'land' | 'commercial' | 'other';
  mortgages?: MortgageRecord[];
  source: string;
  sourceUrl?: string;
}

export interface MortgageRecord {
  lender: string;
  amount: number;
  date: string;
  type: 'conventional' | 'fha' | 'va' | 'jumbo' | 'unknown';
  interestRate?: number;
}

export interface VehicleRecord {
  vin?: string;
  year: number;
  make: string;
  model: string;
  color?: string;
  licensePlate?: string;
  state?: string;
  registeredOwner: string;
  registrationDate?: string;
  expirationDate?: string;
  titleNumber?: string;
  lienHolder?: string;
  source: string;
}

export interface CourtRecord {
  caseNumber: string;
  court: string;
  courtType: 'civil' | 'criminal' | 'family' | 'traffic' | 'small_claims' | 'federal' | 'bankruptcy';
  jurisdiction: string;
  filingDate: string;
  caseType: string;
  caseStatus: 'open' | 'closed' | 'pending' | 'dismissed';
  parties: {
    role: 'plaintiff' | 'defendant' | 'petitioner' | 'respondent' | 'debtor' | 'creditor';
    name: string;
  }[];
  charges?: string[];
  disposition?: string;
  dispositionDate?: string;
  judgmentAmount?: number;
  attorney?: string;
  source: string;
  sourceUrl?: string;
}

export interface LienRecord {
  type: 'tax' | 'mechanics' | 'judgment' | 'federal_tax' | 'state_tax' | 'hoa' | 'other';
  fileNumber: string;
  filingDate: string;
  amount: number;
  creditor: string;
  debtor: string;
  status: 'active' | 'released' | 'partial_release';
  releaseDate?: string;
  propertyAddress?: string;
  jurisdiction: string;
  source: string;
}

export interface JudgmentRecord {
  caseNumber: string;
  court: string;
  filingDate: string;
  judgmentDate: string;
  amount: number;
  plaintiff: string;
  defendant: string;
  status: 'active' | 'satisfied' | 'vacated';
  satisfiedDate?: string;
  source: string;
}

export interface BankruptcyRecord {
  caseNumber: string;
  court: string;
  chapter: '7' | '11' | '13';
  filingDate: string;
  debtor: string;
  status: 'open' | 'discharged' | 'dismissed' | 'converted';
  dischargeDate?: string;
  dismissalDate?: string;
  assets?: number;
  liabilities?: number;
  trustee?: string;
  attorney?: string;
  source: string;
}

export interface UCCRecord {
  fileNumber: string;
  filingDate: string;
  expirationDate?: string;
  type: 'financing_statement' | 'amendment' | 'continuation' | 'termination';
  securedParty: string;
  debtor: string;
  collateral: string;
  filingOffice: string;
  status: 'active' | 'expired' | 'terminated';
  source: string;
}

export interface LicenseRecord {
  licenseNumber: string;
  type: string;
  status: 'active' | 'inactive' | 'expired' | 'revoked' | 'suspended';
  issuingAuthority: string;
  state: string;
  issueDate: string;
  expirationDate: string;
  holderName: string;
  holderAddress?: string;
  disciplinaryActions?: {
    date: string;
    action: string;
    reason: string;
  }[];
  source: string;
  sourceUrl?: string;
}

export interface SocialProfile {
  platform: 'linkedin' | 'facebook' | 'twitter' | 'instagram' | 'tiktok' | 'github' | 'other';
  username?: string;
  url: string;
  displayName?: string;
  bio?: string;
  followers?: number;
  verified?: boolean;
  lastActive?: string;
  confidence: number;
}

// Business Entity Types
export interface BusinessEntity {
  id: string;
  name: string;
  dbaNames?: string[];
  entityType: 'corporation' | 'llc' | 'partnership' | 'sole_proprietorship' | 'nonprofit' | 'trust' | 'other';
  status: 'active' | 'inactive' | 'dissolved' | 'suspended' | 'forfeited';

  // Registration
  stateOfFormation: string;
  fileNumber: string;
  filingDate: string;

  // Addresses
  principalAddress?: string;
  mailingAddress?: string;
  registeredAgent?: {
    name: string;
    address: string;
  };

  // People
  officers?: OfficerRecord[];
  directors?: OfficerRecord[];
  members?: OfficerRecord[]; // For LLCs

  // Documents
  annualReports?: {
    year: number;
    filingDate: string;
  }[];

  // Financial
  authorizedShares?: number;

  // Related
  relatedEntities?: string[];

  // SEC Data
  secFilings?: SECFiling[];

  // Meta
  source: string;
  sourceUrl?: string;
  lastUpdated: string;
}

export interface OfficerRecord {
  name: string;
  title: string;
  address?: string;
  startDate?: string;
  endDate?: string;
}

export interface SECFiling {
  accessionNumber: string;
  formType: string;
  filingDate: string;
  description?: string;
  documentUrl: string;
}

// Search Parameters
export interface PersonSearchParams {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  city?: string;
  state?: string;
  zip?: string;
  age?: number;
  ageRange?: { min: number; max: number };
  phone?: string;
  email?: string;
  address?: string;
  ssn?: string; // Last 4 only
}

export interface BusinessSearchParams {
  name?: string;
  state?: string;
  fileNumber?: string;
  officerName?: string;
  registeredAgentName?: string;
  status?: string;
}

export interface PropertySearchParams {
  address?: string;
  city?: string;
  state?: string;
  county?: string;
  ownerName?: string;
  parcelId?: string;
}

export interface CourtSearchParams {
  name?: string;
  caseNumber?: string;
  state?: string;
  courtType?: string;
  dateRange?: { start: string; end: string };
}

// Search Results
export interface SearchResult<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
  sources: string[];
  searchTime: number;
  query: Record<string, unknown>;
}

// Report Types
export interface SkipTraceReport {
  id: string;
  type: 'person' | 'business' | 'property' | 'comprehensive';
  subject: {
    name: string;
    identifier?: string;
  };
  generatedAt: string;
  sections: ReportSection[];
  summary: string;
  riskScore?: number;
  recommendations?: string[];
}

export interface ReportSection {
  title: string;
  data: unknown;
  sources: string[];
  confidence: number;
}
