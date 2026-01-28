// Criminal Records & Background Search
// Sources: State DOC, Sex offender registries, FBI (public data), County sheriff

interface CriminalRecord {
  name: string;
  dob?: string;
  caseNumber?: string;
  charges: string[];
  disposition?: string;
  sentenceDate?: string;
  releaseDate?: string;
  facility?: string;
  status: 'incarcerated' | 'released' | 'probation' | 'parole' | 'unknown';
  jurisdiction: string;
  source: string;
  sourceUrl: string;
}

interface SexOffenderRecord {
  name: string;
  aliases?: string[];
  dob?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  offenses: string[];
  registrationDate?: string;
  tier?: string;
  photo?: string;
  source: string;
  sourceUrl: string;
}

// State Department of Corrections Inmate Search URLs
const DOC_SEARCHES: Record<string, { name: string; url: string }> = {
  FL: {
    name: 'Florida DOC Inmate Search',
    url: 'https://fdc.myflorida.com/OffenderSearch/',
  },
  CA: {
    name: 'California CDCR Inmate Locator',
    url: 'https://inmatelocator.cdcr.ca.gov/',
  },
  TX: {
    name: 'Texas TDCJ Offender Search',
    url: 'https://offender.tdcj.texas.gov/OffenderSearch/',
  },
  NY: {
    name: 'New York DOCCS Inmate Lookup',
    url: 'http://nysdoccslookup.doccs.ny.gov/',
  },
  GA: {
    name: 'Georgia GDC Inmate Query',
    url: 'https://dcor.state.ga.us/GDC/OffenderQuery/jsp/OffQryForm.jsp',
  },
  PA: {
    name: 'Pennsylvania DOC Inmate Locator',
    url: 'https://inmatelocator.cor.pa.gov/',
  },
  IL: {
    name: 'Illinois IDOC Inmate Search',
    url: 'https://www.idoc.state.il.us/subsections/search/ISdefault.asp',
  },
  OH: {
    name: 'Ohio DRC Offender Search',
    url: 'https://appgateway.drc.ohio.gov/OffenderSearch',
  },
  AZ: {
    name: 'Arizona DOC Inmate Search',
    url: 'https://corrections.az.gov/public-resources/inmate-datasearch',
  },
  MI: {
    name: 'Michigan MDOC Offender Tracking',
    url: 'https://mdocweb.state.mi.us/otis2/otis2.aspx',
  },
  NC: {
    name: 'North Carolina DPS Offender Search',
    url: 'https://webapps.doc.state.nc.us/opi/offendersearch.do',
  },
  NJ: {
    name: 'New Jersey DOC Inmate Locator',
    url: 'https://www.state.nj.us/corrections/pages/index.shtml',
  },
  VA: {
    name: 'Virginia DOC Offender Locator',
    url: 'https://vadoc.virginia.gov/offenders/locator/',
  },
  WA: {
    name: 'Washington DOC Offender Search',
    url: 'https://www.doc.wa.gov/information/inmate-search/',
  },
  CO: {
    name: 'Colorado DOC Offender Search',
    url: 'https://www.colorado.gov/pacific/cdoc/offender-search',
  },
  MA: {
    name: 'Massachusetts DOC Inmate Locator',
    url: 'https://www.mass.gov/orgs/massachusetts-department-of-correction',
  },
  MO: {
    name: 'Missouri DOC Offender Search',
    url: 'https://doc.mo.gov/offender-search-page',
  },
  TN: {
    name: 'Tennessee TDOC Felony Offender Search',
    url: 'https://apps.tn.gov/foil/search.jsp',
  },
  IN: {
    name: 'Indiana DOC Offender Search',
    url: 'https://www.in.gov/idoc/offender-locator/',
  },
  WI: {
    name: 'Wisconsin DOC Offender Search',
    url: 'https://appsdoc.wi.gov/lop/',
  },
};

// Federal Bureau of Prisons Inmate Locator
const FEDERAL_SEARCHES = {
  bop: {
    name: 'Federal BOP Inmate Locator',
    url: 'https://www.bop.gov/inmateloc/',
  },
  usMarshals: {
    name: 'US Marshals Most Wanted',
    url: 'https://www.usmarshals.gov/what-we-do/fugitive-operations/most-wanted',
  },
  fbiMostWanted: {
    name: 'FBI Most Wanted',
    url: 'https://www.fbi.gov/wanted',
  },
};

// Sex Offender Registry URLs by State
const SEX_OFFENDER_REGISTRIES: Record<string, { name: string; url: string }> = {
  NATIONAL: {
    name: 'National Sex Offender Public Website',
    url: 'https://www.nsopw.gov/',
  },
  FL: {
    name: 'Florida Sexual Offenders',
    url: 'https://offender.fdle.state.fl.us/offender/sops/home.jsf',
  },
  CA: {
    name: 'California Megan\'s Law',
    url: 'https://www.meganslaw.ca.gov/',
  },
  TX: {
    name: 'Texas Public Sex Offender',
    url: 'https://publicsite.dps.texas.gov/SexOffenderRegistry',
  },
  NY: {
    name: 'New York Sex Offender Registry',
    url: 'https://www.criminaljustice.ny.gov/SomsPublic/search',
  },
  // Add more states as needed
};

