// Professional License Search
// Sources: State licensing boards, professional associations

import { LicenseRecord } from '../types';

// State licensing board websites and search URLs
const LICENSE_BOARDS: Record<string, Record<string, { name: string; url: string; searchUrl?: string }>> = {
  FL: {
    all: { name: 'Florida DBPR', url: 'https://www.myfloridalicense.com', searchUrl: 'https://www.myfloridalicense.com/wl11.asp' },
    contractor: { name: 'FL Construction Industry', url: 'https://www.myfloridalicense.com/wl11.asp?mode=0&SID=&bession_id=' },
    real_estate: { name: 'FL Real Estate Commission', url: 'https://www.myfloridalicense.com/wl11.asp?mode=2&SID=&bession_id=' },
    medical: { name: 'FL Board of Medicine', url: 'https://appsmqa.doh.state.fl.us/MQASearchServices/Home' },
    nursing: { name: 'FL Board of Nursing', url: 'https://appsmqa.doh.state.fl.us/MQASearchServices/Home' },
    attorney: { name: 'FL Bar', url: 'https://www.floridabar.org/directories/find-mbr/' },
    cpa: { name: 'FL Board of Accountancy', url: 'https://www.myfloridalicense.com/wl11.asp' },
    insurance: { name: 'FL Insurance Licenses', url: 'https://licenseesearch.fldfs.com/' },
  },
  CA: {
    contractor: { name: 'CA Contractors State License Board', url: 'https://www.cslb.ca.gov/onlineservices/checklicenseII/checklicense.aspx' },
    real_estate: { name: 'CA DRE', url: 'https://www.dre.ca.gov/consumers/verify_license.html' },
    medical: { name: 'CA Medical Board', url: 'https://mbc.ca.gov/breeze/' },
    attorney: { name: 'State Bar of California', url: 'https://apps.calbar.ca.gov/attorney/LicenseeSearch/QuickSearch' },
    nursing: { name: 'CA Board of Nursing', url: 'https://www.rn.ca.gov/consumers/verification.shtml' },
  },
  TX: {
    contractor: { name: 'TX TDLR', url: 'https://www.tdlr.texas.gov/LicenseSearch/' },
    real_estate: { name: 'TX Real Estate Commission', url: 'https://www.trec.texas.gov/license-holder-search' },
    medical: { name: 'TX Medical Board', url: 'https://profile.tmb.state.tx.us/SearchVerify.aspx' },
    attorney: { name: 'State Bar of Texas', url: 'https://www.texasbar.com/AM/Template.cfm?Section=Find_A_Lawyer' },
    nursing: { name: 'TX Board of Nursing', url: 'https://www.bon.texas.gov/VerifyLicense.asp' },
  },
  NY: {
    all: { name: 'NY Office of Professions', url: 'http://www.op.nysed.gov/opsearches.htm' },
    medical: { name: 'NY Office of Professions', url: 'http://www.op.nysed.gov/opsearches.htm' },
    attorney: { name: 'NY Attorney Registration', url: 'https://iapps.courts.state.ny.us/attorneyservices/search' },
  },
};

// License types with descriptions
const LICENSE_TYPES: Record<string, { name: string; description: string }> = {
  contractor_general: { name: 'General Contractor', description: 'Licensed to perform general construction work' },
  contractor_roofing: { name: 'Roofing Contractor', description: 'Licensed for roofing work' },
  contractor_electrical: { name: 'Electrical Contractor', description: 'Licensed for electrical work' },
  contractor_plumbing: { name: 'Plumbing Contractor', description: 'Licensed for plumbing work' },
  contractor_hvac: { name: 'HVAC Contractor', description: 'Licensed for heating, ventilation, and AC work' },
  real_estate_agent: { name: 'Real Estate Agent', description: 'Licensed real estate salesperson' },
  real_estate_broker: { name: 'Real Estate Broker', description: 'Licensed real estate broker' },
  attorney: { name: 'Attorney at Law', description: 'Licensed to practice law' },
  physician: { name: 'Physician', description: 'Licensed medical doctor (MD)' },
  nurse_rn: { name: 'Registered Nurse', description: 'RN license' },
  nurse_lpn: { name: 'Licensed Practical Nurse', description: 'LPN license' },
  cpa: { name: 'CPA', description: 'Certified Public Accountant' },
  insurance_agent: { name: 'Insurance Agent', description: 'Licensed insurance agent' },
  mortgage_broker: { name: 'Mortgage Broker', description: 'Licensed mortgage loan originator' },
  cosmetologist: { name: 'Cosmetologist', description: 'Licensed cosmetologist' },
  pharmacist: { name: 'Pharmacist', description: 'Licensed pharmacist' },
};

