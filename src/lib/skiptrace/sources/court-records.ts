// Court Records Search
// Sources: PACER (Federal), State court websites, County court records

import { CourtRecord, BankruptcyRecord, LienRecord, JudgmentRecord } from '../types';

// Court Websites by Jurisdiction
const COURT_WEBSITES = {
  federal: {
    pacer: 'https://pacer.uscourts.gov/',
    bankruptcySearch: 'https://www.uscourts.gov/court-records/find-case-pacer',
    recap: 'https://www.courtlistener.com/recap/', // Free PACER archive
  },
  florida: {
    statewide: 'https://www.flcourts.org/',
    miamiDade: 'https://www.miami-dadeclerk.com/public-records/',
    broward: 'https://www.browardclerk.org/clerkwebsite/BCCOC2/publicrecords.aspx',
    palmBeach: 'https://myclerkofcourts.com/',
    hillsborough: 'https://www.hillsclerk.com/Public-Records',
    orange: 'https://myeclerk.myorangeclerk.com/',
    duval: 'https://apps.duvalclerk.com/CourtRecords/',
  },
  california: {
    statewide: 'https://www.courts.ca.gov/',
    losAngeles: 'https://www.lacourt.org/paonlineservices/CivilCaseInfo/',
    sanDiego: 'https://www.sdcourt.ca.gov/sdcourt/civil/casesearch',
  },
  texas: {
    statewide: 'https://www.txcourts.gov/',
    harris: 'https://www.cclerk.hctx.net/Applications/WebSearch/',
    dallas: 'https://www.dallascounty.org/government/courts/',
  },
  newYork: {
    statewide: 'https://iapps.courts.state.ny.us/webcivilLocal/Search',
    ecourts: 'https://iapps.courts.state.ny.us/nyscef/CaseSearch',
  },
};

interface CourtSearchResult {
  records: CourtRecord[];
  sources: string[];
  searchUrls: { name: string; url: string }[];
}

// Search court records by name
export async function searchCourtRecordsByName(
  firstName: string,
  lastName: string,
  state?: string,
  courtType?: 'civil' | 'criminal' | 'family' | 'bankruptcy' | 'all'
): Promise<CourtSearchResult> {
  const records: CourtRecord[] = [];
  const sources: string[] = [];
  const searchUrls: { name: string; url: string }[] = [];

  const fullName = `${firstName} ${lastName}`;

  // Add federal court search
  searchUrls.push({
    name: 'PACER (Federal Courts)',
    url: 'https://pacer.uscourts.gov/',
  });
  sources.push('PACER');

  // Add CourtListener (free PACER archive)
  searchUrls.push({
    name: 'CourtListener (Free PACER Archive)',
    url: `https://www.courtlistener.com/?q=${encodeURIComponent(fullName)}&type=r`,
  });
  sources.push('CourtListener');

  // Add state-specific courts
  if (!state || state === 'FL') {
    searchUrls.push(
      { name: 'Florida Courts', url: 'https://www.flcourts.org/' },
      { name: 'Miami-Dade Clerk', url: `https://www.miami-dadeclerk.com/public-records/` }
    );
    sources.push('Florida Courts');
  }

  if (!state || state === 'CA') {
    searchUrls.push({
      name: 'California Courts',
      url: 'https://www.courts.ca.gov/find-my-court.htm',
    });
    sources.push('California Courts');
  }

  if (!state || state === 'NY') {
    searchUrls.push({
      name: 'New York eCourts',
      url: `https://iapps.courts.state.ny.us/webcivilLocal/Search?searchType=PartyName`,
    });
    sources.push('New York Courts');
  }

  return { records, sources, searchUrls };
}

// Search bankruptcy records
export async function searchBankruptcyRecords(
  name: string,
  state?: string
): Promise<{ records: BankruptcyRecord[]; searchUrls: { name: string; url: string }[] }> {
  const searchUrls: { name: string; url: string }[] = [];

  // PACER Bankruptcy
  searchUrls.push({
    name: 'PACER Bankruptcy Search',
    url: 'https://pcl.uscourts.gov/pcl/index.jsf',
  });

  // CourtListener free archive
  searchUrls.push({
    name: 'CourtListener Bankruptcy',
    url: `https://www.courtlistener.com/?q=${encodeURIComponent(name)}&type=r&court=bap`,
  });

  // Free bankruptcy lookup
  searchUrls.push({
    name: 'Public Access to Court Records',
    url: 'https://www.uscourts.gov/court-records/find-case-pacer',
  });

  return { records: [], searchUrls };
}

// Search for liens and judgments
export async function searchLiensJudgments(
  name: string,
  state?: string
): Promise<{
  liens: LienRecord[];
  judgments: JudgmentRecord[];
  searchUrls: { name: string; url: string }[];
}> {
  const searchUrls: { name: string; url: string }[] = [];

  // State-specific lien searches
  if (!state || state === 'FL') {
    searchUrls.push({
      name: 'Florida Judgment Liens',
      url: 'https://www.myfloridacounty.com/ori/',
    });
  }

  // UCC filings (federal tax liens)
  searchUrls.push({
    name: 'UCC Filings Search',
    url: 'https://www.sos.state.tx.us/ucc/index.shtml',
  });

  return { liens: [], judgments: [], searchUrls };
}

