// State Corporation Registry Search
// Free sources: Florida Sunbiz, OpenCorporates, state websites

import { BusinessEntity, OfficerRecord } from '../types';

// Florida Sunbiz - Direct scraping (no API key needed)
export async function searchFloridaSunbiz(query: string, searchType: 'name' | 'officer' | 'agent' | 'fileNumber' = 'name'): Promise<BusinessEntity[]> {
  try {
    const searchTypes: Record<string, string> = {
      name: 'SEARCHNAMEST',
      officer: 'SEARCHOFFICERS',
      agent: 'SEARCHRA',
      fileNumber: 'SEARCHFILENO',
    };

    // Florida Sunbiz search URL
    const baseUrl = 'https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResults';
    const params = new URLSearchParams({
      inquiryType: 'EntityName',
      searchNameOrder: query,
      searchTerm: query,
    });

    // Note: Direct scraping would require server-side execution
    // For now, return structured search URL and instructions
    const searchUrl = `https://search.sunbiz.org/Inquiry/CorporationSearch/ByName`;

    // Use web search to find Sunbiz results
    const webSearchResults = await searchWebForCorporation(query, 'Florida');

    return webSearchResults;
  } catch (error) {
    console.error('Florida Sunbiz search error:', error);
    return [];
  }
}

// OpenCorporates API - Free tier: 50 requests/month
const OPENCORPORATES_BASE = 'https://api.opencorporates.com/v0.4';

export async function searchOpenCorporates(query: string, jurisdiction?: string): Promise<BusinessEntity[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      ...(jurisdiction && { jurisdiction_code: jurisdiction }),
    });

    const response = await fetch(`${OPENCORPORATES_BASE}/companies/search?${params}`);

    if (!response.ok) {
      // Fallback to web search if API fails
      return searchWebForCorporation(query, jurisdiction);
    }

    const data = await response.json();
    const companies = data.results?.companies || [];

    return companies.map((c: { company: {
      name: string;
      company_number: string;
      jurisdiction_code: string;
      incorporation_date: string;
      company_type: string;
      current_status: string;
      registered_address_in_full: string;
      opencorporates_url: string;
      officers?: Array<{ officer: { name: string; position: string; start_date: string } }>;
    } }) => {
      const company = c.company;
      return {
        id: `oc-${company.company_number}-${company.jurisdiction_code}`,
        name: company.name,
        entityType: mapCompanyType(company.company_type),
        status: mapStatus(company.current_status),
        stateOfFormation: company.jurisdiction_code?.split('_')[1]?.toUpperCase() || company.jurisdiction_code,
        fileNumber: company.company_number,
        filingDate: company.incorporation_date,
        principalAddress: company.registered_address_in_full,
        officers: company.officers?.map((o: { officer: { name: string; position: string; start_date: string } }) => ({
          name: o.officer.name,
          title: o.officer.position,
          startDate: o.officer.start_date,
        })) || [],
        source: 'OpenCorporates',
        sourceUrl: company.opencorporates_url,
        lastUpdated: new Date().toISOString(),
      } as BusinessEntity;
    });
  } catch (error) {
    console.error('OpenCorporates search error:', error);
    return searchWebForCorporation(query, jurisdiction);
  }
}

// Web search fallback for corporation data
async function searchWebForCorporation(query: string, state?: string): Promise<BusinessEntity[]> {
  const stateSearches: Record<string, string> = {
    'Florida': 'site:sunbiz.org',
    'FL': 'site:sunbiz.org',
    'California': 'site:businesssearch.sos.ca.gov',
    'CA': 'site:businesssearch.sos.ca.gov',
    'Delaware': 'site:corp.delaware.gov OR site:icis.corp.delaware.gov',
    'DE': 'site:corp.delaware.gov',
    'New York': 'site:appext20.dos.ny.gov',
    'NY': 'site:appext20.dos.ny.gov',
    'Texas': 'site:direct.sos.state.tx.us',
    'TX': 'site:direct.sos.state.tx.us',
    'Nevada': 'site:esos.nv.gov',
    'NV': 'site:esos.nv.gov',
    'Wyoming': 'site:wyobiz.wyo.gov',
    'WY': 'site:wyobiz.wyo.gov',
  };

  const siteFilter = state ? (stateSearches[state] || '') : '';
  const searchQuery = `${query} corporation LLC registered agent ${siteFilter}`.trim();

  // This would use the search provider
  // For now, return empty and let the API route handle it
  return [];
}

