// AI-Powered Skip Trace Search Service
// Uses Vercel AI SDK with OpenAI/Anthropic to generate realistic search results

import { z } from 'zod';
import { createAIProvider } from '../providers/llm/vercel-ai';
import type {
  PersonSearchParams,
  BusinessSearchParams,
  PropertySearchParams,
  CourtSearchParams,
} from './types';

// Zod schemas for AI-generated data

const PhoneRecordSchema = z.object({
  number: z.string(),
  type: z.enum(['mobile', 'landline', 'voip', 'unknown']),
  carrier: z.string().optional(),
  lineType: z.string().optional(),
  isConnected: z.boolean().optional(),
  lastSeen: z.string().optional(),
  confidence: z.number(),
  source: z.string(),
});

const EmailRecordSchema = z.object({
  address: z.string(),
  type: z.enum(['personal', 'work', 'unknown']),
  isValid: z.boolean().optional(),
  provider: z.string().optional(),
  lastSeen: z.string().optional(),
  confidence: z.number(),
  source: z.string(),
});

const AddressRecordSchema = z.object({
  street: z.string(),
  street2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  county: z.string().optional(),
  type: z.enum(['current', 'previous', 'mailing', 'unknown']),
  dateFirst: z.string().optional(),
  dateLast: z.string().optional(),
  isOwned: z.boolean().optional(),
  propertyValue: z.number().optional(),
  confidence: z.number(),
  source: z.string(),
});

const RelativeRecordSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  relationship: z.enum(['spouse', 'parent', 'child', 'sibling', 'other']),
  age: z.number().optional(),
  sharedAddresses: z.array(z.string()).optional(),
  phones: z.array(z.string()).optional(),
  confidence: z.number(),
});

const EmploymentRecordSchema = z.object({
  company: z.string(),
  title: z.string().optional(),
  department: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean(),
  address: z.string().optional(),
  phone: z.string().optional(),
  confidence: z.number(),
  source: z.string(),
});

const SocialProfileSchema = z.object({
  platform: z.enum(['linkedin', 'facebook', 'twitter', 'instagram', 'tiktok', 'github', 'other']),
  username: z.string().optional(),
  url: z.string(),
  displayName: z.string().optional(),
  bio: z.string().optional(),
  followers: z.number().optional(),
  verified: z.boolean().optional(),
  lastActive: z.string().optional(),
  confidence: z.number(),
});

const PropertyRecordSchema = z.object({
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  county: z.string(),
  parcelId: z.string().optional(),
  ownerName: z.string(),
  ownerType: z.enum(['individual', 'trust', 'llc', 'corporation']),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().optional(),
  assessedValue: z.number().optional(),
  marketValue: z.number().optional(),
  taxAmount: z.number().optional(),
  yearBuilt: z.number().optional(),
  sqft: z.number().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  lotSize: z.string().optional(),
  propertyType: z.enum(['single_family', 'condo', 'townhouse', 'multi_family', 'land', 'commercial', 'other']),
  source: z.string(),
  sourceUrl: z.string().optional(),
});

const CourtRecordSchema = z.object({
  caseNumber: z.string(),
  court: z.string(),
  courtType: z.enum(['civil', 'criminal', 'family', 'traffic', 'small_claims', 'federal', 'bankruptcy']),
  jurisdiction: z.string(),
  filingDate: z.string(),
  caseType: z.string(),
  caseStatus: z.enum(['open', 'closed', 'pending', 'dismissed']),
  parties: z.array(z.object({
    role: z.enum(['plaintiff', 'defendant', 'petitioner', 'respondent', 'debtor', 'creditor']),
    name: z.string(),
  })),
  charges: z.array(z.string()).optional(),
  disposition: z.string().optional(),
  dispositionDate: z.string().optional(),
  judgmentAmount: z.number().optional(),
  attorney: z.string().optional(),
  source: z.string(),
  sourceUrl: z.string().optional(),
});

const LicenseRecordSchema = z.object({
  licenseNumber: z.string(),
  type: z.string(),
  status: z.enum(['active', 'inactive', 'expired', 'revoked', 'suspended']),
  issuingAuthority: z.string(),
  state: z.string(),
  issueDate: z.string(),
  expirationDate: z.string(),
  holderName: z.string(),
  holderAddress: z.string().optional(),
  source: z.string(),
  sourceUrl: z.string().optional(),
});

const BusinessEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  dbaNames: z.array(z.string()).optional(),
  entityType: z.enum(['corporation', 'llc', 'partnership', 'sole_proprietorship', 'nonprofit', 'trust', 'other']),
  status: z.enum(['active', 'inactive', 'dissolved', 'suspended', 'forfeited']),
  stateOfFormation: z.string(),
  fileNumber: z.string(),
  filingDate: z.string(),
  principalAddress: z.string().optional(),
  mailingAddress: z.string().optional(),
  registeredAgent: z.object({
    name: z.string(),
    address: z.string(),
  }).optional(),
  officers: z.array(z.object({
    name: z.string(),
    title: z.string(),
    address: z.string().optional(),
    startDate: z.string().optional(),
  })).optional(),
  source: z.string(),
  sourceUrl: z.string().optional(),
  lastUpdated: z.string(),
});

const VehicleRecordSchema = z.object({
  vin: z.string().optional(),
  year: z.number(),
  make: z.string(),
  model: z.string(),
  color: z.string().optional(),
  licensePlate: z.string().optional(),
  state: z.string().optional(),
  registeredOwner: z.string(),
  registrationDate: z.string().optional(),
  expirationDate: z.string().optional(),
  titleNumber: z.string().optional(),
  lienHolder: z.string().optional(),
  source: z.string(),
});

const AssetRecordSchema = z.object({
  type: z.enum(['vehicle', 'property', 'business', 'boat', 'aircraft', 'investment']),
  description: z.string(),
  estimatedValue: z.number().optional(),
  location: z.string().optional(),
  acquisitionDate: z.string().optional(),
  source: z.string(),
});

// Person search result schema
const PersonSearchResultSchema = z.object({
  person: z.object({
    firstName: z.string(),
    lastName: z.string(),
    middleName: z.string().optional(),
    aliases: z.array(z.string()).optional(),
    dateOfBirth: z.string().optional(),
    age: z.number().optional(),
    gender: z.string().optional(),
    phones: z.array(PhoneRecordSchema),
    emails: z.array(EmailRecordSchema),
    addresses: z.array(AddressRecordSchema),
    relatives: z.array(RelativeRecordSchema).optional(),
    employment: z.array(EmploymentRecordSchema).optional(),
    socialProfiles: z.array(SocialProfileSchema).optional(),
    confidence: z.number(),
    sources: z.array(z.string()),
  }),
  summary: z.string(),
});

// Business search result schema
const BusinessSearchResultSchema = z.object({
  businesses: z.array(BusinessEntitySchema),
  summary: z.string(),
});

// Property search result schema
const PropertySearchResultSchema = z.object({
  properties: z.array(PropertyRecordSchema),
  summary: z.string(),
});

// Court search result schema
const CourtSearchResultSchema = z.object({
  records: z.array(CourtRecordSchema),
  summary: z.string(),
});

// Phone lookup result schema
const PhoneLookupResultSchema = z.object({
  parsed: z.object({
    countryCode: z.string(),
    areaCode: z.string(),
    exchange: z.string(),
    subscriber: z.string(),
    formatted: z.string(),
  }),
  location: z.object({
    city: z.string(),
    state: z.string(),
    timezone: z.string(),
    county: z.string().optional(),
  }),
  carrier: z.object({
    name: z.string(),
    type: z.enum(['mobile', 'landline', 'voip', 'unknown']),
    mcc: z.string().optional(),
    mnc: z.string().optional(),
  }),
  owner: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    type: z.enum(['residential', 'business', 'unknown']).optional(),
  }).optional(),
  spam: z.object({
    isSpam: z.boolean(),
    score: z.number(),
    reports: z.number(),
  }),
  doNotCall: z.object({
    isRegistered: z.boolean(),
    registrationDate: z.string().optional(),
  }),
  summary: z.string(),
});

// Email lookup result schema
const EmailLookupResultSchema = z.object({
  parsed: z.object({
    localPart: z.string(),
    domain: z.string(),
    fullAddress: z.string(),
  }),
  validation: z.object({
    isValid: z.boolean(),
    isDeliverable: z.boolean(),
    isFreeProvider: z.boolean(),
    isDisposable: z.boolean(),
    mxRecords: z.array(z.string()),
  }),
  owner: z.object({
    name: z.string().optional(),
    company: z.string().optional(),
    title: z.string().optional(),
    location: z.string().optional(),
  }).optional(),
  socialProfiles: z.array(SocialProfileSchema).optional(),
  breaches: z.array(z.object({
    source: z.string(),
    date: z.string(),
    dataTypes: z.array(z.string()),
  })).optional(),
  summary: z.string(),
});

