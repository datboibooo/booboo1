// Phone and Email Lookup
// Free sources: FCC database, carrier lookup, email validation

import { PhoneRecord, EmailRecord } from '../types';

// Phone number utilities
export function parsePhoneNumber(phone: string): {
  raw: string;
  cleaned: string;
  formatted: string;
  areaCode: string;
  exchange: string;
  subscriber: string;
  isValid: boolean;
} {
  const cleaned = phone.replace(/\D/g, '');

  // Remove leading 1 for US numbers
  const normalized = cleaned.length === 11 && cleaned.startsWith('1')
    ? cleaned.slice(1)
    : cleaned;

  const isValid = normalized.length === 10;

  return {
    raw: phone,
    cleaned: normalized,
    formatted: isValid
      ? `(${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6)}`
      : phone,
    areaCode: normalized.slice(0, 3),
    exchange: normalized.slice(3, 6),
    subscriber: normalized.slice(6),
    isValid,
  };
}

// Area code data - Major US area codes with locations
const AREA_CODES: Record<string, { state: string; city: string; timezone: string }> = {
  // Florida
  '305': { state: 'FL', city: 'Miami', timezone: 'America/New_York' },
  '786': { state: 'FL', city: 'Miami', timezone: 'America/New_York' },
  '954': { state: 'FL', city: 'Fort Lauderdale', timezone: 'America/New_York' },
  '754': { state: 'FL', city: 'Fort Lauderdale', timezone: 'America/New_York' },
  '561': { state: 'FL', city: 'West Palm Beach', timezone: 'America/New_York' },
  '407': { state: 'FL', city: 'Orlando', timezone: 'America/New_York' },
  '321': { state: 'FL', city: 'Orlando/Space Coast', timezone: 'America/New_York' },
  '813': { state: 'FL', city: 'Tampa', timezone: 'America/New_York' },
  '727': { state: 'FL', city: 'St. Petersburg', timezone: 'America/New_York' },
  '904': { state: 'FL', city: 'Jacksonville', timezone: 'America/New_York' },
  '386': { state: 'FL', city: 'Daytona Beach', timezone: 'America/New_York' },
  '239': { state: 'FL', city: 'Fort Myers', timezone: 'America/New_York' },
  '941': { state: 'FL', city: 'Sarasota', timezone: 'America/New_York' },
  '352': { state: 'FL', city: 'Gainesville', timezone: 'America/New_York' },
  '863': { state: 'FL', city: 'Lakeland', timezone: 'America/New_York' },
  '772': { state: 'FL', city: 'Port St. Lucie', timezone: 'America/New_York' },
  '850': { state: 'FL', city: 'Tallahassee/Pensacola', timezone: 'America/Chicago' },

  // California
  '213': { state: 'CA', city: 'Los Angeles', timezone: 'America/Los_Angeles' },
  '310': { state: 'CA', city: 'Los Angeles', timezone: 'America/Los_Angeles' },
  '323': { state: 'CA', city: 'Los Angeles', timezone: 'America/Los_Angeles' },
  '424': { state: 'CA', city: 'Los Angeles', timezone: 'America/Los_Angeles' },
  '818': { state: 'CA', city: 'San Fernando Valley', timezone: 'America/Los_Angeles' },
  '626': { state: 'CA', city: 'Pasadena', timezone: 'America/Los_Angeles' },
  '415': { state: 'CA', city: 'San Francisco', timezone: 'America/Los_Angeles' },
  '408': { state: 'CA', city: 'San Jose', timezone: 'America/Los_Angeles' },
  '650': { state: 'CA', city: 'Peninsula', timezone: 'America/Los_Angeles' },
  '510': { state: 'CA', city: 'Oakland', timezone: 'America/Los_Angeles' },
  '619': { state: 'CA', city: 'San Diego', timezone: 'America/Los_Angeles' },
  '858': { state: 'CA', city: 'San Diego', timezone: 'America/Los_Angeles' },
  '714': { state: 'CA', city: 'Orange County', timezone: 'America/Los_Angeles' },
  '949': { state: 'CA', city: 'Orange County', timezone: 'America/Los_Angeles' },

  // New York
  '212': { state: 'NY', city: 'Manhattan', timezone: 'America/New_York' },
  '646': { state: 'NY', city: 'Manhattan', timezone: 'America/New_York' },
  '917': { state: 'NY', city: 'New York City', timezone: 'America/New_York' },
  '718': { state: 'NY', city: 'Brooklyn/Queens', timezone: 'America/New_York' },
  '347': { state: 'NY', city: 'New York City', timezone: 'America/New_York' },
  '516': { state: 'NY', city: 'Long Island', timezone: 'America/New_York' },
  '631': { state: 'NY', city: 'Long Island', timezone: 'America/New_York' },
  '914': { state: 'NY', city: 'Westchester', timezone: 'America/New_York' },

  // Texas
  '713': { state: 'TX', city: 'Houston', timezone: 'America/Chicago' },
  '281': { state: 'TX', city: 'Houston', timezone: 'America/Chicago' },
  '832': { state: 'TX', city: 'Houston', timezone: 'America/Chicago' },
  '214': { state: 'TX', city: 'Dallas', timezone: 'America/Chicago' },
  '972': { state: 'TX', city: 'Dallas', timezone: 'America/Chicago' },
  '469': { state: 'TX', city: 'Dallas', timezone: 'America/Chicago' },
  '817': { state: 'TX', city: 'Fort Worth', timezone: 'America/Chicago' },
  '210': { state: 'TX', city: 'San Antonio', timezone: 'America/Chicago' },
  '512': { state: 'TX', city: 'Austin', timezone: 'America/Chicago' },

  // Other major areas
  '312': { state: 'IL', city: 'Chicago', timezone: 'America/Chicago' },
  '773': { state: 'IL', city: 'Chicago', timezone: 'America/Chicago' },
  '202': { state: 'DC', city: 'Washington DC', timezone: 'America/New_York' },
  '404': { state: 'GA', city: 'Atlanta', timezone: 'America/New_York' },
  '702': { state: 'NV', city: 'Las Vegas', timezone: 'America/Los_Angeles' },
  '602': { state: 'AZ', city: 'Phoenix', timezone: 'America/Phoenix' },
  '206': { state: 'WA', city: 'Seattle', timezone: 'America/Los_Angeles' },
  '303': { state: 'CO', city: 'Denver', timezone: 'America/Denver' },
  '617': { state: 'MA', city: 'Boston', timezone: 'America/New_York' },
  '215': { state: 'PA', city: 'Philadelphia', timezone: 'America/New_York' },
};