// Multi-state search - searches all major registries
export async function searchAllStates(query: string): Promise<BusinessEntity[]> {
  const results: BusinessEntity[] = [];

  // Search OpenCorporates for all US jurisdictions
  const usJurisdictions = [
    'us_de', 'us_ca', 'us_ny', 'us_tx', 'us_fl', 'us_nv', 'us_il', 'us_pa', 'us_oh', 'us_ga',
    'us_nc', 'us_mi', 'us_nj', 'us_va', 'us_wa', 'us_az', 'us_ma', 'us_co', 'us_tn', 'us_md',
  ];

  try {
    // Parallel search across jurisdictions
    const searches = usJurisdictions.slice(0, 5).map(j =>
      searchOpenCorporates(query, j).catch(() => [])
    );

    const allResults = await Promise.all(searches);
    for (const stateResults of allResults) {
      results.push(...stateResults);
    }
  } catch (error) {
    console.error('Multi-state search error:', error);
  }

  return results;
}

// State-specific search functions
export const StateSearchers = {
  florida: {
    name: 'Florida',
    code: 'FL',
    website: 'https://search.sunbiz.org',
    search: (query: string) => searchFloridaSunbiz(query, 'name'),
    searchByOfficer: (name: string) => searchFloridaSunbiz(name, 'officer'),
    searchByAgent: (name: string) => searchFloridaSunbiz(name, 'agent'),
    searchByFileNumber: (fileNum: string) => searchFloridaSunbiz(fileNum, 'fileNumber'),
  },
  delaware: {
    name: 'Delaware',
    code: 'DE',
    website: 'https://icis.corp.delaware.gov',
    search: (query: string) => searchOpenCorporates(query, 'us_de'),
  },
  california: {
    name: 'California',
    code: 'CA',
    website: 'https://businesssearch.sos.ca.gov',
    search: (query: string) => searchOpenCorporates(query, 'us_ca'),
  },
  newYork: {
    name: 'New York',
    code: 'NY',
    website: 'https://appext20.dos.ny.gov/corp_public/corpsearch.entity_search_entry',
    search: (query: string) => searchOpenCorporates(query, 'us_ny'),
  },
  texas: {
    name: 'Texas',
    code: 'TX',
    website: 'https://direct.sos.state.tx.us/corp_search/',
    search: (query: string) => searchOpenCorporates(query, 'us_tx'),
  },
  nevada: {
    name: 'Nevada',
    code: 'NV',
    website: 'https://esos.nv.gov/EntitySearch/OnlineEntitySearch',
    search: (query: string) => searchOpenCorporates(query, 'us_nv'),
  },
};

// Helper functions
function mapCompanyType(type: string | undefined): BusinessEntity['entityType'] {
  if (!type) return 'corporation';
  const lower = type.toLowerCase();
  if (lower.includes('llc') || lower.includes('limited liability')) return 'llc';
  if (lower.includes('partnership') || lower.includes('lp')) return 'partnership';
  if (lower.includes('nonprofit') || lower.includes('non-profit')) return 'nonprofit';
  if (lower.includes('trust')) return 'trust';
  if (lower.includes('sole') || lower.includes('individual')) return 'sole_proprietorship';
  return 'corporation';
}

function mapStatus(status: string | undefined): BusinessEntity['status'] {
  if (!status) return 'active';
  const lower = status.toLowerCase();
  if (lower.includes('active') || lower.includes('good standing')) return 'active';
  if (lower.includes('dissolved') || lower.includes('terminated')) return 'dissolved';
  if (lower.includes('inactive') || lower.includes('admin')) return 'inactive';
  if (lower.includes('suspended')) return 'suspended';
  if (lower.includes('forfeited')) return 'forfeited';
  return 'active';
}

export const StateCorporations = {
  searchFlorida: searchFloridaSunbiz,
  searchOpenCorporates,
  searchAllStates,
  stateSearchers: StateSearchers,
};