// Licenses search result schema
const LicensesSearchResultSchema = z.object({
  licenses: z.array(LicenseRecordSchema),
  summary: z.string(),
});

// Criminal records result schema
const CriminalSearchResultSchema = z.object({
  records: z.array(z.object({
    caseNumber: z.string(),
    court: z.string(),
    jurisdiction: z.string(),
    arrestDate: z.string().optional(),
    chargeDate: z.string(),
    charges: z.array(z.object({
      description: z.string(),
      severity: z.enum(['felony', 'misdemeanor', 'infraction']),
      statute: z.string().optional(),
    })),
    disposition: z.string().optional(),
    dispositionDate: z.string().optional(),
    sentence: z.string().optional(),
    source: z.string(),
  })),
  sexOffenderCheck: z.object({
    isRegistered: z.boolean(),
    jurisdiction: z.string().optional(),
    tier: z.string().optional(),
  }),
  summary: z.string(),
});

// Assets search result schema
const AssetsSearchResultSchema = z.object({
  properties: z.array(PropertyRecordSchema).optional(),
  vehicles: z.array(VehicleRecordSchema).optional(),
  businesses: z.array(BusinessEntitySchema).optional(),
  otherAssets: z.array(AssetRecordSchema).optional(),
  totalEstimatedValue: z.number().optional(),
  summary: z.string(),
});

// Relatives search result schema
const RelativesSearchResultSchema = z.object({
  relatives: z.array(z.object({
    firstName: z.string(),
    lastName: z.string(),
    relationship: z.enum(['spouse', 'parent', 'child', 'sibling', 'other']),
    age: z.number().optional(),
    dateOfBirth: z.string().optional(),
    currentAddress: z.string().optional(),
    phones: z.array(z.string()).optional(),
    emails: z.array(z.string()).optional(),
    confidence: z.number(),
  })),
  associates: z.array(z.object({
    firstName: z.string(),
    lastName: z.string(),
    relationship: z.enum(['business', 'neighbor', 'coworker', 'other']),
    sharedAddresses: z.array(z.string()).optional(),
    confidence: z.number(),
  })).optional(),
  summary: z.string(),
});

// Employment history result schema
const EmploymentSearchResultSchema = z.object({
  employmentHistory: z.array(z.object({
    company: z.string(),
    title: z.string(),
    department: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    isCurrent: z.boolean(),
    salary: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    supervisorName: z.string().optional(),
    confidence: z.number(),
    source: z.string(),
  })),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string().optional(),
    fieldOfStudy: z.string().optional(),
    graduationYear: z.number().optional(),
    source: z.string(),
  })).optional(),
  summary: z.string(),
});

// Address history result schema
const AddressHistoryResultSchema = z.object({
  addresses: z.array(z.object({
    street: z.string(),
    street2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    county: z.string().optional(),
    type: z.enum(['current', 'previous', 'mailing', 'unknown']),
    dateFirst: z.string().optional(),
    dateLast: z.string().optional(),
    durationMonths: z.number().optional(),
    isOwned: z.boolean().optional(),
    propertyValue: z.number().optional(),
    otherResidents: z.array(z.string()).optional(),
    confidence: z.number(),
    source: z.string(),
  })),
  summary: z.string(),
});

// Social media search result schema
const SocialSearchResultSchema = z.object({
  profiles: z.array(SocialProfileSchema),
  summary: z.string(),
});

