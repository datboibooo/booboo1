// Employment History Finder
// Sources: LinkedIn, corporate filings, professional licenses, SEC filings

import { EmploymentRecord } from '../types';

interface EmploymentSearchResult {
  employmentRecords: EmploymentRecord[];
  searchUrls: { name: string; url: string; description: string }[];
}

// Search LinkedIn for employment history
export function getLinkedInSearchUrl(firstName: string, lastName: string, company?: string): string {
  const nameQuery = `${firstName} ${lastName}`;
  if (company) {
    return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(nameQuery)}&company=${encodeURIComponent(company)}`;
  }
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(nameQuery)}`;
}

// Search for employment via SEC filings (executives)
export function getSECEmploymentUrl(name: string): string {
  return `https://efts.sec.gov/LATEST/search?q="${encodeURIComponent(name)}"&dateRange=custom&startdt=2000-01-01&forms=DEF%2014A%2C10-K%2C8-K`;
}

// Job posting sites for current employment
const JOB_SITES = {
  linkedin: (name: string) => `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(name)}`,
  indeed: (company: string) => `https://www.indeed.com/cmp/${encodeURIComponent(company.toLowerCase().replace(/\s+/g, '-'))}`,
  glassdoor: (company: string) => `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(company)}`,
  zoominfo: (name: string) => `https://www.zoominfo.com/s/#!search/profile/person?personName=${encodeURIComponent(name)}`,
};

// Professional credential databases that may show employer
const CREDENTIAL_SOURCES = {
  npi: {
    name: 'NPI Registry (Healthcare)',
    url: 'https://npiregistry.cms.hhs.gov/',
    description: 'National Provider Identifier shows employer for healthcare workers',
  },
  finra: {
    name: 'FINRA BrokerCheck',
    url: 'https://brokercheck.finra.org/',
    description: 'Employment history for securities industry professionals',
  },
  sec: {
    name: 'SEC Investment Adviser Search',
    url: 'https://www.adviserinfo.sec.gov/',
    description: 'Employment for investment advisers',
  },
  stateBar: {
    name: 'State Bar Association',
    url: '', // Varies by state
    description: 'Law firm employment for attorneys',
  },
};

// Search for employment history
export async function searchEmployment(
  firstName: string,
  lastName: string,
  options?: {
    currentCompany?: string;
    industry?: string;
    location?: string;
  }
): Promise<EmploymentSearchResult> {
  const fullName = `${firstName} ${lastName}`;
  const searchUrls: { name: string; url: string; description: string }[] = [];

  // LinkedIn (primary source)
  searchUrls.push({
    name: 'LinkedIn People Search',
    url: getLinkedInSearchUrl(firstName, lastName, options?.currentCompany),
    description: 'Professional profiles with work history',
  });

  // ZoomInfo
  searchUrls.push({
    name: 'ZoomInfo',
    url: JOB_SITES.zoominfo(fullName),
    description: 'Business contact database with employment',
  });

  // SEC (for executives)
  searchUrls.push({
    name: 'SEC EDGAR (Executives)',
    url: getSECEmploymentUrl(fullName),
    description: 'Corporate filings mentioning person as officer/director',
  });

  // FINRA for finance professionals
  searchUrls.push({
    name: CREDENTIAL_SOURCES.finra.name,
    url: `https://brokercheck.finra.org/search/genericsearch/grid?q=${encodeURIComponent(fullName)}`,
    description: CREDENTIAL_SOURCES.finra.description,
  });

  // NPI for healthcare
  searchUrls.push({
    name: CREDENTIAL_SOURCES.npi.name,
    url: `https://npiregistry.cms.hhs.gov/api/?first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&version=2.1`,
    description: CREDENTIAL_SOURCES.npi.description,
  });

  // SEC Investment Adviser
  searchUrls.push({
    name: CREDENTIAL_SOURCES.sec.name,
    url: `https://www.adviserinfo.sec.gov/IAPD/IAPDSearch.aspx`,
    description: CREDENTIAL_SOURCES.sec.description,
  });

  // General Google search for employment
  searchUrls.push({
    name: 'Google Search',
    url: `https://www.google.com/search?q="${encodeURIComponent(fullName)}" ${options?.currentCompany ? `"${encodeURIComponent(options.currentCompany)}"` : ''} employee OR works OR employed`,
    description: 'General web search for employment mentions',
  });

  // Company-specific search if provided
  if (options?.currentCompany) {
    searchUrls.push({
      name: 'Indeed Company Profile',
      url: JOB_SITES.indeed(options.currentCompany),
      description: 'Company information and employee reviews',
    });
    searchUrls.push({
      name: 'Glassdoor Company',
      url: JOB_SITES.glassdoor(options.currentCompany),
      description: 'Company profile with employee info',
    });
  }

  return {
    employmentRecords: [],
    searchUrls,
  };
}

// Search company for employees
export async function searchCompanyEmployees(
  companyName: string,
  title?: string
): Promise<{
  searchUrls: { name: string; url: string }[];
}> {
  const searchUrls = [
    {
      name: 'LinkedIn Company',
      url: `https://www.linkedin.com/company/${encodeURIComponent(companyName.toLowerCase().replace(/\s+/g, '-'))}/people/`,
    },
    {
      name: 'ZoomInfo Company',
      url: `https://www.zoominfo.com/c/${encodeURIComponent(companyName.toLowerCase().replace(/\s+/g, '-'))}`,
    },
    {
      name: 'Crunchbase Company',
      url: `https://www.crunchbase.com/organization/${encodeURIComponent(companyName.toLowerCase().replace(/\s+/g, '-'))}`,
    },
    {
      name: 'SEC Company Officers',
      url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${encodeURIComponent(companyName)}&type=DEF%2014A`,
    },
  ];

  if (title) {
    searchUrls.push({
      name: 'LinkedIn Title Search',
      url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(title)}&company=${encodeURIComponent(companyName)}`,
    });
  }

  return { searchUrls };
}

// Verify employment at a company
export async function verifyEmployment(
  personName: string,
  companyName: string
): Promise<{
  verificationUrls: { name: string; url: string; method: string }[];
}> {
  return {
    verificationUrls: [
      {
        name: 'LinkedIn Search',
        url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(personName)}&currentCompany=${encodeURIComponent(companyName)}`,
        method: 'Search for profile at company',
      },
      {
        name: 'Company Website',
        url: `https://www.google.com/search?q=site:${encodeURIComponent(companyName.toLowerCase().replace(/\s+/g, ''))}.com "${encodeURIComponent(personName)}"`,
        method: 'Search company site for name',
      },
      {
        name: 'Press Releases',
        url: `https://www.google.com/search?q="${encodeURIComponent(personName)}" "${encodeURIComponent(companyName)}" (announced OR appointed OR hired OR joins)`,
        method: 'Search for press announcements',
      },
    ],
  };
}

export const EmploymentHistory = {
  search: searchEmployment,
  searchCompanyEmployees,
  verifyEmployment,
  getLinkedInUrl: getLinkedInSearchUrl,
  getSECUrl: getSECEmploymentUrl,
  credentialSources: CREDENTIAL_SOURCES,
};
