// Public Records Search
// Sources: Vital records, SSDI, voter records, public databases

interface DeathRecord {
  name: string;
  birthDate?: string;
  deathDate: string;
  lastResidence?: {
    city: string;
    state: string;
    zip: string;
  };
  ssn?: string; // Last 4 only
  source: string;
  sourceUrl: string;
}

interface VoterRecord {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  partyAffiliation?: string;
  registrationDate?: string;
  lastVoted?: string;
  status: 'active' | 'inactive' | 'cancelled';
  source: string;
}

interface MarriageDivorceRecord {
  type: 'marriage' | 'divorce';
  parties: string[];
  date: string;
  county: string;
  state: string;
  source: string;
  sourceUrl?: string;
}

// SSDI (Social Security Death Index) Search URLs
// Note: Full SSDI access typically requires subscription, but some free resources exist
export function getSSDISearchUrls(name: string): { name: string; url: string; description: string }[] {
  return [
    {
      name: 'FamilySearch SSDI',
      url: 'https://www.familysearch.org/search/record/results?q.surname=' + encodeURIComponent(name.split(' ').pop() || ''),
      description: 'Free SSDI search through FamilySearch (requires free account)',
    },
    {
      name: 'Ancestry SSDI',
      url: 'https://www.ancestry.com/search/categories/34/',
      description: 'Social Security Death Index (subscription)',
    },
    {
      name: 'FindAGrave',
      url: `https://www.findagrave.com/memorial/search?firstname=&middlename=&lastname=${encodeURIComponent(name.split(' ').pop() || '')}&cemeteryid=&birthyear=&birthyearfilter=&deathyear=&deathyearfilter=&location=&memorialid=&mcid=&linkedToName=&datefilter=&orderby=r&plot=`,
      description: 'Cemetery records and grave locations',
    },
    {
      name: 'BillionGraves',
      url: 'https://billiongraves.com/search',
      description: 'Headstone photos and burial records',
    },
    {
      name: 'Legacy.com Obituaries',
      url: `https://www.legacy.com/search?firstName=&lastName=${encodeURIComponent(name.split(' ').pop() || '')}&countryId=1`,
      description: 'Newspaper obituary search',
    },
  ];
}

// Vital Records by State
const VITAL_RECORDS_OFFICES: Record<string, {
  name: string;
  url: string;
  records: string[];
}> = {
  FL: {
    name: 'Florida Vital Records',
    url: 'https://www.floridahealth.gov/certificates/certificates/index.html',
    records: ['Birth', 'Death', 'Marriage', 'Divorce'],
  },
  CA: {
    name: 'California Vital Records',
    url: 'https://www.cdph.ca.gov/Programs/CHSI/Pages/Vital-Records.aspx',
    records: ['Birth', 'Death', 'Marriage', 'Divorce'],
  },
  TX: {
    name: 'Texas Vital Statistics',
    url: 'https://www.dshs.texas.gov/vital-statistics',
    records: ['Birth', 'Death', 'Marriage', 'Divorce'],
  },
  NY: {
    name: 'New York Vital Records',
    url: 'https://www.health.ny.gov/vital_records/',
    records: ['Birth', 'Death', 'Marriage'],
  },
  // Add more states
};

export function getVitalRecordsUrl(state: string): {
  office: typeof VITAL_RECORDS_OFFICES[string] | null;
  searchUrl: string;
} {
  const office = VITAL_RECORDS_OFFICES[state.toUpperCase()] || null;
  return {
    office,
    searchUrl: office?.url || 'https://www.cdc.gov/nchs/w2w/index.htm',
  };
}

// Voter Registration Search URLs by State
const VOTER_REGISTRATION_SEARCHES: Record<string, { name: string; url: string }> = {
  FL: {
    name: 'Florida Voter Information',
    url: 'https://registration.elections.myflorida.com/CheckVoterStatus',
  },
  CA: {
    name: 'California Voter Status',
    url: 'https://voterstatus.sos.ca.gov/',
  },
  TX: {
    name: 'Texas Voter Registration',
    url: 'https://teamrv-mvp.sos.texas.gov/MVP/mvp.do',
  },
  NY: {
    name: 'New York Voter Lookup',
    url: 'https://voterlookup.elections.ny.gov/',
  },
  GA: {
    name: 'Georgia My Voter Page',
    url: 'https://mvp.sos.ga.gov/',
  },
  PA: {
    name: 'Pennsylvania Voter Registration',
    url: 'https://www.vote.pa.gov/Voting-in-PA/Pages/Voting-in-PA.aspx',
  },
  OH: {
    name: 'Ohio Voter Lookup',
    url: 'https://www.sos.state.oh.us/elections/voters/',
  },
  NC: {
    name: 'North Carolina Voter Search',
    url: 'https://vt.ncsbe.gov/RegLkup/',
  },
  MI: {
    name: 'Michigan Voter Information',
    url: 'https://mvic.sos.state.mi.us/',
  },
};

export function getVoterSearchUrl(state: string): {
  search: typeof VOTER_REGISTRATION_SEARCHES[string] | null;
  statewide: string;
} {
  return {
    search: VOTER_REGISTRATION_SEARCHES[state.toUpperCase()] || null,
    statewide: 'https://www.vote.org/am-i-registered-to-vote/',
  };
}

