// Vehicle Records Search
// Sources: NHTSA API (free), state DMV websites

import { VehicleRecord } from '../types';

// NHTSA API - 100% Free, No API Key Required
const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api';

// Decode VIN using NHTSA API
export async function decodeVIN(vin: string): Promise<{
  valid: boolean;
  data?: {
    vin: string;
    year: number;
    make: string;
    model: string;
    trim?: string;
    bodyClass?: string;
    driveType?: string;
    fuelType?: string;
    engineCylinders?: number;
    engineDisplacement?: string;
    manufacturer?: string;
    plantCity?: string;
    plantCountry?: string;
    vehicleType?: string;
    errorCodes?: string[];
  };
  error?: string;
}> {
  try {
    const response = await fetch(
      `${NHTSA_BASE}/vehicles/DecodeVin/${vin}?format=json`
    );

    if (!response.ok) {
      return { valid: false, error: 'Failed to decode VIN' };
    }

    const data = await response.json();
    const results = data.Results || [];

    // Parse results into usable format
    const getValue = (variableId: number): string | undefined => {
      const item = results.find((r: { VariableId: number }) => r.VariableId === variableId);
      return item?.Value || undefined;
    };

    const year = parseInt(getValue(29) || '0');
    const make = getValue(26);
    const model = getValue(28);

    if (!year || !make || !model) {
      return { valid: false, error: 'Invalid VIN or data not found' };
    }

    return {
      valid: true,
      data: {
        vin,
        year,
        make,
        model,
        trim: getValue(38),
        bodyClass: getValue(5),
        driveType: getValue(15),
        fuelType: getValue(24),
        engineCylinders: parseInt(getValue(9) || '0') || undefined,
        engineDisplacement: getValue(11),
        manufacturer: getValue(27),
        plantCity: getValue(31),
        plantCountry: getValue(32),
        vehicleType: getValue(39),
        errorCodes: results
          .filter((r: { VariableId: number; Value: string }) => r.VariableId === 143 && r.Value)
          .map((r: { Value: string }) => r.Value),
      },
    };
  } catch (error) {
    console.error('VIN decode error:', error);
    return { valid: false, error: 'Failed to decode VIN' };
  }
}

// Get all makes for a year
export async function getMakesByYear(year: number): Promise<string[]> {
  try {
    const response = await fetch(
      `${NHTSA_BASE}/vehicles/GetMakesForVehicleType/car?format=json`
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.Results || [])
      .map((r: { MakeName: string }) => r.MakeName)
      .filter(Boolean)
      .sort();
  } catch {
    return [];
  }
}

// Get models for a make and year
export async function getModels(make: string, year?: number): Promise<string[]> {
  try {
    const url = year
      ? `${NHTSA_BASE}/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`
      : `${NHTSA_BASE}/vehicles/GetModelsForMake/${encodeURIComponent(make)}?format=json`;

    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    return (data.Results || [])
      .map((r: { Model_Name: string }) => r.Model_Name)
      .filter(Boolean)
      .sort();
  } catch {
    return [];
  }
}

// Check for recalls by VIN
export async function checkRecalls(vin: string): Promise<{
  hasRecalls: boolean;
  recalls: Array<{
    campaign: string;
    component: string;
    summary: string;
    consequence: string;
    remedy: string;
    manufacturer: string;
    reportDate: string;
  }>;
}> {
  try {
    const response = await fetch(
      `${NHTSA_BASE}/vehicles/RecallsByVIN/${vin}?format=json`
    );

    if (!response.ok) {
      return { hasRecalls: false, recalls: [] };
    }

    const data = await response.json();
    const recalls = (data.Results || []).map((r: {
      NHTSACampaignNumber: string;
      Component: string;
      Summary: string;
      Consequence: string;
      Remedy: string;
      Manufacturer: string;
      ReportReceivedDate: string;
    }) => ({
      campaign: r.NHTSACampaignNumber,
      component: r.Component,
      summary: r.Summary,
      consequence: r.Consequence,
      remedy: r.Remedy,
      manufacturer: r.Manufacturer,
      reportDate: r.ReportReceivedDate,
    }));

    return {
      hasRecalls: recalls.length > 0,
      recalls,
    };
  } catch {
    return { hasRecalls: false, recalls: [] };
  }
}

// Check for safety complaints by VIN
export async function checkComplaints(vin: string): Promise<{
  hasComplaints: boolean;
  complaints: Array<{
    odiNumber: string;
    manufacturer: string;
    crash: boolean;
    fire: boolean;
    injuries: number;
    deaths: number;
    summary: string;
    dateComplaint: string;
  }>;
}> {
  try {
    // Note: NHTSA complaints API requires make/model/year, not VIN directly
    // First decode VIN to get vehicle info
    const decoded = await decodeVIN(vin);
    if (!decoded.valid || !decoded.data) {
      return { hasComplaints: false, complaints: [] };
    }

    const { make, model, year } = decoded.data;
    const response = await fetch(
      `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`
    );

    if (!response.ok) {
      return { hasComplaints: false, complaints: [] };
    }

    const data = await response.json();
    const complaints = (data.results || []).slice(0, 10).map((c: {
      odiNumber: string;
      manufacturer: string;
      crash: string;
      fire: string;
      numberOfInjuries: string;
      numberOfDeaths: string;
      summary: string;
      dateComplaintFiled: string;
    }) => ({
      odiNumber: c.odiNumber,
      manufacturer: c.manufacturer,
      crash: c.crash === 'Yes',
      fire: c.fire === 'Yes',
      injuries: parseInt(c.numberOfInjuries) || 0,
      deaths: parseInt(c.numberOfDeaths) || 0,
      summary: c.summary,
      dateComplaint: c.dateComplaintFiled,
    }));

    return {
      hasComplaints: complaints.length > 0,
      complaints,
    };
  } catch {
    return { hasComplaints: false, complaints: [] };
  }
}