// Get location info from area code
export function getAreaCodeInfo(areaCode: string): {
  state: string;
  city: string;
  timezone: string;
} | null {
  return AREA_CODES[areaCode] || null;
}

// Carrier identification (based on NPA-NXX)
// This would normally use a paid API, but we can provide lookup links
export async function lookupCarrier(phone: string): Promise<{
  carrier?: string;
  lineType?: 'mobile' | 'landline' | 'voip' | 'unknown';
  lookupUrls: { name: string; url: string }[];
}> {
  const parsed = parsePhoneNumber(phone);

  // Free lookup URLs
  const lookupUrls = [
    { name: 'FCC Number Lookup', url: `https://www.fcc.gov/consumers/guides/wireless-phone-numbering` },
    { name: 'Free Carrier Lookup', url: `https://freecarrierlookup.com/` },
    { name: 'Carrier Lookup', url: `https://www.carrierlookup.com/` },
  ];

  return {
    lineType: 'unknown',
    lookupUrls,
  };
}

// Check if number is on Do Not Call registry
export async function checkDoNotCall(phone: string): Promise<{
  isRegistered: boolean | null;
  checkUrl: string;
}> {
  return {
    isRegistered: null,
    checkUrl: 'https://www.donotcall.gov/verify.html',
  };
}

// Reverse phone lookup - aggregates free sources
export async function reversePhoneLookup(phone: string): Promise<{
  parsed: ReturnType<typeof parsePhoneNumber>;
  location: ReturnType<typeof getAreaCodeInfo>;
  searchUrls: { name: string; url: string }[];
}> {
  const parsed = parsePhoneNumber(phone);
  const location = getAreaCodeInfo(parsed.areaCode);

  // Free reverse lookup sources
  const searchUrls = [
    { name: 'Whitepages', url: `https://www.whitepages.com/phone/${parsed.cleaned}` },
    { name: 'TrueCaller', url: `https://www.truecaller.com/search/us/${parsed.cleaned}` },
    { name: 'SpyDialer', url: `https://www.spydialer.com/` },
    { name: 'That\'s Them', url: `https://thatsthem.com/phone/${parsed.formatted.replace(/\D/g, '')}` },
    { name: 'Google Search', url: `https://www.google.com/search?q="${parsed.formatted}"` },
    { name: 'Fast People Search', url: `https://www.fastpeoplesearch.com/` },
  ];

  return { parsed, location, searchUrls };
}

