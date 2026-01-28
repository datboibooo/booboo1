// Assets and Wealth Indicators Search
// Sources: FAA aircraft registry, US Coast Guard vessel registry, public records

// FAA Aircraft Registry - 100% Free
const FAA_BASE = 'https://registry.faa.gov';

interface AircraftRecord {
  nNumber: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  year: number;
  registrant: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    type: 'individual' | 'corporation' | 'partnership' | 'government';
  };
  certificateIssueDate: string;
  status: string;
  source: string;
  sourceUrl: string;
}

interface VesselRecord {
  officialNumber: string;
  vesselName: string;
  hailingPort: string;
  owner: {
    name: string;
    address: string;
  };
  vesselType: string;
  grossTonnage: number;
  yearBuilt: number;
  length: number;
  source: string;
  sourceUrl: string;
}

// Search FAA Aircraft Registry by owner name
export async function searchAircraftByOwner(ownerName: string): Promise<{
  aircraft: AircraftRecord[];
  searchUrl: string;
}> {
  // FAA registry search URL
  const searchUrl = `https://registry.faa.gov/aircraftinquiry/Search/NameResult?NameToSearch=${encodeURIComponent(ownerName)}`;

  return {
    aircraft: [],
    searchUrl,
  };
}

// Search FAA by N-Number
export async function searchAircraftByNNumber(nNumber: string): Promise<{
  aircraft: AircraftRecord | null;
  searchUrl: string;
}> {
  // Clean N-Number (remove N prefix if present)
  const cleanNumber = nNumber.toUpperCase().replace(/^N/, '');
  const searchUrl = `https://registry.faa.gov/aircraftinquiry/Search/NNumberResult?NNumberTxt=N${cleanNumber}`;

  return {
    aircraft: null,
    searchUrl,
  };
}

// US Coast Guard Vessel Documentation Search
export async function searchVesselByOwner(ownerName: string): Promise<{
  vessels: VesselRecord[];
  searchUrl: string;
}> {
  const searchUrl = `https://www.st.nmfs.noaa.gov/st1/CoastGuard/VesselByOwner.html`;

  return {
    vessels: [],
    searchUrl,
  };
}

// Search by vessel name
export async function searchVesselByName(vesselName: string): Promise<{
  vessels: VesselRecord[];
  searchUrl: string;
}> {
  const searchUrl = `https://www.st.nmfs.noaa.gov/st1/CoastGuard/VesselByName.html`;

  return {
    vessels: [],
    searchUrl,
  };
}

// Wealth indicator search URLs
export function getWealthSearchUrls(name: string): { name: string; url: string; category: string }[] {
  return [
    // Aircraft
    {
      name: 'FAA Aircraft Registry',
      url: `https://registry.faa.gov/aircraftinquiry/Search/NameResult?NameToSearch=${encodeURIComponent(name)}`,
      category: 'Aircraft',
    },
    // Vessels
    {
      name: 'USCG Vessel Documentation',
      url: 'https://www.st.nmfs.noaa.gov/st1/CoastGuard/VesselByOwner.html',
      category: 'Vessels',
    },
    // SEC Insider Holdings
    {
      name: 'SEC Insider Holdings',
      url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${encodeURIComponent(name)}&type=4&dateb=&owner=include&count=40`,
      category: 'Securities',
    },
    // FINRA BrokerCheck
    {
      name: 'FINRA BrokerCheck',
      url: `https://brokercheck.finra.org/search/genericsearch/grid?q=${encodeURIComponent(name)}`,
      category: 'Securities',
    },
    // Charity/Nonprofit
    {
      name: 'Charity Navigator',
      url: `https://www.charitynavigator.org/search?q=${encodeURIComponent(name)}`,
      category: 'Nonprofit',
    },
    {
      name: 'GuideStar',
      url: 'https://www.guidestar.org/',
      category: 'Nonprofit',
    },
    // Political Donations
    {
      name: 'FEC Political Donations',
      url: `https://www.fec.gov/data/receipts/individual-contributions/?contributor_name=${encodeURIComponent(name)}`,
      category: 'Political',
    },
    // Trademark Search
    {
      name: 'USPTO Trademark Search',
      url: `https://tmsearch.uspto.gov/bin/gate.exe?f=searchss&state=4801:gjb5eo.1.1`,
      category: 'Intellectual Property',
    },
    // Patent Search
    {
      name: 'USPTO Patent Search',
      url: `https://patft.uspto.gov/netahtml/PTO/search-bool.html`,
      category: 'Intellectual Property',
    },
  ];
}

// Business wealth indicators
export function getBusinessWealthUrls(companyName: string): { name: string; url: string; category: string }[] {
  return [
    // D&B Business Credit
    {
      name: 'D&B Business Directory',
      url: `https://www.dnb.com/business-directory.html`,
      category: 'Credit',
    },
    // BBB
    {
      name: 'Better Business Bureau',
      url: `https://www.bbb.org/search?find_text=${encodeURIComponent(companyName)}`,
      category: 'Reputation',
    },
    // Glassdoor (company info)
    {
      name: 'Glassdoor',
      url: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(companyName)}`,
      category: 'Employment',
    },
    // Government Contracts
    {
      name: 'USASpending.gov',
      url: `https://www.usaspending.gov/search/?hash=8&recipient=${encodeURIComponent(companyName)}`,
      category: 'Government',
    },
    {
      name: 'SAM.gov',
      url: `https://sam.gov/search/?page=1&pageSize=25&sfm%5Bstatus%5D%5Bis_active%5D=true&keywords=${encodeURIComponent(companyName)}`,
      category: 'Government',
    },
    // Import/Export
    {
      name: 'Import Genius',
      url: 'https://www.importgenius.com/',
      category: 'Trade',
    },
    // Patents
    {
      name: 'Google Patents',
      url: `https://patents.google.com/?assignee=${encodeURIComponent(companyName)}`,
      category: 'Intellectual Property',
    },
  ];
}

// High net worth indicators
export const WEALTH_INDICATORS = {
  aircraft: {
    name: 'Aircraft Ownership',
    significance: 'Indicates significant wealth (aircraft typically $100K+)',
    sources: ['FAA Aircraft Registry'],
  },
  vessel: {
    name: 'Vessel Ownership',
    significance: 'Registered vessels indicate boat ownership',
    sources: ['USCG Vessel Documentation'],
  },
  property: {
    name: 'Real Estate Holdings',
    significance: 'Multiple properties or high-value properties',
    sources: ['County Assessor Records'],
  },
  securities: {
    name: 'Public Company Stakes',
    significance: 'SEC filings show public company ownership',
    sources: ['SEC EDGAR'],
  },
  political: {
    name: 'Political Contributions',
    significance: 'Large political donations indicate disposable income',
    sources: ['FEC'],
  },
  nonprofit: {
    name: 'Nonprofit Board/Founder',
    significance: 'Foundation involvement indicates wealth',
    sources: ['IRS 990', 'GuideStar'],
  },
};

export const AssetsWealth = {
  searchAircraftByOwner,
  searchAircraftByNNumber,
  searchVesselByOwner,
  searchVesselByName,
  getWealthSearchUrls,
  getBusinessWealthUrls,
  wealthIndicators: WEALTH_INDICATORS,
};
