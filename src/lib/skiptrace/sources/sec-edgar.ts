// SEC EDGAR API Integration - 100% Free, No API Key Required
// https://www.sec.gov/developer

import { BusinessEntity, SECFiling, OfficerRecord } from '../types';

const SEC_BASE_URL = 'https://data.sec.gov';
const SEC_EFTS_URL = 'https://efts.sec.gov/LATEST/search-index';
const SEC_FULL_TEXT_URL = 'https://efts.sec.gov/LATEST/search';

// SEC requires a User-Agent with contact info
const SEC_HEADERS = {
  'User-Agent': 'SkipTrace/1.0 (contact@skiptrace.app)',
  'Accept': 'application/json',
};

interface SECCompanySearchResult {
  cik: string;
  name: string;
  ticker?: string;
  exchange?: string;
}

interface SECFilingResult {
  accessionNumber: string;
  filingDate: string;
  formType: string;
  primaryDocument: string;
  items?: string;
  size: number;
}

// Search companies in SEC database
export async function searchSECCompanies(query: string): Promise<SECCompanySearchResult[]> {
  try {
    // Use the company tickers/names endpoint
    const response = await fetch(`${SEC_BASE_URL}/submissions/CIK${query.padStart(10, '0')}.json`, {
      headers: SEC_HEADERS,
    });

    if (response.ok) {
      const data = await response.json();
      return [{
        cik: data.cik,
        name: data.name,
        ticker: data.tickers?.[0],
        exchange: data.exchanges?.[0],
      }];
    }

    // Fallback: Full-text search
    const searchResponse = await fetch(`${SEC_FULL_TEXT_URL}?q=${encodeURIComponent(query)}&dateRange=custom&startdt=2000-01-01&enddt=2025-12-31&forms=10-K,10-Q,8-K,DEF%2014A`, {
      headers: SEC_HEADERS,
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      const companies: SECCompanySearchResult[] = [];
      const seen = new Set<string>();

      for (const hit of searchData.hits?.hits || []) {
        const cik = hit._source?.ciks?.[0];
        const name = hit._source?.display_names?.[0];
        if (cik && name && !seen.has(cik)) {
          seen.add(cik);
          companies.push({ cik, name });
        }
      }

      return companies.slice(0, 20);
    }

    return [];
  } catch (error) {
    console.error('SEC company search error:', error);
    return [];
  }
}

// Get company details by CIK
export async function getSECCompanyDetails(cik: string): Promise<BusinessEntity | null> {
  try {
    const paddedCik = cik.replace(/^0+/, '').padStart(10, '0');
    const response = await fetch(`${SEC_BASE_URL}/submissions/CIK${paddedCik}.json`, {
      headers: SEC_HEADERS,
    });

    if (!response.ok) return null;

    const data = await response.json();

    // Extract officers from recent filings
    const officers: OfficerRecord[] = [];

    // Parse filings
    const filings: SECFiling[] = [];
    const recentFilings = data.filings?.recent || {};

    for (let i = 0; i < Math.min(50, recentFilings.accessionNumber?.length || 0); i++) {
      filings.push({
        accessionNumber: recentFilings.accessionNumber[i],
        formType: recentFilings.form[i],
        filingDate: recentFilings.filingDate[i],
        description: recentFilings.primaryDocDescription?.[i],
        documentUrl: `https://www.sec.gov/Archives/edgar/data/${data.cik}/${recentFilings.accessionNumber[i].replace(/-/g, '')}/${recentFilings.primaryDocument[i]}`,
      });
    }

    return {
      id: `sec-${data.cik}`,
      name: data.name,
      entityType: data.sicDescription?.toLowerCase().includes('bank') ? 'corporation' : 'corporation',
      status: data.filings?.recent?.filingDate?.[0] ? 'active' : 'inactive',
      stateOfFormation: data.stateOfIncorporation || data.addresses?.business?.stateOrCountry || 'Unknown',
      fileNumber: data.cik,
      filingDate: data.filings?.recent?.filingDate?.slice(-1)[0] || '',
      principalAddress: formatSECAddress(data.addresses?.business),
      mailingAddress: formatSECAddress(data.addresses?.mailing),
      officers,
      secFilings: filings,
      source: 'SEC EDGAR',
      sourceUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${data.cik}`,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('SEC company details error:', error);
    return null;
  }
}

// Get insider ownership and transactions
export async function getSECInsiders(cik: string): Promise<{
  insiders: Array<{
    name: string;
    title: string;
    transactions: Array<{
      date: string;
      type: 'buy' | 'sell' | 'grant';
      shares: number;
      pricePerShare?: number;
    }>;
  }>;
}> {
  try {
    const paddedCik = cik.padStart(10, '0');
    // Get Form 4 filings (insider transactions)
    const response = await fetch(
      `${SEC_FULL_TEXT_URL}?q=*&dateRange=custom&startdt=${getDateYearsAgo(2)}&enddt=${getTodayDate()}&forms=4&ciks=${paddedCik}`,
      { headers: SEC_HEADERS }
    );

    if (!response.ok) return { insiders: [] };

    const data = await response.json();
    const insiderMap = new Map<string, {
      name: string;
      title: string;
      transactions: Array<{
        date: string;
        type: 'buy' | 'sell' | 'grant';
        shares: number;
        pricePerShare?: number;
      }>;
    }>();

    // Process results (simplified - full parsing would require XML)
    for (const hit of data.hits?.hits || []) {
      const source = hit._source || {};
      const name = source.display_names?.[0] || 'Unknown';

      if (!insiderMap.has(name)) {
        insiderMap.set(name, {
          name,
          title: 'Insider',
          transactions: [],
        });
      }
    }

    return { insiders: Array.from(insiderMap.values()) };
  } catch (error) {
    console.error('SEC insiders error:', error);
    return { insiders: [] };
  }
}

// Get beneficial owners (13F, 13G, 13D filings)
export async function getSECBeneficialOwners(cik: string): Promise<{
  owners: Array<{
    name: string;
    shares: number;
    percentage: number;
    filingDate: string;
    formType: string;
  }>;
}> {
  try {
    const paddedCik = cik.padStart(10, '0');
    const response = await fetch(
      `${SEC_FULL_TEXT_URL}?q=*&dateRange=custom&startdt=${getDateYearsAgo(2)}&enddt=${getTodayDate()}&forms=SC%2013G,SC%2013D,13F-HR&ciks=${paddedCik}`,
      { headers: SEC_HEADERS }
    );

    if (!response.ok) return { owners: [] };

    // Parse and return owners
    return { owners: [] }; // Full implementation would parse XML filings
  } catch (error) {
    console.error('SEC beneficial owners error:', error);
    return { owners: [] };
  }
}

// Search for a person across SEC filings (find companies they're associated with)
export async function searchSECPerson(name: string): Promise<{
  companies: Array<{
    cik: string;
    name: string;
    role: string;
    filingDate: string;
  }>;
}> {
  try {
    const response = await fetch(
      `${SEC_FULL_TEXT_URL}?q="${encodeURIComponent(name)}"&dateRange=custom&startdt=${getDateYearsAgo(5)}&enddt=${getTodayDate()}&forms=DEF%2014A,10-K,8-K`,
      { headers: SEC_HEADERS }
    );

    if (!response.ok) return { companies: [] };

    const data = await response.json();
    const companies: Array<{
      cik: string;
      name: string;
      role: string;
      filingDate: string;
    }> = [];

    const seen = new Set<string>();

    for (const hit of data.hits?.hits || []) {
      const source = hit._source || {};
      const cik = source.ciks?.[0];
      const companyName = source.display_names?.[0];
      const filingDate = source.file_date;

      if (cik && companyName && !seen.has(cik)) {
        seen.add(cik);
        companies.push({
          cik,
          name: companyName,
          role: 'Associated',
          filingDate,
        });
      }
    }

    return { companies: companies.slice(0, 20) };
  } catch (error) {
    console.error('SEC person search error:', error);
    return { companies: [] };
  }
}

// Get recent 10-K/10-Q for financial data
export async function getSECFinancials(cik: string): Promise<{
  revenue?: number;
  netIncome?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  employees?: number;
  fiscalYearEnd?: string;
} | null> {
  try {
    const paddedCik = cik.padStart(10, '0');
    // Get company facts (structured financial data)
    const response = await fetch(
      `${SEC_BASE_URL}/api/xbrl/companyfacts/CIK${paddedCik}.json`,
      { headers: SEC_HEADERS }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const facts = data.facts?.['us-gaap'] || {};

    // Extract latest values
    const getLatestValue = (concept: string): number | undefined => {
      const values = facts[concept]?.units?.USD || facts[concept]?.units?.shares;
      if (!values?.length) return undefined;
      const sorted = values.sort((a: { end: string }, b: { end: string }) =>
        new Date(b.end).getTime() - new Date(a.end).getTime()
      );
      return sorted[0]?.val;
    };

    return {
      revenue: getLatestValue('Revenues') || getLatestValue('RevenueFromContractWithCustomerExcludingAssessedTax'),
      netIncome: getLatestValue('NetIncomeLoss'),
      totalAssets: getLatestValue('Assets'),
      totalLiabilities: getLatestValue('Liabilities'),
      employees: getLatestValue('NumberOfEmployees'),
    };
  } catch (error) {
    console.error('SEC financials error:', error);
    return null;
  }
}

// Helper functions
function formatSECAddress(addr: { street1?: string; street2?: string; city?: string; stateOrCountry?: string; zipCode?: string } | undefined): string {
  if (!addr) return '';
  const parts = [
    addr.street1,
    addr.street2,
    addr.city,
    addr.stateOrCountry,
    addr.zipCode,
  ].filter(Boolean);
  return parts.join(', ');
}

function getDateYearsAgo(years: number): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString().split('T')[0];
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export const SECEdgar = {
  searchCompanies: searchSECCompanies,
  getCompanyDetails: getSECCompanyDetails,
  getInsiders: getSECInsiders,
  getBeneficialOwners: getSECBeneficialOwners,
  searchPerson: searchSECPerson,
  getFinancials: getSECFinancials,
};