// Email validation and lookup
export function parseEmail(email: string): {
  raw: string;
  local: string;
  domain: string;
  isValid: boolean;
  provider?: string;
  isPersonal: boolean;
  isCorporate: boolean;
} {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);

  const [local, domain] = email.toLowerCase().split('@');

  // Personal email providers
  const personalProviders = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'me.com', 'live.com', 'msn.com', 'protonmail.com',
    'mail.com', 'ymail.com', 'zoho.com', 'gmx.com',
  ];

  const isPersonal = personalProviders.some(p => domain?.endsWith(p));
  const isCorporate = isValid && !isPersonal;

  // Detect provider
  let provider: string | undefined;
  if (domain?.includes('gmail')) provider = 'Google';
  else if (domain?.includes('yahoo') || domain?.includes('ymail')) provider = 'Yahoo';
  else if (domain?.includes('hotmail') || domain?.includes('outlook') || domain?.includes('live') || domain?.includes('msn')) provider = 'Microsoft';
  else if (domain?.includes('icloud') || domain?.includes('me.com')) provider = 'Apple';
  else if (domain?.includes('aol')) provider = 'AOL';
  else if (domain?.includes('protonmail')) provider = 'ProtonMail';

  return {
    raw: email,
    local: local || '',
    domain: domain || '',
    isValid,
    provider,
    isPersonal,
    isCorporate,
  };
}

// Reverse email lookup
export async function reverseEmailLookup(email: string): Promise<{
  parsed: ReturnType<typeof parseEmail>;
  searchUrls: { name: string; url: string }[];
  verificationUrls: { name: string; url: string }[];
}> {
  const parsed = parseEmail(email);

  // Search URLs
  const searchUrls = [
    { name: 'Google Search', url: `https://www.google.com/search?q="${encodeURIComponent(email)}"` },
    { name: 'That\'s Them', url: `https://thatsthem.com/email/${encodeURIComponent(email)}` },
    { name: 'Have I Been Pwned', url: `https://haveibeenpwned.com/` },
  ];

  // Email verification services (free tiers)
  const verificationUrls = [
    { name: 'Hunter.io', url: 'https://hunter.io/email-verifier' },
    { name: 'NeverBounce', url: 'https://neverbounce.com/email-verification' },
    { name: 'ZeroBounce', url: 'https://www.zerobounce.net/free-email-verifier/' },
  ];

  return { parsed, searchUrls, verificationUrls };
}

// Find email patterns for a company domain
export function guessCompanyEmailPatterns(
  firstName: string,
  lastName: string,
  domain: string
): string[] {
  const first = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const last = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const firstInitial = first.charAt(0);
  const lastInitial = last.charAt(0);

  // Common corporate email patterns
  return [
    `${first}.${last}@${domain}`,           // john.doe@company.com
    `${firstInitial}${last}@${domain}`,     // jdoe@company.com
    `${first}${last}@${domain}`,            // johndoe@company.com
    `${first}_${last}@${domain}`,           // john_doe@company.com
    `${first}@${domain}`,                    // john@company.com
    `${last}.${first}@${domain}`,           // doe.john@company.com
    `${firstInitial}.${last}@${domain}`,    // j.doe@company.com
    `${first}${lastInitial}@${domain}`,     // johnd@company.com
    `${last}@${domain}`,                     // doe@company.com
  ];
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

// Validate phone format
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
}

// Format phone for display
export function formatPhone(phone: string, format: 'standard' | 'dots' | 'dashes' | 'e164' = 'standard'): string {
  const parsed = parsePhoneNumber(phone);
  if (!parsed.isValid) return phone;

  switch (format) {
    case 'standard':
      return `(${parsed.areaCode}) ${parsed.exchange}-${parsed.subscriber}`;
    case 'dots':
      return `${parsed.areaCode}.${parsed.exchange}.${parsed.subscriber}`;
    case 'dashes':
      return `${parsed.areaCode}-${parsed.exchange}-${parsed.subscriber}`;
    case 'e164':
      return `+1${parsed.cleaned}`;
    default:
      return parsed.formatted;
  }
}

// Export all functions
export const PhoneEmail = {
  parsePhone: parsePhoneNumber,
  parseEmail,
  getAreaCodeInfo,
  lookupCarrier,
  checkDoNotCall,
  reversePhone: reversePhoneLookup,
  reverseEmail: reverseEmailLookup,
  guessEmails: guessCompanyEmailPatterns,
  isValidEmail,
  isValidPhone,
  formatPhone,
  areaCodes: AREA_CODES,
};