// Search UCC filings
export async function searchUCCFilings(
  debtorName: string,
  state?: string
): Promise<{
  filings: Array<{
    fileNumber: string;
    filingDate: string;
    securedParty: string;
    debtor: string;
    collateral: string;
    status: string;
  }>;
  searchUrls: { name: string; url: string }[];
}> {
  const searchUrls: { name: string; url: string }[] = [];

  // State UCC search links
  const uccSearches: Record<string, { name: string; url: string }> = {
    FL: { name: 'Florida UCC Search', url: 'https://ccfcorp.dos.state.fl.us/ucc/UCCSearch.html' },
    CA: { name: 'California UCC Search', url: 'https://bizfileonline.sos.ca.gov/search/ucc' },
    TX: { name: 'Texas UCC Search', url: 'https://www.sos.state.tx.us/ucc/index.shtml' },
    NY: { name: 'New York UCC Search', url: 'https://appext20.dos.ny.gov/pls/ucc_public/web_search.main_frame' },
    DE: { name: 'Delaware UCC Search', url: 'https://icis.corp.delaware.gov/uccweb/start.aspx' },
    NV: { name: 'Nevada UCC Search', url: 'https://nvsos.gov/sosentitysearch/uccSrch.aspx' },
  };

  if (state && uccSearches[state]) {
    searchUrls.push(uccSearches[state]);
  } else {
    // Add all major states
    Object.values(uccSearches).forEach(s => searchUrls.push(s));
  }

  return { filings: [], searchUrls };
}

// Search case by case number
export async function searchCaseByNumber(
  caseNumber: string,
  court?: string
): Promise<CourtSearchResult> {
  const searchUrls: { name: string; url: string }[] = [];

  // PACER direct lookup
  searchUrls.push({
    name: 'PACER Case Lookup',
    url: 'https://pacer.uscourts.gov/',
  });

  // CourtListener search
  searchUrls.push({
    name: 'CourtListener',
    url: `https://www.courtlistener.com/?q=${encodeURIComponent(caseNumber)}&type=r`,
  });

  return { records: [], sources: ['PACER', 'CourtListener'], searchUrls };
}

// Court type descriptions
export const COURT_TYPE_LABELS: Record<CourtRecord['courtType'], string> = {
  civil: 'Civil Court',
  criminal: 'Criminal Court',
  family: 'Family Court',
  traffic: 'Traffic Court',
  small_claims: 'Small Claims Court',
  federal: 'Federal Court',
  bankruptcy: 'Bankruptcy Court',
};

// Case status descriptions
export const CASE_STATUS_LABELS: Record<CourtRecord['caseStatus'], string> = {
  open: 'Open/Active',
  closed: 'Closed',
  pending: 'Pending',
  dismissed: 'Dismissed',
};

// Helper: Format case parties for display
export function formatCaseParties(parties: CourtRecord['parties']): string {
  const plaintiffs = parties.filter(p => p.role === 'plaintiff' || p.role === 'petitioner');
  const defendants = parties.filter(p => p.role === 'defendant' || p.role === 'respondent');

  if (plaintiffs.length && defendants.length) {
    return `${plaintiffs[0].name} v. ${defendants[0].name}`;
  }
  return parties.map(p => p.name).join(', ');
}

// Federal court districts
export const FEDERAL_DISTRICTS = {
  FL: [
    { code: 'flsd', name: 'Southern District of Florida' },
    { code: 'flmd', name: 'Middle District of Florida' },
    { code: 'flnd', name: 'Northern District of Florida' },
  ],
  CA: [
    { code: 'cacd', name: 'Central District of California' },
    { code: 'cand', name: 'Northern District of California' },
    { code: 'casd', name: 'Southern District of California' },
    { code: 'caed', name: 'Eastern District of California' },
  ],
  NY: [
    { code: 'nysd', name: 'Southern District of New York' },
    { code: 'nyed', name: 'Eastern District of New York' },
    { code: 'nynd', name: 'Northern District of New York' },
    { code: 'nywd', name: 'Western District of New York' },
  ],
  TX: [
    { code: 'txsd', name: 'Southern District of Texas' },
    { code: 'txnd', name: 'Northern District of Texas' },
    { code: 'txed', name: 'Eastern District of Texas' },
    { code: 'txwd', name: 'Western District of Texas' },
  ],
};

// Export main functions
export const CourtRecords = {
  searchByName: searchCourtRecordsByName,
  searchBankruptcy: searchBankruptcyRecords,
  searchLiensJudgments,
  searchUCC: searchUCCFilings,
  searchByCase: searchCaseByNumber,
  courtWebsites: COURT_WEBSITES,
  courtTypeLabels: COURT_TYPE_LABELS,
  caseStatusLabels: CASE_STATUS_LABELS,
  formatParties: formatCaseParties,
  federalDistricts: FEDERAL_DISTRICTS,
};