interface LicenseSearchResult {
  licenses: LicenseRecord[];
  searchUrls: { name: string; url: string; state: string }[];
  sources: string[];
}

// Search for professional licenses by name
export async function searchLicensesByName(
  firstName: string,
  lastName: string,
  state?: string,
  licenseType?: string
): Promise<LicenseSearchResult> {
  const searchUrls: { name: string; url: string; state: string }[] = [];
  const sources: string[] = [];
  const fullName = `${firstName} ${lastName}`;

  if (state) {
    // Search specific state
    const stateBoards = LICENSE_BOARDS[state.toUpperCase()];
    if (stateBoards) {
      if (licenseType && stateBoards[licenseType]) {
        searchUrls.push({ ...stateBoards[licenseType], state });
      } else {
        // Add all boards for the state
        Object.entries(stateBoards).forEach(([, board]) => {
          searchUrls.push({ ...board, state });
        });
      }
      sources.push(`${state} Licensing Boards`);
    }
  } else {
    // Search major states
    ['FL', 'CA', 'TX', 'NY'].forEach(st => {
      const stateBoards = LICENSE_BOARDS[st];
      if (stateBoards) {
        Object.entries(stateBoards).forEach(([, board]) => {
          searchUrls.push({ ...board, state: st });
        });
        sources.push(`${st} Licensing Boards`);
      }
    });
  }

  return { licenses: [], searchUrls, sources };
}

// Search for contractor license
export async function searchContractorLicense(
  name: string,
  licenseNumber?: string,
  state?: string
): Promise<LicenseSearchResult> {
  const searchUrls: { name: string; url: string; state: string }[] = [];

  const contractorBoards: Record<string, { name: string; url: string }> = {
    FL: { name: 'FL Construction Industry Licensing', url: 'https://www.myfloridalicense.com/wl11.asp' },
    CA: { name: 'CA CSLB License Check', url: 'https://www.cslb.ca.gov/onlineservices/checklicenseII/checklicense.aspx' },
    TX: { name: 'TX TDLR License Search', url: 'https://www.tdlr.texas.gov/LicenseSearch/' },
    AZ: { name: 'AZ ROC License Search', url: 'https://roc.az.gov/find-contractor' },
    NV: { name: 'NV Contractor License Search', url: 'https://app.nvcontractorsboard.com/Clients/NVSCB/Public/ContractorSearch.aspx' },
  };

  if (state && contractorBoards[state.toUpperCase()]) {
    searchUrls.push({ ...contractorBoards[state.toUpperCase()], state });
  } else {
    Object.entries(contractorBoards).forEach(([st, board]) => {
      searchUrls.push({ ...board, state: st });
    });
  }

  return { licenses: [], searchUrls, sources: ['State Contractor Licensing Boards'] };
}

// Search for real estate license
export async function searchRealEstateLicense(
  name: string,
  licenseNumber?: string,
  state?: string
): Promise<LicenseSearchResult> {
  const searchUrls: { name: string; url: string; state: string }[] = [];

  const realEstateBoards: Record<string, { name: string; url: string }> = {
    FL: { name: 'FL Real Estate Commission', url: 'https://www.myfloridalicense.com/wl11.asp?mode=2' },
    CA: { name: 'CA DRE License Lookup', url: 'https://www.dre.ca.gov/consumers/verify_license.html' },
    TX: { name: 'TX Real Estate Commission', url: 'https://www.trec.texas.gov/license-holder-search' },
    NY: { name: 'NY DOS License Search', url: 'https://appext20.dos.ny.gov/lcns_public/chk_caseno' },
    GA: { name: 'GA Real Estate Commission', url: 'https://grec.state.ga.us/licensee-search/' },
  };

  if (state && realEstateBoards[state.toUpperCase()]) {
    searchUrls.push({ ...realEstateBoards[state.toUpperCase()], state });
  } else {
    Object.entries(realEstateBoards).forEach(([st, board]) => {
      searchUrls.push({ ...board, state: st });
    });
  }

  return { licenses: [], searchUrls, sources: ['State Real Estate Commissions'] };
}

