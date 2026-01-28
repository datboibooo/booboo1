// Property Records Search
// Sources: County assessor websites, Zillow (public), Redfin (public)

import { PropertyRecord, MortgageRecord } from '../types';

// County Assessor Websites by State/County
const ASSESSOR_WEBSITES: Record<string, Record<string, string>> = {
  FL: {
    'Miami-Dade': 'https://www.miamidade.gov/Apps/PA/propertysearch/',
    'Broward': 'https://bcpa.net/RecSearch.asp',
    'Palm Beach': 'https://www.pbcgov.org/papa/property-search/',
    'Hillsborough': 'https://gis.hcpafl.org/propertysearch/',
    'Orange': 'https://ocpafl.org/searches/ParcelSearch.aspx',
    'Duval': 'https://paopropertysearch.coj.net/',
    'Pinellas': 'https://www.pcpao.org/general_search.php',
    'Lee': 'https://www.leepa.org/Search/PropertySearch.aspx',
    'Polk': 'https://www.polkpa.org/CamaDisplay.aspx',
    'Brevard': 'https://www.bcpao.us/PropertySearch/',
  },
  CA: {
    'Los Angeles': 'https://portal.assessor.lacounty.gov/',
    'San Diego': 'https://arcc.sdcounty.ca.gov/pages/parcel-search.aspx',
    'Orange': 'https://parcelsearch.ocgov.com/',
    'Santa Clara': 'https://www.sccassessor.org/property-search/',
    'San Francisco': 'https://sfassessor.org/property-information/homeowner-exemptions',
  },
  TX: {
    'Harris': 'https://hcad.org/property-search/',
    'Dallas': 'https://www.dallascad.org/SearchAddr.aspx',
    'Tarrant': 'https://www.tad.org/property-search/',
    'Bexar': 'https://www.bcad.org/ClientDB/PropertySearch.aspx',
    'Travis': 'https://www.traviscad.org/property-search/',
  },
  NY: {
    'New York': 'https://a836-pts-access.nyc.gov/care/search/CommonSearch.aspx?mode=ADDRESS',
    'Kings': 'https://a836-pts-access.nyc.gov/care/search/CommonSearch.aspx?mode=ADDRESS',
    'Queens': 'https://a836-pts-access.nyc.gov/care/search/CommonSearch.aspx?mode=ADDRESS',
  },
};

interface PropertySearchResult {
  properties: PropertyRecord[];
  sources: string[];
  searchUrl?: string;
}

// Search property by address
export async function searchPropertyByAddress(
  address: string,
  city: string,
  state: string,
  zip?: string
): Promise<PropertySearchResult> {
  const results: PropertyRecord[] = [];
  const sources: string[] = [];

  // Get county from city (simplified mapping)
  const county = getCountyFromCity(city, state);

  // Try county assessor
  if (county && ASSESSOR_WEBSITES[state]?.[county]) {
    sources.push(`${county} County Assessor`);
  }

  // Use web search to find property records
  const webResults = await searchPropertyWeb(address, city, state);
  results.push(...webResults.properties);
  sources.push(...webResults.sources);

  return {
    properties: results,
    sources: [...new Set(sources)],
    searchUrl: getAssessorUrl(state, county),
  };
}

// Search property by owner name
export async function searchPropertyByOwner(
  ownerName: string,
  state?: string,
  county?: string
): Promise<PropertySearchResult> {
  const results: PropertyRecord[] = [];
  const sources: string[] = [];

  // Web search for property ownership
  const searchQuery = `"${ownerName}" property owner ${state || ''} real estate records`;

  // This would use the search provider
  sources.push('Property Records Search');

  return {
    properties: results,
    sources,
  };
}

// Search property by parcel ID
export async function searchPropertyByParcel(
  parcelId: string,
  state: string,
  county: string
): Promise<PropertySearchResult> {
  const sources: string[] = [];

  if (ASSESSOR_WEBSITES[state]?.[county]) {
    sources.push(`${county} County Assessor`);
  }

  return {
    properties: [],
    sources,
    searchUrl: getAssessorUrl(state, county),
  };
}