// Marriage and Divorce Records
export function getMarriageDivorceUrls(state: string): { name: string; url: string; type: string }[] {
  const urls: { name: string; url: string; type: string }[] = [];

  // State-specific
  const vitalRecords = VITAL_RECORDS_OFFICES[state.toUpperCase()];
  if (vitalRecords) {
    urls.push({
      name: `${vitalRecords.name} - Marriage/Divorce`,
      url: vitalRecords.url,
      type: 'Official',
    });
  }

  // General resources
  urls.push({
    name: 'FamilySearch Marriage Records',
    url: 'https://www.familysearch.org/search/collection/list?page=1&ec=MARRIAGE',
    type: 'Free',
  });

  urls.push({
    name: 'Ancestry Marriage Records',
    url: 'https://www.ancestry.com/search/categories/34/',
    type: 'Subscription',
  });

  return urls;
}

// Birth Records (typically restricted but search links available)
export function getBirthRecordUrls(state: string): { name: string; url: string; notes: string }[] {
  const urls: { name: string; url: string; notes: string }[] = [];

  const vitalRecords = VITAL_RECORDS_OFFICES[state.toUpperCase()];
  if (vitalRecords) {
    urls.push({
      name: vitalRecords.name,
      url: vitalRecords.url,
      notes: 'Official vital records office - may require proof of relationship',
    });
  }

  urls.push({
    name: 'VitalChek',
    url: 'https://www.vitalchek.com/',
    notes: 'Order vital records online (fees apply)',
  });

  return urls;
}

// Census Records (historical)
export function getCensusRecordUrls(name: string): { name: string; url: string; coverage: string }[] {
  const lastName = name.split(' ').pop() || '';
  return [
    {
      name: 'FamilySearch Census',
      url: `https://www.familysearch.org/search/record/results?q.surname=${encodeURIComponent(lastName)}&f.collectionId=1325221`,
      coverage: '1790-1950 US Census',
    },
    {
      name: 'Ancestry Census',
      url: 'https://www.ancestry.com/search/categories/35/',
      coverage: 'Full census collection (subscription)',
    },
    {
      name: 'Archives.gov Census',
      url: 'https://www.archives.gov/research/census',
      coverage: 'National Archives census resources',
    },
  ];
}

// Military Records
export function getMilitaryRecordUrls(name: string): { name: string; url: string; description: string }[] {
  return [
    {
      name: 'National Personnel Records Center',
      url: 'https://www.archives.gov/veterans/military-service-records',
      description: 'Official military service records (with proper authorization)',
    },
    {
      name: 'Veterans Benefits Search',
      url: 'https://www.va.gov/',
      description: 'VA benefits and records',
    },
    {
      name: 'DPAA POW/MIA',
      url: 'https://dpaa.secure.force.com/',
      description: 'Defense POW/MIA Accounting Agency',
    },
    {
      name: 'FamilySearch Military Records',
      url: 'https://www.familysearch.org/search/collection/list?page=1&ec=MILITARY',
      description: 'Historical military records',
    },
    {
      name: 'Fold3 Military Records',
      url: 'https://www.fold3.com/',
      description: 'Military records from the Archives (subscription)',
    },
  ];
}

// Immigration Records
export function getImmigrationRecordUrls(name: string): { name: string; url: string; description: string }[] {
  const lastName = name.split(' ').pop() || '';
  return [
    {
      name: 'Ellis Island Passenger Search',
      url: `https://heritage.statueofliberty.org/passenger`,
      description: 'Ellis Island arrival records (1892-1924)',
    },
    {
      name: 'Castle Garden Passenger Search',
      url: 'https://www.castlegarden.org/',
      description: 'Pre-Ellis Island arrivals (1820-1892)',
    },
    {
      name: 'Ancestry Immigration',
      url: 'https://www.ancestry.com/search/categories/40/',
      description: 'Immigration and travel records',
    },
    {
      name: 'USCIS Genealogy',
      url: 'https://www.uscis.gov/history-and-genealogy',
      description: 'Historical immigration records',
    },
  ];
}

// Public records aggregators
export function getPublicRecordAggregators(): { name: string; url: string; type: string }[] {
  return [
    {
      name: 'PACER (Court Records)',
      url: 'https://pacer.uscourts.gov/',
      type: 'Court Records',
    },
    {
      name: 'RECAP Archive',
      url: 'https://www.courtlistener.com/recap/',
      type: 'Free Court Records',
    },
    {
      name: 'SEC EDGAR',
      url: 'https://www.sec.gov/edgar/searchedgar/companysearch',
      type: 'Corporate Filings',
    },
    {
      name: 'FEC (Campaign Finance)',
      url: 'https://www.fec.gov/data/',
      type: 'Political Donations',
    },
    {
      name: 'OpenSecrets',
      url: 'https://www.opensecrets.org/',
      type: 'Political Money',
    },
    {
      name: 'USASpending',
      url: 'https://www.usaspending.gov/',
      type: 'Government Contracts',
    },
    {
      name: 'FOIA.gov',
      url: 'https://www.foia.gov/',
      type: 'FOIA Requests',
    },
  ];
}

export const PublicRecords = {
  getSSDIUrls: getSSDISearchUrls,
  getVitalRecordsUrl,
  getVoterSearchUrl,
  getMarriageDivorceUrls,
  getBirthRecordUrls,
  getCensusRecordUrls,
  getMilitaryRecordUrls,
  getImmigrationRecordUrls,
  getAggregators: getPublicRecordAggregators,
  vitalRecordsOffices: VITAL_RECORDS_OFFICES,
  voterRegistration: VOTER_REGISTRATION_SEARCHES,
};