// Search for medical license
export async function searchMedicalLicense(
  name: string,
  licenseNumber?: string,
  state?: string
): Promise<LicenseSearchResult> {
  const searchUrls: { name: string; url: string; state: string }[] = [];

  // State medical boards
  const medicalBoards: Record<string, { name: string; url: string }> = {
    FL: { name: 'FL Board of Medicine', url: 'https://appsmqa.doh.state.fl.us/MQASearchServices/Home' },
    CA: { name: 'CA Medical Board', url: 'https://mbc.ca.gov/breeze/' },
    TX: { name: 'TX Medical Board', url: 'https://profile.tmb.state.tx.us/SearchVerify.aspx' },
    NY: { name: 'NY Office of Professions', url: 'http://www.op.nysed.gov/opsearches.htm' },
  };

  // National verification
  searchUrls.push({
    name: 'DocInfo (AMA Verification)',
    url: 'https://doctorfinder.ama-assn.org/',
    state: 'National',
  });

  searchUrls.push({
    name: 'NPPES NPI Registry',
    url: 'https://npiregistry.cms.hhs.gov/',
    state: 'National',
  });

  if (state && medicalBoards[state.toUpperCase()]) {
    searchUrls.push({ ...medicalBoards[state.toUpperCase()], state });
  } else {
    Object.entries(medicalBoards).forEach(([st, board]) => {
      searchUrls.push({ ...board, state: st });
    });
  }

  return { licenses: [], searchUrls, sources: ['State Medical Boards', 'National Registries'] };
}

// Search for attorney bar status
export async function searchAttorneyLicense(
  name: string,
  barNumber?: string,
  state?: string
): Promise<LicenseSearchResult> {
  const searchUrls: { name: string; url: string; state: string }[] = [];

  const barAssociations: Record<string, { name: string; url: string }> = {
    FL: { name: 'Florida Bar', url: 'https://www.floridabar.org/directories/find-mbr/' },
    CA: { name: 'State Bar of California', url: 'https://apps.calbar.ca.gov/attorney/LicenseeSearch/QuickSearch' },
    TX: { name: 'State Bar of Texas', url: 'https://www.texasbar.com/AM/Template.cfm?Section=Find_A_Lawyer' },
    NY: { name: 'NY Attorney Search', url: 'https://iapps.courts.state.ny.us/attorneyservices/search' },
    NJ: { name: 'NJ Lawyer Search', url: 'https://www.njcourts.gov/attorneys' },
    IL: { name: 'ARDC Attorney Search', url: 'https://www.iardc.org/lawyersearch.asp' },
  };

  if (state && barAssociations[state.toUpperCase()]) {
    searchUrls.push({ ...barAssociations[state.toUpperCase()], state });
  } else {
    Object.entries(barAssociations).forEach(([st, board]) => {
      searchUrls.push({ ...board, state: st });
    });
  }

  return { licenses: [], searchUrls, sources: ['State Bar Associations'] };
}

// National license verification sources
export async function getNationalLicenseVerification(licenseType: string): Promise<{
  sources: { name: string; url: string; description: string }[];
}> {
  const nationalSources: Record<string, { name: string; url: string; description: string }[]> = {
    medical: [
      { name: 'NPPES NPI Registry', url: 'https://npiregistry.cms.hhs.gov/', description: 'National Provider Identifier lookup for healthcare providers' },
      { name: 'Federation Credentials Verification', url: 'https://www.fsmb.org/', description: 'FSMB DocInfo for physician verification' },
      { name: 'ABMS Board Certification', url: 'https://www.certificationmatters.org/', description: 'Verify board certification status' },
    ],
    nursing: [
      { name: 'Nursys License Verification', url: 'https://www.nursys.com/', description: 'National nursing license verification' },
    ],
    insurance: [
      { name: 'NIPR License Lookup', url: 'https://nipr.com/', description: 'National Insurance Producer Registry' },
    ],
    mortgage: [
      { name: 'NMLS Consumer Access', url: 'https://www.nmlsconsumeraccess.org/', description: 'Mortgage loan originator license verification' },
    ],
    securities: [
      { name: 'FINRA BrokerCheck', url: 'https://brokercheck.finra.org/', description: 'Verify securities broker/advisor registration' },
      { name: 'SEC Investment Adviser Search', url: 'https://www.adviserinfo.sec.gov/', description: 'Verify investment adviser registration' },
    ],
    aviation: [
      { name: 'FAA Airmen Certification', url: 'https://amsrvs.registry.faa.gov/airmeninquiry/', description: 'Verify pilot licenses and ratings' },
    ],
  };

  return { sources: nationalSources[licenseType] || [] };
}

// Export all functions
export const ProfessionalLicenses = {
  searchByName: searchLicensesByName,
  searchContractor: searchContractorLicense,
  searchRealEstate: searchRealEstateLicense,
  searchMedical: searchMedicalLicense,
  searchAttorney: searchAttorneyLicense,
  getNationalVerification: getNationalLicenseVerification,
  licenseBoards: LICENSE_BOARDS,
  licenseTypes: LICENSE_TYPES,
};
