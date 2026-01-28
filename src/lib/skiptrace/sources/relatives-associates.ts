// Relatives and Associates Discovery
// Finds connections through shared addresses, phone records, and public data

import { RelativeRecord, AssociateRecord, AddressRecord } from '../types';

// Relationship types
const RELATIONSHIP_TYPES = {
  spouse: ['wife', 'husband', 'spouse', 'partner', 'married'],
  parent: ['mother', 'father', 'mom', 'dad', 'parent'],
  child: ['son', 'daughter', 'child'],
  sibling: ['brother', 'sister', 'sibling'],
  other: ['relative', 'family', 'cousin', 'aunt', 'uncle', 'grandparent', 'grandchild'],
};

// Associate types
const ASSOCIATE_TYPES = {
  business: ['business partner', 'co-owner', 'officer', 'director', 'manager'],
  neighbor: ['neighbor', 'lives near', 'same address'],
  coworker: ['colleague', 'coworker', 'employee', 'employer'],
};

interface RelativesSearchResult {
  relatives: RelativeRecord[];
  associates: AssociateRecord[];
  sharedAddresses: {
    address: string;
    residents: string[];
  }[];
  searchUrls: { name: string; url: string; description: string }[];
}

// Search for relatives by address history
export async function searchRelativesByAddress(
  address: string,
  city: string,
  state: string
): Promise<{
  potentialResidents: string[];
  searchUrls: { name: string; url: string }[];
}> {
  const searchUrls = [
    {
      name: 'Whitepages Address Lookup',
      url: `https://www.whitepages.com/address/${encodeURIComponent(address.replace(/\s+/g, '-'))}/${encodeURIComponent(city)}-${state}`,
    },
    {
      name: 'That\'s Them Address',
      url: `https://thatsthem.com/address/${encodeURIComponent(`${address}, ${city}, ${state}`)}`,
    },
    {
      name: 'Fast People Search',
      url: 'https://www.fastpeoplesearch.com/',
    },
  ];

  return {
    potentialResidents: [],
    searchUrls,
  };
}

// Search for relatives by last name and location
export async function searchRelativesByName(
  lastName: string,
  city?: string,
  state?: string
): Promise<{
  potentialRelatives: string[];
  searchUrls: { name: string; url: string }[];
}> {
  const locationPart = city && state ? ` ${city} ${state}` : state ? ` ${state}` : '';

  const searchUrls = [
    {
      name: 'Google Search',
      url: `https://www.google.com/search?q="${encodeURIComponent(lastName)}"${encodeURIComponent(locationPart)} family relatives`,
    },
    {
      name: 'Whitepages',
      url: `https://www.whitepages.com/name/${encodeURIComponent(lastName)}${city ? `/${encodeURIComponent(city)}-${state}` : ''}`,
    },
    {
      name: 'TruePeopleSearch',
      url: 'https://www.truepeoplesearch.com/',
    },
  ];

  return {
    potentialRelatives: [],
    searchUrls,
  };
}

// Search for business associates through SEC filings
export async function searchBusinessAssociates(
  personName: string
): Promise<{
  companies: { name: string; role: string; coOfficers: string[] }[];
  searchUrls: { name: string; url: string }[];
}> {
  const searchUrls = [
    {
      name: 'SEC EDGAR Person Search',
      url: `https://efts.sec.gov/LATEST/search?q="${encodeURIComponent(personName)}"&dateRange=custom&startdt=2000-01-01&forms=10-K%2CDEF%2014A`,
    },
    {
      name: 'OpenCorporates Officer Search',
      url: `https://opencorporates.com/officers?q=${encodeURIComponent(personName)}`,
    },
    {
      name: 'Crunchbase People',
      url: `https://www.crunchbase.com/discover/people?query=${encodeURIComponent(personName)}`,
    },
  ];

  return {
    companies: [],
    searchUrls,
  };
}

// Neighbor search
export async function searchNeighbors(
  address: string,
  city: string,
  state: string
): Promise<{
  neighbors: { address: string; name?: string }[];
  searchUrls: { name: string; url: string }[];
}> {
  const searchUrls = [
    {
      name: 'County Property Records',
      url: `https://www.google.com/search?q=${encodeURIComponent(`${city} ${state} property appraiser`)}`,
    },
    {
      name: 'Zillow Neighborhood',
      url: `https://www.zillow.com/homes/${encodeURIComponent(`${address}, ${city}, ${state}`.replace(/\s+/g, '-'))}_rb/`,
    },
    {
      name: 'Nextdoor (Login Required)',
      url: 'https://nextdoor.com/',
    },
  ];

  return {
    neighbors: [],
    searchUrls,
  };
}