// Search functions
export async function searchInmateByName(
  firstName: string,
  lastName: string,
  state?: string
): Promise<{
  records: CriminalRecord[];
  searchUrls: { name: string; url: string; state: string }[];
}> {
  const searchUrls: { name: string; url: string; state: string }[] = [];

  // Add federal search
  searchUrls.push({
    ...FEDERAL_SEARCHES.bop,
    state: 'Federal',
  });

  if (state) {
    // Add specific state DOC search
    const docSearch = DOC_SEARCHES[state.toUpperCase()];
    if (docSearch) {
      searchUrls.push({
        ...docSearch,
        state,
      });
    }
  } else {
    // Add all major state DOC searches
    Object.entries(DOC_SEARCHES).forEach(([st, search]) => {
      searchUrls.push({
        ...search,
        state: st,
      });
    });
  }

  return {
    records: [],
    searchUrls,
  };
}

export async function searchSexOffender(
  firstName: string,
  lastName: string,
  state?: string,
  zip?: string
): Promise<{
  records: SexOffenderRecord[];
  searchUrls: { name: string; url: string; state: string }[];
}> {
  const searchUrls: { name: string; url: string; state: string }[] = [];

  // Always add national registry
  searchUrls.push({
    ...SEX_OFFENDER_REGISTRIES.NATIONAL,
    state: 'National',
  });

  if (state) {
    const registry = SEX_OFFENDER_REGISTRIES[state.toUpperCase()];
    if (registry) {
      searchUrls.push({
        ...registry,
        state,
      });
    }
  }

  return {
    records: [],
    searchUrls,
  };
}

// Search for active warrants
export async function searchWarrants(
  firstName: string,
  lastName: string,
  state?: string
): Promise<{
  searchUrls: { name: string; url: string; type: string }[];
}> {
  const searchUrls: { name: string; url: string; type: string }[] = [];

  // Federal warrants
  searchUrls.push({
    name: 'US Marshals Fugitives',
    url: 'https://www.usmarshals.gov/what-we-do/fugitive-operations/most-wanted',
    type: 'Federal',
  });

  // State-specific warrant searches would be added based on available APIs/websites
  if (state === 'FL') {
    searchUrls.push({
      name: 'Florida FDLE Active Warrants',
      url: 'https://pas.fdle.state.fl.us/pas/restricted/PAS/person/WantedPersons.jsf',
      type: 'State',
    });
  }

  return { searchUrls };
}

// Arrest records search
export function getArrestRecordUrls(name: string, state?: string): { name: string; url: string; type: string }[] {
  const urls: { name: string; url: string; type: string }[] = [];

  // County sheriff/jail booking searches are typically county-specific
  // Adding general search resources
  urls.push({
    name: 'Arrests.org',
    url: 'https://arrests.org/',
    type: 'Aggregator',
  });

  urls.push({
    name: 'JailBase',
    url: `https://www.jailbase.com/en/search/?q=${encodeURIComponent(name)}`,
    type: 'Aggregator',
  });

  urls.push({
    name: 'BustedNewspaper',
    url: 'https://bustednewspaper.com/',
    type: 'Mugshots',
  });

  return urls;
}

// Background check providers (free tier links)
export function getBackgroundCheckUrls(name: string): { name: string; url: string; description: string }[] {
  return [
    {
      name: 'Instant Checkmate',
      url: 'https://www.instantcheckmate.com/',
      description: 'Background reports (paid)',
    },
    {
      name: 'TruthFinder',
      url: 'https://www.truthfinder.com/',
      description: 'Background check service (paid)',
    },
    {
      name: 'BeenVerified',
      url: 'https://www.beenverified.com/',
      description: 'Background reports (paid)',
    },
    {
      name: 'Spokeo',
      url: `https://www.spokeo.com/${encodeURIComponent(name.replace(' ', '-'))}`,
      description: 'People search (free basic)',
    },
    {
      name: 'PeopleFinders',
      url: 'https://www.peoplefinders.com/',
      description: 'Background search (paid)',
    },
  ];
}

export const CriminalRecords = {
  searchInmate: searchInmateByName,
  searchSexOffender,
  searchWarrants,
  getArrestUrls: getArrestRecordUrls,
  getBackgroundCheckUrls,
  docSearches: DOC_SEARCHES,
  federalSearches: FEDERAL_SEARCHES,
  sexOffenderRegistries: SEX_OFFENDER_REGISTRIES,
};