// State DMV lookup URLs
const DMV_WEBSITES: Record<string, { name: string; url: string; services: string[] }> = {
  FL: {
    name: 'Florida DHSMV',
    url: 'https://services.flhsmv.gov/MVCheckPersonalInfo/',
    services: ['Title Search', 'Registration Check', 'Lien Check'],
  },
  CA: {
    name: 'California DMV',
    url: 'https://www.dmv.ca.gov/portal/vehicle-registration/',
    services: ['Registration', 'Title'],
  },
  TX: {
    name: 'Texas DMV',
    url: 'https://www.txdmv.gov/motorists/register-your-vehicle',
    services: ['Registration', 'Title History'],
  },
  NY: {
    name: 'New York DMV',
    url: 'https://dmv.ny.gov/registration/registration-and-title-transactions',
    services: ['Registration', 'Title'],
  },
  GA: {
    name: 'Georgia DOR',
    url: 'https://dor.georgia.gov/motor-vehicles',
    services: ['Title Check', 'Registration'],
  },
};

// Get DMV info for a state
export function getDMVInfo(state: string): {
  website: typeof DMV_WEBSITES[string] | null;
  services: string[];
} {
  const website = DMV_WEBSITES[state.toUpperCase()] || null;
  return {
    website,
    services: website?.services || [],
  };
}

// Search vehicle by owner name
export async function searchVehiclesByOwner(
  ownerName: string,
  state?: string
): Promise<{
  vehicles: VehicleRecord[];
  searchUrls: { name: string; url: string }[];
}> {
  const searchUrls: { name: string; url: string }[] = [];

  // Add DMV websites
  if (state && DMV_WEBSITES[state.toUpperCase()]) {
    const dmv = DMV_WEBSITES[state.toUpperCase()];
    searchUrls.push({ name: dmv.name, url: dmv.url });
  } else {
    Object.entries(DMV_WEBSITES).forEach(([, dmv]) => {
      searchUrls.push({ name: dmv.name, url: dmv.url });
    });
  }

  // General search
  searchUrls.push({
    name: 'Google Search',
    url: `https://www.google.com/search?q="${encodeURIComponent(ownerName)}" vehicle registration`,
  });

  return {
    vehicles: [],
    searchUrls,
  };
}

// License plate lookup URLs
export function getLicensePlateLookupUrls(plate: string, state: string): { name: string; url: string }[] {
  return [
    { name: 'Free License Plate Lookup', url: 'https://www.freevincheck.us/' },
    { name: 'VINCheck Info', url: 'https://www.vincheckinfo.com/free-license-plate-lookup' },
    { name: 'SearchQuarry', url: 'https://www.searchquarry.com/license-plate-search/' },
  ];
}

// Validate VIN format
export function isValidVIN(vin: string): boolean {
  if (!vin || vin.length !== 17) return false;

  // VIN cannot contain I, O, or Q
  if (/[IOQ]/i.test(vin)) return false;

  // Must be alphanumeric
  if (!/^[A-HJ-NPR-Z0-9]+$/i.test(vin)) return false;

  return true;
}

// Parse VIN components
export function parseVIN(vin: string): {
  wmi: string; // World Manufacturer Identifier (1-3)
  vds: string; // Vehicle Descriptor Section (4-9)
  vis: string; // Vehicle Identifier Section (10-17)
  year: string; // Position 10
  plant: string; // Position 11
  serial: string; // Positions 12-17
} {
  const upper = vin.toUpperCase();
  return {
    wmi: upper.slice(0, 3),
    vds: upper.slice(3, 9),
    vis: upper.slice(9, 17),
    year: upper.charAt(9),
    plant: upper.charAt(10),
    serial: upper.slice(11, 17),
  };
}

// Year code lookup (position 10 in VIN)
const YEAR_CODES: Record<string, number> = {
  'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
  'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
  'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
  'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029,
  'Y': 2030, '1': 2031, '2': 2032, '3': 2033, '4': 2034,
  '5': 2035, '6': 2036, '7': 2037, '8': 2038, '9': 2039,
};

export function getYearFromVIN(vin: string): number | null {
  if (!isValidVIN(vin)) return null;
  const yearCode = vin.charAt(9).toUpperCase();
  return YEAR_CODES[yearCode] || null;
}

// Export all functions
export const VehicleRecords = {
  decodeVIN,
  getMakesByYear,
  getModels,
  checkRecalls,
  checkComplaints,
  searchByOwner: searchVehiclesByOwner,
  getDMVInfo,
  getLicensePlateLookup: getLicensePlateLookupUrls,
  isValidVIN,
  parseVIN,
  getYearFromVIN,
  dmvWebsites: DMV_WEBSITES,
};