// Comprehensive relatives search
export async function searchRelatives(
  firstName: string,
  lastName: string,
  options?: {
    currentAddress?: string;
    city?: string;
    state?: string;
    previousAddresses?: AddressRecord[];
  }
): Promise<RelativesSearchResult> {
  const searchUrls: { name: string; url: string; description: string }[] = [];

  // General people search sites
  const fullName = `${firstName} ${lastName}`;
  const location = options?.city && options?.state ? `${options.city}, ${options.state}` : '';

  // Free people search resources
  searchUrls.push(
    {
      name: 'TruePeopleSearch',
      url: `https://www.truepeoplesearch.com/results?name=${encodeURIComponent(fullName)}${location ? `&citystatezip=${encodeURIComponent(location)}` : ''}`,
      description: 'Free people search with relatives',
    },
    {
      name: 'FastPeopleSearch',
      url: `https://www.fastpeoplesearch.com/name/${encodeURIComponent(fullName.toLowerCase().replace(/\s+/g, '-'))}`,
      description: 'Free background search with associates',
    },
    {
      name: 'That\'s Them',
      url: `https://thatsthem.com/name/${encodeURIComponent(firstName)}-${encodeURIComponent(lastName)}${options?.state ? `/${options.state}` : ''}`,
      description: 'Free people finder with relatives',
    },
    {
      name: 'Whitepages',
      url: `https://www.whitepages.com/name/${encodeURIComponent(firstName)}-${encodeURIComponent(lastName)}${options?.city ? `/${encodeURIComponent(options.city)}-${options.state}` : ''}`,
      description: 'Reverse lookup with family connections',
    },
    {
      name: 'Spokeo',
      url: `https://www.spokeo.com/${encodeURIComponent(firstName)}-${encodeURIComponent(lastName)}`,
      description: 'People search aggregator',
    },
    {
      name: 'PeekYou',
      url: `https://www.peekyou.com/${encodeURIComponent(firstName)}_${encodeURIComponent(lastName)}`,
      description: 'Social media and people search',
    }
  );

  // Genealogy resources for family connections
  searchUrls.push(
    {
      name: 'FamilySearch',
      url: `https://www.familysearch.org/search/record/results?q.surname=${encodeURIComponent(lastName)}&q.givenName=${encodeURIComponent(firstName)}`,
      description: 'Free genealogy records',
    },
    {
      name: 'FindAGrave',
      url: `https://www.findagrave.com/memorial/search?firstname=${encodeURIComponent(firstName)}&lastname=${encodeURIComponent(lastName)}`,
      description: 'Cemetery records, may reveal family',
    }
  );

  // Business association resources
  const businessAssociates = await searchBusinessAssociates(fullName);
  searchUrls.push(...businessAssociates.searchUrls.map(s => ({
    ...s,
    description: 'Business connections',
  })));

  return {
    relatives: [],
    associates: [],
    sharedAddresses: [],
    searchUrls,
  };
}

// Get household members at an address
export async function getHouseholdMembers(
  address: string,
  city: string,
  state: string,
  zip?: string
): Promise<{
  members: { name: string; relationship?: string; age?: number }[];
  searchUrls: { name: string; url: string }[];
}> {
  const searchUrls = [
    {
      name: 'Whitepages Address',
      url: `https://www.whitepages.com/address/${encodeURIComponent(address.replace(/\s+/g, '-'))}/${encodeURIComponent(city)}-${state}`,
    },
    {
      name: 'TruePeopleSearch Address',
      url: `https://www.truepeoplesearch.com/resultaddress?streetaddress=${encodeURIComponent(address)}&citystatezip=${encodeURIComponent(`${city}, ${state}${zip ? ` ${zip}` : ''}`)}`,
    },
    {
      name: 'Fast People Search',
      url: 'https://www.fastpeoplesearch.com/',
    },
  ];

  return {
    members: [],
    searchUrls,
  };
}

// Check if two people are related (by last name patterns)
export function checkPotentialRelation(name1: string, name2: string): {
  sameLastName: boolean;
  maidenNamePossible: boolean;
  hyphenatedMatch: boolean;
} {
  const parts1 = name1.toLowerCase().split(/\s+/);
  const parts2 = name2.toLowerCase().split(/\s+/);

  const lastName1 = parts1[parts1.length - 1];
  const lastName2 = parts2[parts2.length - 1];

  // Check for hyphenated names
  const hyphenated1 = lastName1.includes('-') ? lastName1.split('-') : [lastName1];
  const hyphenated2 = lastName2.includes('-') ? lastName2.split('-') : [lastName2];

  const hyphenatedMatch = hyphenated1.some(h1 =>
    hyphenated2.some(h2 => h1 === h2)
  );

  return {
    sameLastName: lastName1 === lastName2,
    maidenNamePossible: false, // Would need additional data
    hyphenatedMatch,
  };
}

export const RelativesAssociates = {
  searchByAddress: searchRelativesByAddress,
  searchByName: searchRelativesByName,
  searchBusinessAssociates,
  searchNeighbors,
  searchRelatives,
  getHouseholdMembers,
  checkPotentialRelation,
  relationshipTypes: RELATIONSHIP_TYPES,
  associateTypes: ASSOCIATE_TYPES,
};