// VIN lookup result schema
const VINLookupResultSchema = z.object({
  vehicle: z.object({
    vin: z.string(),
    year: z.number(),
    make: z.string(),
    model: z.string(),
    trim: z.string().optional(),
    bodyStyle: z.string().optional(),
    engine: z.string().optional(),
    transmission: z.string().optional(),
    drivetrain: z.string().optional(),
    color: z.string().optional(),
    interiorColor: z.string().optional(),
    fuelType: z.string().optional(),
    manufacturerCountry: z.string().optional(),
    plantCity: z.string().optional(),
  }),
  registrations: z.array(z.object({
    state: z.string(),
    plateNumber: z.string().optional(),
    registrationDate: z.string().optional(),
    expirationDate: z.string().optional(),
    ownerName: z.string().optional(),
    ownerAddress: z.string().optional(),
  })).optional(),
  titleHistory: z.array(z.object({
    state: z.string(),
    issueDate: z.string(),
    titleNumber: z.string().optional(),
    odometerReading: z.number().optional(),
    brandedTitle: z.boolean().optional(),
    titleBrand: z.string().optional(),
  })).optional(),
  recalls: z.array(z.object({
    campaignNumber: z.string(),
    component: z.string(),
    summary: z.string(),
    consequence: z.string(),
    remedy: z.string(),
    recallDate: z.string(),
    isCompleted: z.boolean().optional(),
  })).optional(),
  accidents: z.array(z.object({
    date: z.string(),
    severity: z.enum(['minor', 'moderate', 'severe']),
    description: z.string(),
    damageArea: z.string().optional(),
    estimatedRepairCost: z.number().optional(),
  })).optional(),
  estimatedValue: z.object({
    retail: z.number(),
    private: z.number(),
    tradeIn: z.number(),
  }).optional(),
  summary: z.string(),
});

// AI Search Provider
const aiProvider = createAIProvider();

// Generate system prompt for skip trace searches
function getSystemPrompt(): string {
  return `You are an AI-powered skip trace and public records search assistant. Your role is to generate realistic, detailed search results based on the provided search parameters.

IMPORTANT GUIDELINES:
1. Generate realistic, plausible data that would be typical for the given search parameters
2. Use realistic names, addresses, phone numbers, and other details that are consistent with each other
3. Include appropriate confidence scores (0.0-1.0) based on how reliable the data would typically be
4. Reference realistic data sources like "Public Records Database", "Credit Bureau Data", "Voter Registration", "Property Tax Records", etc.
5. Generate data that is internally consistent (e.g., ages match birth dates, addresses are in the right state, etc.)
6. For phone numbers, use realistic area codes for the specified location
7. For addresses, use realistic street names and formats for the specified city/state
8. Include a mix of current and historical data where appropriate
9. Generate appropriate amounts of data - not too sparse, not overwhelming
10. All generated data should be marked as coming from "AI: Vercel AI SDK" as the source

Remember: This is for demonstration/educational purposes. Generate realistic but fictional data.`;
}

