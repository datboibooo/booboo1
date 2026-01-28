// Address History Tracker
// Sources: Property records, voter records, credit header data, people search

import { AddressRecord } from '../types';

interface AddressHistoryResult {
  addresses: AddressRecord[];
  searchUrls: { name: string; url: string; description: string }[];
}

// Major people search sites for address history
const ADDRESS_SEARCH_SITES = {
  truePeopleSearch: {
    name: 'TruePeopleSearch',
    baseUrl: 'https://www.truepeoplesearch.com',
    description: 'Free address history lookup',
  },
  fastPeopleSearch: {
    name: 'FastPeopleSearch',
    baseUrl: 'https://www.fastpeoplesearch.com',
    description: 'Free previous addresses',
  },
  thatsThem: {
    name: "That's Them",
    baseUrl: 'https://thatsthem.com',
    description: 'Address and phone history',
  },
  whitepages: {
    name: 'Whitepages',
    baseUrl: 'https://www.whitepages.com',
    description: 'Address history and neighbors',
  },
  spokeo: {
    name: 'Spokeo',
    baseUrl: 'https://www.spokeo.com',
    description: 'Address and contact history',
  },
};

// Search for address history
export async function searchAddressHistory(
  firstName: string,
  lastName: string,
  options?: {
    currentCity?: string;
    currentState?: string;
    age?: number;
  }
): Promise<AddressHistoryResult> {
  const searchUrls: { name: string; url: string; description: string }[] = [];
  const fullName = `${firstName} ${lastName}`;
  const location = options?.currentCity && options?.currentState
    ? `${options.currentCity}, ${options.currentState}`
    : '';

  // TruePeopleSearch
  searchUrls.push({
    name: ADDRESS_SEARCH_SITES.truePeopleSearch.name,
    url: `${ADDRESS_SEARCH_SITES.truePeopleSearch.baseUrl}/results?name=${encodeURIComponent(fullName)}${location ? `&citystatezip=${encodeURIComponent(location)}` : ''}`,
    description: ADDRESS_SEARCH_SITES.truePeopleSearch.description,
  });

  // FastPeopleSearch
  searchUrls.push({
    name: ADDRESS_SEARCH_SITES.fastPeopleSearch.name,
    url: `${ADDRESS_SEARCH_SITES.fastPeopleSearch.baseUrl}/name/${encodeURIComponent(fullName.toLowerCase().replace(/\s+/g, '-'))}`,
    description: ADDRESS_SEARCH_SITES.fastPeopleSearch.description,
  });

  // That's Them
  searchUrls.push({
    name: ADDRESS_SEARCH_SITES.thatsThem.name,
    url: `${ADDRESS_SEARCH_SITES.thatsThem.baseUrl}/name/${encodeURIComponent(firstName)}-${encodeURIComponent(lastName)}${options?.currentState ? `/${options.currentState}` : ''}`,
    description: ADDRESS_SEARCH_SITES.thatsThem.description,
  });

  // Whitepages
  searchUrls.push({
    name: ADDRESS_SEARCH_SITES.whitepages.name,
    url: `${ADDRESS_SEARCH_SITES.whitepages.baseUrl}/name/${encodeURIComponent(firstName)}-${encodeURIComponent(lastName)}${options?.currentCity ? `/${encodeURIComponent(options.currentCity)}-${options.currentState}` : ''}`,
    description: ADDRESS_SEARCH_SITES.whitepages.description,
  });

  // Spokeo
  searchUrls.push({
    name: ADDRESS_SEARCH_SITES.spokeo.name,
    url: `${ADDRESS_SEARCH_SITES.spokeo.baseUrl}/${encodeURIComponent(firstName)}-${encodeURIComponent(lastName)}${options?.currentState ? `/${options.currentState}` : ''}`,
    description: ADDRESS_SEARCH_SITES.spokeo.description,
  });

  // Voter registration (may show address history)
  if (options?.currentState) {
    const voterUrls = getVoterRegistrationUrl(options.currentState);
    if (voterUrls) {
      searchUrls.push({
        name: `${options.currentState} Voter Registration`,
        url: voterUrls,
        description: 'Voter records may show address history',
      });
    }
  }

  // Property records (ownership addresses)
  searchUrls.push({
    name: 'Property Ownership Search',
    url: `https://www.google.com/search?q="${encodeURIComponent(fullName)}" property owner real estate ${location}`,
    description: 'Search for properties owned by person',
  });

  return {
    addresses: [],
    searchUrls,
  };
}