// Web search fallback
async function searchPropertyWeb(
  address: string,
  city: string,
  state: string
): Promise<PropertySearchResult> {
  // Public property data aggregators
  const publicSources = [
    { name: 'Zillow', domain: 'zillow.com' },
    { name: 'Redfin', domain: 'redfin.com' },
    { name: 'Realtor', domain: 'realtor.com' },
    { name: 'Trulia', domain: 'trulia.com' },
  ];

  return {
    properties: [],
    sources: publicSources.map(s => s.name),
  };
}

// Helper: Get county from city
function getCountyFromCity(city: string, state: string): string | null {
  const cityToCounty: Record<string, Record<string, string>> = {
    FL: {
      'Miami': 'Miami-Dade',
      'Fort Lauderdale': 'Broward',
      'West Palm Beach': 'Palm Beach',
      'Tampa': 'Hillsborough',
      'Orlando': 'Orange',
      'Jacksonville': 'Duval',
      'St. Petersburg': 'Pinellas',
      'Fort Myers': 'Lee',
      'Lakeland': 'Polk',
      'Melbourne': 'Brevard',
    },
    CA: {
      'Los Angeles': 'Los Angeles',
      'San Diego': 'San Diego',
      'Irvine': 'Orange',
      'San Jose': 'Santa Clara',
      'San Francisco': 'San Francisco',
    },
    TX: {
      'Houston': 'Harris',
      'Dallas': 'Dallas',
      'Fort Worth': 'Tarrant',
      'San Antonio': 'Bexar',
      'Austin': 'Travis',
    },
    NY: {
      'Manhattan': 'New York',
      'Brooklyn': 'Kings',
      'Queens': 'Queens',
    },
  };

  return cityToCounty[state]?.[city] || null;
}

// Helper: Get assessor URL
function getAssessorUrl(state: string, county: string | null): string | undefined {
  if (!county) return undefined;
  return ASSESSOR_WEBSITES[state]?.[county];
}

// Parse property value from various formats
export function parsePropertyValue(value: string): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[$,]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Format address for display
export function formatAddress(property: PropertyRecord): string {
  const parts = [
    property.address,
    property.city,
    `${property.state} ${property.zip}`,
  ].filter(Boolean);
  return parts.join(', ');
}

// Property type icons/labels
export const PROPERTY_TYPE_LABELS: Record<PropertyRecord['propertyType'], string> = {
  single_family: 'Single Family Home',
  condo: 'Condominium',
  townhouse: 'Townhouse',
  multi_family: 'Multi-Family',
  land: 'Vacant Land',
  commercial: 'Commercial',
  other: 'Other',
};

// Florida-specific: Get property appraiser data
export async function getFloridaPropertyData(county: string, parcelId?: string, address?: string): Promise<{
  url: string;
  instructions: string;
}> {
  const countyUrls: Record<string, { url: string; instructions: string }> = {
    'Miami-Dade': {
      url: 'https://www.miamidade.gov/Apps/PA/propertysearch/',
      instructions: 'Enter the address or folio number to search for property records.',
    },
    'Broward': {
      url: 'https://bcpa.net/RecSearch.asp',
      instructions: 'Use the property search to find ownership, value, and tax information.',
    },
    'Palm Beach': {
      url: 'https://www.pbcgov.org/papa/property-search/',
      instructions: 'Search by owner name, address, or PCN (parcel control number).',
    },
    'Hillsborough': {
      url: 'https://gis.hcpafl.org/propertysearch/',
      instructions: 'Interactive map and search for Tampa Bay area properties.',
    },
    'Orange': {
      url: 'https://ocpafl.org/searches/ParcelSearch.aspx',
      instructions: 'Search Orlando area property records by various criteria.',
    },
  };

  return countyUrls[county] || {
    url: 'https://www.floridaassessors.com/',
    instructions: 'Visit the Florida Assessors website to find your county property appraiser.',
  };
}

// Export main functions
export const PropertyRecords = {
  searchByAddress: searchPropertyByAddress,
  searchByOwner: searchPropertyByOwner,
  searchByParcel: searchPropertyByParcel,
  getFloridaData: getFloridaPropertyData,
  parseValue: parsePropertyValue,
  formatAddress,
  assessorWebsites: ASSESSOR_WEBSITES,
  propertyTypeLabels: PROPERTY_TYPE_LABELS,
};