// Person search using AI
export async function searchPersonAI(params: PersonSearchParams) {
  const startTime = Date.now();

  const prompt = `Generate comprehensive skip trace results for a person search with the following parameters:
${params.firstName ? `First Name: ${params.firstName}` : ''}
${params.lastName ? `Last Name: ${params.lastName}` : ''}
${params.middleName ? `Middle Name: ${params.middleName}` : ''}
${params.city ? `City: ${params.city}` : ''}
${params.state ? `State: ${params.state}` : ''}
${params.zip ? `ZIP Code: ${params.zip}` : ''}
${params.phone ? `Phone: ${params.phone}` : ''}
${params.email ? `Email: ${params.email}` : ''}
${params.address ? `Address: ${params.address}` : ''}
${params.age ? `Age: ${params.age}` : ''}

Generate realistic person data including:
- Full contact information (2-3 phone numbers, 1-2 email addresses)
- Current and previous addresses (2-4 addresses)
- Family members/relatives (2-4 people)
- Employment history (1-3 jobs)
- Social media profiles (2-4 platforms)

Mark all sources as "AI: Vercel AI SDK".`;

  try {
    const result = await aiProvider.completeStructured(
      [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      { schema: PersonSearchResultSchema, schemaName: 'PersonSearchResult' },
      { temperature: 0.7 }
    );

    return {
      person: result.person,
      businesses: [],
      sources: ['AI: Vercel AI SDK'],
      searchLinks: [],
      warnings: [],
      searchTime: Date.now() - startTime,
      summary: result.summary,
    };
  } catch (error) {
    console.error('AI person search error:', error);
    throw new Error('Failed to generate AI search results');
  }
}

// Business search using AI
export async function searchBusinessAI(params: BusinessSearchParams) {
  const startTime = Date.now();

  const prompt = `Generate comprehensive skip trace results for a business search with the following parameters:
${params.name ? `Business Name: ${params.name}` : ''}
${params.state ? `State: ${params.state}` : ''}
${params.fileNumber ? `File Number: ${params.fileNumber}` : ''}
${params.officerName ? `Officer Name: ${params.officerName}` : ''}

Generate realistic business data including:
- 2-5 business entities (corporations, LLCs, etc.)
- Officers and directors for each
- Registration information
- Addresses and registered agents

Mark all sources as "AI: Vercel AI SDK".`;

  try {
    const result = await aiProvider.completeStructured(
      [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      { schema: BusinessSearchResultSchema, schemaName: 'BusinessSearchResult' },
      { temperature: 0.7 }
    );

    return {
      businesses: result.businesses,
      sources: ['AI: Vercel AI SDK'],
      searchLinks: [],
      warnings: [],
      searchTime: Date.now() - startTime,
      summary: result.summary,
    };
  } catch (error) {
    console.error('AI business search error:', error);
    throw new Error('Failed to generate AI search results');
  }
}

// Property search using AI
export async function searchPropertyAI(params: PropertySearchParams) {
  const startTime = Date.now();

  const prompt = `Generate comprehensive property search results with the following parameters:
${params.address ? `Address: ${params.address}` : ''}
${params.city ? `City: ${params.city}` : ''}
${params.state ? `State: ${params.state}` : ''}
${params.county ? `County: ${params.county}` : ''}
${params.ownerName ? `Owner Name: ${params.ownerName}` : ''}
${params.parcelId ? `Parcel ID: ${params.parcelId}` : ''}

Generate realistic property data including:
- 1-3 property records
- Complete property details (value, size, bedrooms, etc.)
- Ownership information
- Tax assessment data

Mark all sources as "AI: Vercel AI SDK".`;

  try {
    const result = await aiProvider.completeStructured(
      [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      { schema: PropertySearchResultSchema, schemaName: 'PropertySearchResult' },
      { temperature: 0.7 }
    );

    return {
      properties: result.properties,
      sources: ['AI: Vercel AI SDK'],
      searchLinks: [],
      searchTime: Date.now() - startTime,
      summary: result.summary,
    };
  } catch (error) {
    console.error('AI property search error:', error);
    throw new Error('Failed to generate AI search results');
  }
}

// Court records search using AI
export async function searchCourtAI(params: CourtSearchParams) {
  const startTime = Date.now();

  const prompt = `Generate comprehensive court records search results with the following parameters:
${params.name ? `Name: ${params.name}` : ''}
${params.caseNumber ? `Case Number: ${params.caseNumber}` : ''}
${params.state ? `State: ${params.state}` : ''}
${params.courtType ? `Court Type: ${params.courtType}` : ''}

Generate realistic court records including:
- 2-4 court cases (mix of civil, criminal, family, etc.)
- Case details, parties, and dispositions
- Filing dates and status

Mark all sources as "AI: Vercel AI SDK".`;

  try {
    const result = await aiProvider.completeStructured(
      [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      { schema: CourtSearchResultSchema, schemaName: 'CourtSearchResult' },
      { temperature: 0.7 }
    );

    return {
      records: result.records,
      sources: ['AI: Vercel AI SDK'],
      searchLinks: [],
      searchTime: Date.now() - startTime,
      summary: result.summary,
    };
  } catch (error) {
    console.error('AI court search error:', error);
    throw new Error('Failed to generate AI search results');
  }
}

// Phone lookup using AI
export async function lookupPhoneAI(phone: string) {
  const startTime = Date.now();

  const prompt = `Generate comprehensive phone lookup results for the phone number: ${phone}

Include:
- Parsed phone number details (area code, exchange, etc.)
- Location information (city, state, timezone)
- Carrier information
- Potential owner information
- Spam score and reports
- Do Not Call registry status

Mark all sources as "AI: Vercel AI SDK".`;

  try {
    const result = await aiProvider.completeStructured(
      [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      { schema: PhoneLookupResultSchema, schemaName: 'PhoneLookupResult' },
      { temperature: 0.7 }
    );

    return {
      ...result,
      sources: ['AI: Vercel AI SDK'],
      searchTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('AI phone lookup error:', error);
    throw new Error('Failed to generate AI search results');
  }
}

// Email lookup using AI
export async function lookupEmailAI(email: string) {
  const startTime = Date.now();

  const prompt = `Generate comprehensive email lookup results for the email address: ${email}

Include:
- Parsed email details (local part, domain)
- Validation results (deliverability, provider type)
- Potential owner information (name, company, title)
- Associated social media profiles (2-3 platforms)
- Data breach history (1-2 breaches if applicable)

Mark all sources as "AI: Vercel AI SDK".`;

  try {
    const result = await aiProvider.completeStructured(
      [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      { schema: EmailLookupResultSchema, schemaName: 'EmailLookupResult' },
      { temperature: 0.7 }
    );

    return {
      ...result,
      sources: ['AI: Vercel AI SDK'],
      searchTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('AI email lookup error:', error);
    throw new Error('Failed to generate AI search results');
  }
}

// Professional licenses search using AI
export async function searchLicensesAI(firstName: string, lastName: string, state?: string) {
  const startTime = Date.now();

  const prompt = `Generate professional license search results for:
Name: ${firstName} ${lastName}
${state ? `State: ${state}` : ''}

Generate 2-4 professional licenses such as:
- Real estate, medical, legal, accounting, contractor licenses
- Include license numbers, status, expiration dates
- Include issuing authority information

Mark all sources as "AI: Vercel AI SDK".`;

  try {
    const result = await aiProvider.completeStructured(
      [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      { schema: LicensesSearchResultSchema, schemaName: 'LicensesSearchResult' },
      { temperature: 0.7 }
    );

    return {
      licenses: result.licenses,
      sources: ['AI: Vercel AI SDK'],
      searchTime: Date.now() - startTime,
      summary: result.summary,
    };
  } catch (error) {
    console.error('AI licenses search error:', error);
    throw new Error('Failed to generate AI search results');
  }
}

// Criminal records search using AI
export async function searchCriminalAI(firstName: string, lastName: string, state?: string) {
  const startTime = Date.now();

  const prompt = `Generate criminal records search results for:
Name: ${firstName} ${lastName}
${state ? `State: ${state}` : ''}

Generate realistic criminal records including:
- 0-3 criminal cases (could be clean record)
- Charges, dispositions, and sentences
- Sex offender registry check

This is for demonstration purposes. Generate fictional but realistic data.
Mark all sources as "AI: Vercel AI SDK".`;

  try {
    const result = await aiProvider.completeStructured(
      [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      { schema: CriminalSearchResultSchema, schemaName: 'CriminalSearchResult' },
      { temperature: 0.7 }
    );

    return {
      records: result.records,
      sexOffenderCheck: result.sexOffenderCheck,
      sources: ['AI: Vercel AI SDK'],
      searchTime: Date.now() - startTime,
      summary: result.summary,
    };
  } catch (error) {
    console.error('AI criminal search error:', error);
    throw new Error('Failed to generate AI search results');
  }
}

// Assets search using AI
export async function searchAssetsAI(firstName: string, lastName: string, state?: string) {
  const startTime = Date.now();

  const prompt = `Generate comprehensive asset search results for:
Name: ${firstName} ${lastName}
${state ? `State: ${state}` : ''}

Generate realistic asset data including:
- 1-3 properties owned
- 1-2 vehicles registered
- 0-2 business interests
- Other assets (boats, aircraft, investments)
- Total estimated net worth

Mark all sources as "AI: Vercel AI SDK".`;

  try {
    const result = await aiProvider.completeStructured(
      [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      { schema: AssetsSearchResultSchema, schemaName: 'AssetsSearchResult' },
      { temperature: 0.7 }
    );

    return {
      ...result,
      sources: ['AI: Vercel AI SDK'],
      searchTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('AI assets search error:', error);
    throw new Error('Failed to generate AI search results');
  }
}

// Relatives search using AI
export async function searchRelativesAI(firstName: string, lastName: string, state?: string) {
  const startTime = Date.now();

  const prompt = `Generate relatives and associates search results for:
Name: ${firstName} ${lastName}
${state ? `State: ${state}` : ''}

Generate realistic data including:
- 3-6 relatives (spouse, parents, children, siblings)
- 2-4 known associates (business partners, neighbors)
- Contact information for each
- Shared addresses where applicable

Mark all sources as "AI: Vercel AI SDK".`;

  try {
    const result = await aiProvider.completeStructured(
      [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      { schema: RelativesSearchResultSchema, schemaName: 'RelativesSearchResult' },
      { temperature: 0.7 }
    );

    return {
      ...result,
      sources: ['AI: Vercel AI SDK'],
      searchTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('AI relatives search error:', error);
    throw new Error('Failed to generate AI search results');
  }
}

// Employment history search using AI
export async function searchEmploymentAI(firstName: string, lastName: string, state?: string) {
  const startTime = Date.now();

  const prompt = `Generate employment history search results for:
Name: ${firstName} ${lastName}
${state ? `State: ${state}` : ''}

Generate realistic employment data including:
- 3-5 employment records (current and past)
- Job titles, companies, dates
- Salary ranges where available
- 1-2 education records

Mark all sources as "AI: Vercel AI SDK".`;

  try {
    const result = await aiProvider.completeStructured(
      [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      { schema: EmploymentSearchResultSchema, schemaName: 'EmploymentSearchResult' },
      { temperature: 0.7 }
    );

    return {
      ...result,
      sources: ['AI: Vercel AI SDK'],
      searchTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('AI employment search error:', error);
    throw new Error('Failed to generate AI search results');
  }
}

// Address history search using AI
export async function searchAddressHistoryAI(firstName: string, lastName: string, state?: string) {
  const startTime = Date.now();

  const prompt = `Generate address history search results for:
Name: ${firstName} ${lastName}
${state ? `State: ${state}` : ''}

Generate realistic address history including:
- 4-7 addresses (current and previous)
- Dates of residence
- Property ownership status
- Other residents at each address

Mark all sources as "AI: Vercel AI SDK".`;

  try {
    const result = await aiProvider.completeStructured(
      [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      { schema: AddressHistoryResultSchema, schemaName: 'AddressHistoryResult' },
      { temperature: 0.7 }
    );

    return {
      ...result,
      sources: ['AI: Vercel AI SDK'],
      searchTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('AI address history search error:', error);
    throw new Error('Failed to generate AI search results');
  }
}

// Social media search using AI
export async function searchSocialAI(firstName: string, lastName: string, location?: string) {
  const startTime = Date.now();

  const prompt = `Generate social media search results for:
Name: ${firstName} ${lastName}
${location ? `Location: ${location}` : ''}

Generate realistic social media profiles including:
- 4-6 profiles across different platforms (LinkedIn, Facebook, Instagram, Twitter, TikTok, GitHub)
- Usernames, profile URLs, bios
- Follower counts, verification status
- Last activity dates

Mark all sources as "AI: Vercel AI SDK".`;

  try {
    const result = await aiProvider.completeStructured(
      [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      { schema: SocialSearchResultSchema, schemaName: 'SocialSearchResult' },
      { temperature: 0.7 }
    );

    return {
      profiles: result.profiles,
      sources: ['AI: Vercel AI SDK'],
      searchTime: Date.now() - startTime,
      summary: result.summary,
    };
  } catch (error) {
    console.error('AI social search error:', error);
    throw new Error('Failed to generate AI search results');
  }
}

// VIN lookup using AI
export async function lookupVINAI(vin: string) {
  const startTime = Date.now();

  const prompt = `Generate comprehensive VIN lookup results for: ${vin}

Include:
- Decoded vehicle information (year, make, model, trim, engine, etc.)
- Registration history (1-2 states)
- Title history (1-3 records)
- Recall information (0-2 recalls)
- Accident history (0-2 accidents)
- Estimated vehicle value (retail, private, trade-in)

Mark all sources as "AI: Vercel AI SDK".`;

  try {
    const result = await aiProvider.completeStructured(
      [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      { schema: VINLookupResultSchema, schemaName: 'VINLookupResult' },
      { temperature: 0.7 }
    );

    return {
      ...result,
      sources: ['AI: Vercel AI SDK'],
      searchTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('AI VIN lookup error:', error);
    throw new Error('Failed to generate AI search results');
  }
}

// Export all AI search functions
export const AISearch = {
  searchPerson: searchPersonAI,
  searchBusiness: searchBusinessAI,
  searchProperty: searchPropertyAI,
  searchCourt: searchCourtAI,
  lookupPhone: lookupPhoneAI,
  lookupEmail: lookupEmailAI,
  searchLicenses: searchLicensesAI,
  searchCriminal: searchCriminalAI,
  searchAssets: searchAssetsAI,
  searchRelatives: searchRelativesAI,
  searchEmployment: searchEmploymentAI,
  searchAddressHistory: searchAddressHistoryAI,
  searchSocial: searchSocialAI,
  lookupVIN: lookupVINAI,
};

export default AISearch;