// Voter registration URLs by state
function getVoterRegistrationUrl(state: string): string | null {
  const voterUrls: Record<string, string> = {
    FL: 'https://registration.elections.myflorida.com/CheckVoterStatus',
    CA: 'https://voterstatus.sos.ca.gov/',
    TX: 'https://teamrv-mvp.sos.texas.gov/MVP/mvp.do',
    NY: 'https://voterlookup.elections.ny.gov/',
    GA: 'https://mvp.sos.ga.gov/',
    NC: 'https://vt.ncsbe.gov/RegLkup/',
    PA: 'https://www.vote.pa.gov/Voting-in-PA/Pages/Voting-in-PA.aspx',
    OH: 'https://www.sos.state.oh.us/elections/voters/',
    MI: 'https://mvic.sos.state.mi.us/',
    AZ: 'https://voter.azsos.gov/VoterView/',
    NV: 'https://www.nvsos.gov/votersearch/',
    CO: 'https://www.sos.state.co.us/voter/pages/pub/olvr/findVoterReg.xhtml',
  };

  return voterUrls[state.toUpperCase()] || null;
}

// Reverse address search (find all residents at an address)
export async function reverseAddressLookup(
  address: string,
  city: string,
  state: string,
  zip?: string
): Promise<{
  searchUrls: { name: string; url: string }[];
}> {
  const fullAddress = `${address}, ${city}, ${state}${zip ? ` ${zip}` : ''}`;

  return {
    searchUrls: [
      {
        name: 'Whitepages Address',
        url: `https://www.whitepages.com/address/${encodeURIComponent(address.replace(/\s+/g, '-'))}/${encodeURIComponent(city)}-${state}`,
      },
      {
        name: 'TruePeopleSearch Address',
        url: `https://www.truepeoplesearch.com/resultaddress?streetaddress=${encodeURIComponent(address)}&citystatezip=${encodeURIComponent(`${city}, ${state}${zip ? ` ${zip}` : ''}`)}`,
      },
      {
        name: "That's Them Address",
        url: `https://thatsthem.com/address/${encodeURIComponent(fullAddress)}`,
      },
      {
        name: 'FastPeopleSearch Address',
        url: `https://www.fastpeoplesearch.com/address/${encodeURIComponent(address.toLowerCase().replace(/\s+/g, '-'))}_${encodeURIComponent(city.toLowerCase())}-${state.toLowerCase()}`,
      },
    ],
  };
}

// Search USPS for address validation/standardization
export function getUSPSLookupUrl(): string {
  return 'https://tools.usps.com/zip-code-lookup.htm';
}

// County assessor lookup for property history
export function getPropertyAssessorUrl(state: string, county?: string): string | null {
  // Major Florida counties
  if (state.toUpperCase() === 'FL') {
    const flCounties: Record<string, string> = {
      'miami-dade': 'https://www.miamidade.gov/Apps/PA/propertysearch/',
      'broward': 'https://bcpa.net/RecSearch.asp',
      'palm beach': 'https://www.pbcgov.org/papa/property-search/',
      'hillsborough': 'https://gis.hcpafl.org/propertysearch/',
      'orange': 'https://ocpafl.org/searches/ParcelSearch.aspx',
      'duval': 'https://paopropertysearch.coj.net/',
    };
    if (county) {
      return flCounties[county.toLowerCase()] || null;
    }
  }
  return null;
}

// Format address for display
export function formatAddress(address: AddressRecord): string {
  const parts = [
    address.street,
    address.street2,
  ].filter(Boolean);

  const cityStateZip = [
    address.city,
    address.state,
    address.zip,
  ].filter(Boolean).join(', ');

  return [...parts, cityStateZip].join('\n');
}

// Parse address string into components
export function parseAddress(addressString: string): Partial<AddressRecord> {
  // Simple parser - would need more sophisticated parsing for production
  const parts = addressString.split(',').map(s => s.trim());

  if (parts.length >= 3) {
    const stateZip = parts[parts.length - 1].split(/\s+/);
    return {
      street: parts[0],
      city: parts[parts.length - 2],
      state: stateZip[0],
      zip: stateZip[1],
    };
  }

  return {
    street: addressString,
  };
}

// Address type detection
export function detectAddressType(address: string): AddressRecord['type'] {
  const lower = address.toLowerCase();
  if (lower.includes('po box') || lower.includes('p.o. box')) {
    return 'mailing';
  }
  return 'unknown';
}

export const AddressHistory = {
  search: searchAddressHistory,
  reverseAddress: reverseAddressLookup,
  getVoterUrl: getVoterRegistrationUrl,
  getUSPSUrl: getUSPSLookupUrl,
  getPropertyUrl: getPropertyAssessorUrl,
  formatAddress,
  parseAddress,
  detectType: detectAddressType,
  searchSites: ADDRESS_SEARCH_SITES,
};
