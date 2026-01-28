// SkipTrace Engine - Orchestrates all data sources
// Provides unified search across all available sources

import {
  Person,
  BusinessEntity,
  PersonSearchParams,
  BusinessSearchParams,
  PropertySearchParams,
  CourtSearchParams,
  SearchResult,
  SkipTraceReport,
} from './types';

import { SECEdgar } from './sources/sec-edgar';
import { StateCorporations } from './sources/state-corporations';
import { PropertyRecords } from './sources/property-records';
import { CourtRecords } from './sources/court-records';
import { ProfessionalLicenses } from './sources/professional-licenses';
import { SocialMedia } from './sources/social-media';
import { PhoneEmail } from './sources/phone-email';
import { VehicleRecords } from './sources/vehicle-records';

// Search modes
export type SearchMode = 'quick' | 'standard' | 'deep';

// Search result aggregator
interface AggregatedResults {
  person?: Partial<Person>;
  businesses: BusinessEntity[];
  sources: string[];
  searchLinks: { name: string; url: string; category: string }[];
  warnings: string[];
  searchTime: number;
}

// Main person search - aggregates all sources
export async function searchPerson(
  params: PersonSearchParams,
  mode: SearchMode = 'standard'
): Promise<AggregatedResults> {
  const startTime = Date.now();
  const results: AggregatedResults = {
    businesses: [],
    sources: [],
    searchLinks: [],
    warnings: [],
    searchTime: 0,
  };

  const { firstName, lastName, phone, email, address, city, state } = params;

  // Build partial person record
  const person: Partial<Person> = {
    firstName,
    lastName,
    phones: [],
    emails: [],
    addresses: [],
    socialProfiles: [],
  };

  // Parallel search across sources
  const searchPromises: Promise<void>[] = [];

  // 1. Phone lookup
  if (phone) {
    searchPromises.push(
      PhoneEmail.reversePhone(phone).then(result => {
        if (result.location) {
          person.addresses = person.addresses || [];
          person.addresses.push({
            street: '',
            city: result.location.city,
            state: result.location.state,
            zip: '',
            type: 'unknown',
            confidence: 0.5,
            source: 'Phone Area Code',
          });
        }
        result.searchUrls.forEach(url => {
          results.searchLinks.push({ ...url, category: 'Phone Lookup' });
        });
        results.sources.push('Phone Records');
      }).catch(() => {})
    );
  }

  // 2. Email lookup
  if (email) {
    searchPromises.push(
      PhoneEmail.reverseEmail(email).then(result => {
        result.searchUrls.forEach(url => {
          results.searchLinks.push({ ...url, category: 'Email Lookup' });
        });
        results.sources.push('Email Records');
      }).catch(() => {})
    );
  }

  // 3. Social media search
  if (firstName && lastName) {
    searchPromises.push(
      SocialMedia.searchProfiles(firstName, lastName, {
        location: city && state ? `${city}, ${state}` : undefined,
      }).then(result => {
        result.searchLinks.forEach(link => {
          results.searchLinks.push({ name: link.platform, url: link.url, category: 'Social Media' });
        });
        results.sources.push('Social Media');
      }).catch(() => {})
    );
  }

  // 4. Professional licenses
  if (firstName && lastName) {
    searchPromises.push(
      ProfessionalLicenses.searchByName(firstName, lastName, state).then(result => {
        result.searchUrls.forEach(url => {
          results.searchLinks.push({ ...url, category: 'Professional Licenses' });
        });
        results.sources.push('Professional Licenses');
      }).catch(() => {})
    );
  }

  // 5. Court records
  if (firstName && lastName) {
    searchPromises.push(
      CourtRecords.searchByName(firstName, lastName, state).then(result => {
        result.searchUrls.forEach(url => {
          results.searchLinks.push({ ...url, category: 'Court Records' });
        });
        results.sources.push('Court Records');
      }).catch(() => {})
    );
  }

  // 6. Property records (if address provided)
  if (address && city && state) {
    searchPromises.push(
      PropertyRecords.searchByAddress(address, city, state).then(result => {
        if (result.searchUrl) {
          results.searchLinks.push({
            name: 'County Property Records',
            url: result.searchUrl,
            category: 'Property Records',
          });
        }
        results.sources.push('Property Records');
      }).catch(() => {})
    );
  }

  // 7. SEC filings (for executives)
  if (firstName && lastName && mode !== 'quick') {
    searchPromises.push(
      SECEdgar.searchPerson(`${firstName} ${lastName}`).then(result => {
        results.businesses.push(...result.companies.map(c => ({
          id: `sec-${c.cik}`,
          name: c.name,
          entityType: 'corporation' as const,
          status: 'active' as const,
          stateOfFormation: 'Unknown',
          fileNumber: c.cik,
          filingDate: c.filingDate,
          source: 'SEC EDGAR',
          sourceUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${c.cik}`,
          lastUpdated: new Date().toISOString(),
        })));
        if (result.companies.length > 0) {
          results.sources.push('SEC EDGAR');
        }
      }).catch(() => {})
    );
  }

  // Wait for all searches
  await Promise.all(searchPromises);

  results.person = person;
  results.searchTime = Date.now() - startTime;

  return results;
}

// Business entity search
export async function searchBusiness(
  params: BusinessSearchParams,
  mode: SearchMode = 'standard'
): Promise<AggregatedResults> {
  const startTime = Date.now();
  const results: AggregatedResults = {
    businesses: [],
    sources: [],
    searchLinks: [],
    warnings: [],
    searchTime: 0,
  };

  const { name, state, officerName } = params;

  const searchPromises: Promise<void>[] = [];

  // 1. OpenCorporates search
  if (name) {
    searchPromises.push(
      StateCorporations.searchOpenCorporates(name, state ? `us_${state.toLowerCase()}` : undefined)
        .then(entities => {
          results.businesses.push(...entities);
          if (entities.length > 0) {
            results.sources.push('OpenCorporates');
          }
        }).catch(() => {})
    );
  }

  // 2. SEC EDGAR search
  if (name) {
    searchPromises.push(
      SECEdgar.searchCompanies(name).then(async companies => {
        for (const company of companies.slice(0, 5)) {
          const details = await SECEdgar.getCompanyDetails(company.cik);
          if (details) {
            results.businesses.push(details);
          }
        }
        if (companies.length > 0) {
          results.sources.push('SEC EDGAR');
        }
      }).catch(() => {})
    );
  }

  // 3. State-specific searches
  if (state) {
    const stateUpper = state.toUpperCase();
    if (stateUpper === 'FL' || stateUpper === 'FLORIDA') {
      searchPromises.push(
        StateCorporations.searchFlorida(name || '', officerName ? 'officer' : 'name')
          .then(entities => {
            results.businesses.push(...entities);
            results.searchLinks.push({
              name: 'Florida Sunbiz',
              url: 'https://search.sunbiz.org/Inquiry/CorporationSearch/ByName',
              category: 'State Corporations',
            });
            results.sources.push('Florida Sunbiz');
          }).catch(() => {})
      );
    }
  }

  // 4. UCC filings search
  if (name) {
    searchPromises.push(
      CourtRecords.searchUCC(name, state).then(result => {
        result.searchUrls.forEach(url => {
          results.searchLinks.push({ ...url, category: 'UCC Filings' });
        });
        results.sources.push('UCC Filings');
      }).catch(() => {})
    );
  }

  await Promise.all(searchPromises);

  results.searchTime = Date.now() - startTime;

  return results;
}

// Property search
export async function searchProperty(
  params: PropertySearchParams
): Promise<{
  properties: import('./types').PropertyRecord[];
  searchLinks: { name: string; url: string; category: string }[];
  sources: string[];
}> {
  const { address, city, state, county, ownerName, parcelId } = params;

  const searchLinks: { name: string; url: string; category: string }[] = [];
  const sources: string[] = [];

  if (address && city && state) {
    const result = await PropertyRecords.searchByAddress(address, city, state);
    sources.push(...result.sources);
    if (result.searchUrl) {
      searchLinks.push({
        name: 'County Assessor',
        url: result.searchUrl,
        category: 'Property Records',
      });
    }
  } else if (ownerName) {
    const result = await PropertyRecords.searchByOwner(ownerName, state, county);
    sources.push(...result.sources);
  } else if (parcelId && state && county) {
    const result = await PropertyRecords.searchByParcel(parcelId, state, county);
    sources.push(...result.sources);
    if (result.searchUrl) {
      searchLinks.push({
        name: 'County Assessor',
        url: result.searchUrl,
        category: 'Property Records',
      });
    }
  }

  return {
    properties: [],
    searchLinks,
    sources,
  };
}

// Court records search
export async function searchCourt(
  params: CourtSearchParams
): Promise<{
  records: import('./types').CourtRecord[];
  searchLinks: { name: string; url: string; category: string }[];
  sources: string[];
}> {
  const { name, caseNumber, state, courtType } = params;

  const searchLinks: { name: string; url: string; category: string }[] = [];
  const sources: string[] = [];

  if (name) {
    const [firstName, ...rest] = name.split(' ');
    const lastName = rest.join(' ') || firstName;

    const courtResults = await CourtRecords.searchByName(
      firstName,
      lastName,
      state,
      courtType as 'civil' | 'criminal' | 'family' | 'bankruptcy' | 'all'
    );

    sources.push(...courtResults.sources);
    courtResults.searchUrls.forEach(url => {
      searchLinks.push({ ...url, category: 'Court Records' });
    });

    // Also search bankruptcy
    const bankruptcyResults = await CourtRecords.searchBankruptcy(name, state);
    bankruptcyResults.searchUrls.forEach(url => {
      searchLinks.push({ ...url, category: 'Bankruptcy Records' });
    });

    // And liens/judgments
    const lienResults = await CourtRecords.searchLiensJudgments(name, state);
    lienResults.searchUrls.forEach(url => {
      searchLinks.push({ ...url, category: 'Liens & Judgments' });
    });
  }

  if (caseNumber) {
    const result = await CourtRecords.searchByCase(caseNumber);
    sources.push(...result.sources);
    result.searchUrls.forEach(url => {
      searchLinks.push({ ...url, category: 'Court Records' });
    });
  }

  return {
    records: [],
    searchLinks,
    sources,
  };
}

// VIN lookup
export async function lookupVIN(vin: string): Promise<{
  decoded: Awaited<ReturnType<typeof VehicleRecords.decodeVIN>>;
  recalls: Awaited<ReturnType<typeof VehicleRecords.checkRecalls>>;
  complaints: Awaited<ReturnType<typeof VehicleRecords.checkComplaints>>;
}> {
  const [decoded, recalls, complaints] = await Promise.all([
    VehicleRecords.decodeVIN(vin),
    VehicleRecords.checkRecalls(vin),
    VehicleRecords.checkComplaints(vin),
  ]);

  return { decoded, recalls, complaints };
}

// Generate comprehensive skip trace report
export async function generateReport(
  type: 'person' | 'business',
  params: PersonSearchParams | BusinessSearchParams,
  mode: SearchMode = 'deep'
): Promise<SkipTraceReport> {
  const startTime = Date.now();

  let results: AggregatedResults;

  if (type === 'person') {
    results = await searchPerson(params as PersonSearchParams, mode);
  } else {
    results = await searchBusiness(params as BusinessSearchParams, mode);
  }

  const report: SkipTraceReport = {
    id: `report-${Date.now()}`,
    type,
    subject: {
      name: type === 'person'
        ? `${(params as PersonSearchParams).firstName} ${(params as PersonSearchParams).lastName}`
        : (params as BusinessSearchParams).name || 'Unknown',
    },
    generatedAt: new Date().toISOString(),
    sections: [],
    summary: '',
    recommendations: [],
  };

  // Add sections based on findings
  if (results.person) {
    report.sections.push({
      title: 'Person Information',
      data: results.person,
      sources: results.sources.filter(s => ['Phone Records', 'Email Records'].includes(s)),
      confidence: 0.7,
    });
  }

  if (results.businesses.length > 0) {
    report.sections.push({
      title: 'Business Associations',
      data: results.businesses,
      sources: results.sources.filter(s => ['SEC EDGAR', 'OpenCorporates', 'Florida Sunbiz'].includes(s)),
      confidence: 0.9,
    });
  }

  // Add search links section
  report.sections.push({
    title: 'Additional Search Resources',
    data: results.searchLinks,
    sources: [],
    confidence: 1.0,
  });

  // Generate summary
  const totalSources = results.sources.length;
  const businessCount = results.businesses.length;

  report.summary = `Skip trace completed in ${Date.now() - startTime}ms. Searched ${totalSources} data sources. Found ${businessCount} business associations.`;

  return report;
}

// Quick phone lookup
export async function quickPhoneLookup(phone: string) {
  return PhoneEmail.reversePhone(phone);
}

// Quick email lookup
export async function quickEmailLookup(email: string) {
  return PhoneEmail.reverseEmail(email);
}

// Export engine
export const SkipTraceEngine = {
  searchPerson,
  searchBusiness,
  searchProperty,
  searchCourt,
  lookupVIN,
  generateReport,
  quickPhoneLookup,
  quickEmailLookup,
};

export default SkipTraceEngine;
