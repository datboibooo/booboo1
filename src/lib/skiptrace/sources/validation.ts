// Data Validation Utilities
// Email and phone validation with format checking

// Email validation result
interface EmailValidationResult {
  email: string;
  isValid: boolean;
  isDisposable: boolean;
  isFreeEmail: boolean;
  domain: string;
  suggestedCorrection?: string;
  mxRecordExists: boolean;
  formatValid: boolean;
  searchUrls: { name: string; url: string }[];
}

// Phone validation result
interface PhoneValidationResult {
  phone: string;
  isValid: boolean;
  formatted: string;
  e164: string;
  countryCode: string;
  areaCode: string;
  lineType: 'landline' | 'mobile' | 'voip' | 'unknown';
  carrier?: string;
  location?: { city: string; state: string };
  searchUrls: { name: string; url: string }[];
}

// Common disposable email domains
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'guerrillamail.com', 'mailinator.com', '10minutemail.com',
  'throwaway.email', 'temp-mail.org', 'fakeinbox.com', 'trashmail.com',
  'yopmail.com', 'maildrop.cc', 'dispostable.com', 'sharklasers.com',
  'spam4.me', 'spamgourmet.com', 'tempr.email', 'discard.email',
  'mailnesia.com', 'tmpmail.org', 'tmpmail.net', 'getnada.com',
]);

// Common free email providers
const FREE_EMAIL_PROVIDERS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
  'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com', 'yandex.com',
  'live.com', 'msn.com', 'comcast.net', 'att.net', 'verizon.net',
  'cox.net', 'sbcglobal.net', 'bellsouth.net', 'earthlink.net',
]);

// Common typos for email domains
const DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
};

// US area codes by state
const AREA_CODE_MAP: Record<string, { state: string; cities: string[] }> = {
  '201': { state: 'NJ', cities: ['Jersey City', 'Hackensack'] },
  '202': { state: 'DC', cities: ['Washington'] },
  '203': { state: 'CT', cities: ['Bridgeport', 'New Haven'] },
  '205': { state: 'AL', cities: ['Birmingham'] },
  '206': { state: 'WA', cities: ['Seattle'] },
  '207': { state: 'ME', cities: ['Portland'] },
  '208': { state: 'ID', cities: ['Boise'] },
  '209': { state: 'CA', cities: ['Stockton', 'Modesto'] },
  '210': { state: 'TX', cities: ['San Antonio'] },
  '212': { state: 'NY', cities: ['New York City'] },
  '213': { state: 'CA', cities: ['Los Angeles'] },
  '214': { state: 'TX', cities: ['Dallas'] },
  '215': { state: 'PA', cities: ['Philadelphia'] },
  '216': { state: 'OH', cities: ['Cleveland'] },
  '217': { state: 'IL', cities: ['Springfield'] },
  '218': { state: 'MN', cities: ['Duluth'] },
  '219': { state: 'IN', cities: ['Gary'] },
  '224': { state: 'IL', cities: ['Chicago suburbs'] },
  '225': { state: 'LA', cities: ['Baton Rouge'] },
  '228': { state: 'MS', cities: ['Gulfport', 'Biloxi'] },
  '229': { state: 'GA', cities: ['Albany'] },
  '231': { state: 'MI', cities: ['Muskegon'] },
  '234': { state: 'OH', cities: ['Akron', 'Youngstown'] },
  '239': { state: 'FL', cities: ['Fort Myers', 'Naples'] },
  '240': { state: 'MD', cities: ['Silver Spring'] },
  '248': { state: 'MI', cities: ['Pontiac', 'Troy'] },
  '251': { state: 'AL', cities: ['Mobile'] },
  '252': { state: 'NC', cities: ['Greenville'] },
  '253': { state: 'WA', cities: ['Tacoma'] },
  '254': { state: 'TX', cities: ['Waco', 'Killeen'] },
  '256': { state: 'AL', cities: ['Huntsville'] },
  '260': { state: 'IN', cities: ['Fort Wayne'] },
  '262': { state: 'WI', cities: ['Kenosha', 'Racine'] },
  '267': { state: 'PA', cities: ['Philadelphia'] },
  '269': { state: 'MI', cities: ['Kalamazoo'] },
  '270': { state: 'KY', cities: ['Bowling Green'] },
  '272': { state: 'PA', cities: ['Scranton'] },
  '276': { state: 'VA', cities: ['Bristol'] },
  '281': { state: 'TX', cities: ['Houston suburbs'] },
  '301': { state: 'MD', cities: ['Bethesda', 'Silver Spring'] },
  '302': { state: 'DE', cities: ['Wilmington', 'Dover'] },
  '303': { state: 'CO', cities: ['Denver'] },
  '304': { state: 'WV', cities: ['Charleston'] },
  '305': { state: 'FL', cities: ['Miami'] },
  '307': { state: 'WY', cities: ['Cheyenne', 'Casper'] },
  '308': { state: 'NE', cities: ['Grand Island'] },
  '309': { state: 'IL', cities: ['Peoria'] },
  '310': { state: 'CA', cities: ['Los Angeles', 'Santa Monica'] },
  '312': { state: 'IL', cities: ['Chicago'] },
  '313': { state: 'MI', cities: ['Detroit'] },
  '314': { state: 'MO', cities: ['St. Louis'] },
  '315': { state: 'NY', cities: ['Syracuse'] },
  '316': { state: 'KS', cities: ['Wichita'] },
  '317': { state: 'IN', cities: ['Indianapolis'] },
  '318': { state: 'LA', cities: ['Shreveport'] },
  '319': { state: 'IA', cities: ['Cedar Rapids'] },
  '320': { state: 'MN', cities: ['St. Cloud'] },
  '321': { state: 'FL', cities: ['Orlando', 'Cape Canaveral'] },
  '323': { state: 'CA', cities: ['Los Angeles'] },
  '325': { state: 'TX', cities: ['Abilene'] },
  '330': { state: 'OH', cities: ['Akron', 'Youngstown'] },
  '331': { state: 'IL', cities: ['Aurora', 'Naperville'] },
  '334': { state: 'AL', cities: ['Montgomery'] },
  '336': { state: 'NC', cities: ['Greensboro', 'Winston-Salem'] },
  '337': { state: 'LA', cities: ['Lafayette'] },
  '339': { state: 'MA', cities: ['Boston suburbs'] },
  '340': { state: 'VI', cities: ['US Virgin Islands'] },
  '346': { state: 'TX', cities: ['Houston'] },
  '347': { state: 'NY', cities: ['New York City'] },
  '351': { state: 'MA', cities: ['Lowell'] },
  '352': { state: 'FL', cities: ['Gainesville', 'Ocala'] },
  '360': { state: 'WA', cities: ['Vancouver', 'Olympia'] },
  '361': { state: 'TX', cities: ['Corpus Christi'] },
  '386': { state: 'FL', cities: ['Daytona Beach'] },
  '401': { state: 'RI', cities: ['Providence'] },
  '402': { state: 'NE', cities: ['Omaha', 'Lincoln'] },
  '404': { state: 'GA', cities: ['Atlanta'] },
  '405': { state: 'OK', cities: ['Oklahoma City'] },
  '406': { state: 'MT', cities: ['Billings', 'Missoula'] },
  '407': { state: 'FL', cities: ['Orlando'] },
  '408': { state: 'CA', cities: ['San Jose'] },
  '409': { state: 'TX', cities: ['Beaumont', 'Galveston'] },
  '410': { state: 'MD', cities: ['Baltimore'] },
  '412': { state: 'PA', cities: ['Pittsburgh'] },
  '413': { state: 'MA', cities: ['Springfield'] },
  '414': { state: 'WI', cities: ['Milwaukee'] },
  '415': { state: 'CA', cities: ['San Francisco'] },
  '417': { state: 'MO', cities: ['Springfield'] },
  '419': { state: 'OH', cities: ['Toledo'] },
  '423': { state: 'TN', cities: ['Chattanooga'] },
  '424': { state: 'CA', cities: ['Los Angeles'] },
  '425': { state: 'WA', cities: ['Bellevue', 'Everett'] },
  '430': { state: 'TX', cities: ['Tyler'] },
  '432': { state: 'TX', cities: ['Midland', 'Odessa'] },
  '434': { state: 'VA', cities: ['Lynchburg', 'Charlottesville'] },
  '435': { state: 'UT', cities: ['St. George'] },
  '440': { state: 'OH', cities: ['Cleveland suburbs'] },
  '442': { state: 'CA', cities: ['Oceanside'] },
  '443': { state: 'MD', cities: ['Baltimore'] },
  '469': { state: 'TX', cities: ['Dallas'] },
  '470': { state: 'GA', cities: ['Atlanta'] },
  '475': { state: 'CT', cities: ['Bridgeport', 'New Haven'] },
  '478': { state: 'GA', cities: ['Macon'] },
  '479': { state: 'AR', cities: ['Fort Smith', 'Fayetteville'] },
  '480': { state: 'AZ', cities: ['Mesa', 'Tempe'] },
  '484': { state: 'PA', cities: ['Allentown'] },
  '501': { state: 'AR', cities: ['Little Rock'] },
  '502': { state: 'KY', cities: ['Louisville'] },
  '503': { state: 'OR', cities: ['Portland'] },
  '504': { state: 'LA', cities: ['New Orleans'] },
  '505': { state: 'NM', cities: ['Albuquerque'] },
  '507': { state: 'MN', cities: ['Rochester'] },
  '508': { state: 'MA', cities: ['Worcester'] },
  '509': { state: 'WA', cities: ['Spokane'] },
  '510': { state: 'CA', cities: ['Oakland'] },
  '512': { state: 'TX', cities: ['Austin'] },
  '513': { state: 'OH', cities: ['Cincinnati'] },
  '515': { state: 'IA', cities: ['Des Moines'] },
  '516': { state: 'NY', cities: ['Long Island'] },
  '517': { state: 'MI', cities: ['Lansing'] },
  '518': { state: 'NY', cities: ['Albany'] },
  '520': { state: 'AZ', cities: ['Tucson'] },
  '530': { state: 'CA', cities: ['Redding', 'Chico'] },
  '531': { state: 'NE', cities: ['Omaha'] },
  '534': { state: 'WI', cities: ['Eau Claire'] },
  '539': { state: 'OK', cities: ['Tulsa'] },
  '540': { state: 'VA', cities: ['Roanoke'] },
  '541': { state: 'OR', cities: ['Eugene'] },
  '551': { state: 'NJ', cities: ['Jersey City'] },
  '559': { state: 'CA', cities: ['Fresno'] },
  '561': { state: 'FL', cities: ['West Palm Beach'] },
  '562': { state: 'CA', cities: ['Long Beach'] },
  '563': { state: 'IA', cities: ['Davenport'] },
  '567': { state: 'OH', cities: ['Toledo'] },
  '570': { state: 'PA', cities: ['Scranton'] },
  '571': { state: 'VA', cities: ['Arlington'] },
  '573': { state: 'MO', cities: ['Columbia', 'Jefferson City'] },
  '574': { state: 'IN', cities: ['South Bend'] },
  '575': { state: 'NM', cities: ['Las Cruces'] },
  '580': { state: 'OK', cities: ['Lawton'] },
  '585': { state: 'NY', cities: ['Rochester'] },
  '586': { state: 'MI', cities: ['Warren'] },
  '601': { state: 'MS', cities: ['Jackson'] },
  '602': { state: 'AZ', cities: ['Phoenix'] },
  '603': { state: 'NH', cities: ['Manchester'] },
  '605': { state: 'SD', cities: ['Sioux Falls'] },
  '606': { state: 'KY', cities: ['Ashland'] },
  '607': { state: 'NY', cities: ['Binghamton'] },
  '608': { state: 'WI', cities: ['Madison'] },
  '609': { state: 'NJ', cities: ['Trenton'] },
  '610': { state: 'PA', cities: ['Allentown'] },
  '612': { state: 'MN', cities: ['Minneapolis'] },
  '614': { state: 'OH', cities: ['Columbus'] },
  '615': { state: 'TN', cities: ['Nashville'] },
  '616': { state: 'MI', cities: ['Grand Rapids'] },
  '617': { state: 'MA', cities: ['Boston'] },
  '618': { state: 'IL', cities: ['East St. Louis'] },
  '619': { state: 'CA', cities: ['San Diego'] },
  '620': { state: 'KS', cities: ['Dodge City'] },
  '623': { state: 'AZ', cities: ['Glendale', 'Peoria'] },
  '626': { state: 'CA', cities: ['Pasadena'] },
  '628': { state: 'CA', cities: ['San Francisco'] },
  '629': { state: 'TN', cities: ['Nashville'] },
  '630': { state: 'IL', cities: ['Aurora', 'Naperville'] },
  '631': { state: 'NY', cities: ['Long Island'] },
  '636': { state: 'MO', cities: ['St. Louis suburbs'] },
  '641': { state: 'IA', cities: ['Mason City'] },
  '646': { state: 'NY', cities: ['New York City'] },
  '650': { state: 'CA', cities: ['Palo Alto', 'San Mateo'] },
  '651': { state: 'MN', cities: ['St. Paul'] },
  '657': { state: 'CA', cities: ['Anaheim'] },
  '660': { state: 'MO', cities: ['Sedalia'] },
  '661': { state: 'CA', cities: ['Bakersfield'] },
  '662': { state: 'MS', cities: ['Tupelo'] },
  '667': { state: 'MD', cities: ['Baltimore'] },
  '669': { state: 'CA', cities: ['San Jose'] },
  '678': { state: 'GA', cities: ['Atlanta'] },
  '681': { state: 'WV', cities: ['Charleston'] },
  '682': { state: 'TX', cities: ['Fort Worth'] },
  '701': { state: 'ND', cities: ['Fargo'] },
  '702': { state: 'NV', cities: ['Las Vegas'] },
  '703': { state: 'VA', cities: ['Arlington', 'Alexandria'] },
  '704': { state: 'NC', cities: ['Charlotte'] },
  '706': { state: 'GA', cities: ['Augusta'] },
  '707': { state: 'CA', cities: ['Santa Rosa'] },
  '708': { state: 'IL', cities: ['Chicago suburbs'] },
  '712': { state: 'IA', cities: ['Sioux City'] },
  '713': { state: 'TX', cities: ['Houston'] },
  '714': { state: 'CA', cities: ['Anaheim'] },
  '715': { state: 'WI', cities: ['Eau Claire'] },
  '716': { state: 'NY', cities: ['Buffalo'] },
  '717': { state: 'PA', cities: ['Harrisburg', 'Lancaster'] },
  '718': { state: 'NY', cities: ['New York City'] },
  '719': { state: 'CO', cities: ['Colorado Springs'] },
  '720': { state: 'CO', cities: ['Denver'] },
  '724': { state: 'PA', cities: ['Pittsburgh suburbs'] },
  '725': { state: 'NV', cities: ['Las Vegas'] },
  '727': { state: 'FL', cities: ['St. Petersburg', 'Clearwater'] },
  '731': { state: 'TN', cities: ['Jackson'] },
  '732': { state: 'NJ', cities: ['New Brunswick'] },
  '734': { state: 'MI', cities: ['Ann Arbor'] },
  '737': { state: 'TX', cities: ['Austin'] },
  '740': { state: 'OH', cities: ['Lancaster'] },
  '747': { state: 'CA', cities: ['Los Angeles'] },
  '754': { state: 'FL', cities: ['Fort Lauderdale'] },
  '757': { state: 'VA', cities: ['Norfolk', 'Virginia Beach'] },
  '760': { state: 'CA', cities: ['Palm Springs'] },
  '762': { state: 'GA', cities: ['Augusta'] },
  '763': { state: 'MN', cities: ['Minneapolis suburbs'] },
  '765': { state: 'IN', cities: ['Lafayette'] },
  '769': { state: 'MS', cities: ['Jackson'] },
  '770': { state: 'GA', cities: ['Atlanta suburbs'] },
  '772': { state: 'FL', cities: ['Port St. Lucie'] },
  '773': { state: 'IL', cities: ['Chicago'] },
  '774': { state: 'MA', cities: ['Worcester'] },
  '775': { state: 'NV', cities: ['Reno'] },
  '779': { state: 'IL', cities: ['Rockford'] },
  '781': { state: 'MA', cities: ['Boston suburbs'] },
  '785': { state: 'KS', cities: ['Topeka'] },
  '786': { state: 'FL', cities: ['Miami'] },
  '801': { state: 'UT', cities: ['Salt Lake City'] },
  '802': { state: 'VT', cities: ['Burlington'] },
  '803': { state: 'SC', cities: ['Columbia'] },
  '804': { state: 'VA', cities: ['Richmond'] },
  '805': { state: 'CA', cities: ['Santa Barbara', 'Ventura'] },
  '806': { state: 'TX', cities: ['Lubbock', 'Amarillo'] },
  '808': { state: 'HI', cities: ['Honolulu'] },
  '810': { state: 'MI', cities: ['Flint'] },
  '812': { state: 'IN', cities: ['Evansville'] },
  '813': { state: 'FL', cities: ['Tampa'] },
  '814': { state: 'PA', cities: ['Erie'] },
  '815': { state: 'IL', cities: ['Rockford'] },
  '816': { state: 'MO', cities: ['Kansas City'] },
  '817': { state: 'TX', cities: ['Fort Worth'] },
  '818': { state: 'CA', cities: ['Los Angeles', 'Burbank'] },
  '828': { state: 'NC', cities: ['Asheville'] },
  '830': { state: 'TX', cities: ['New Braunfels'] },
  '831': { state: 'CA', cities: ['Salinas', 'Monterey'] },
  '832': { state: 'TX', cities: ['Houston'] },
  '843': { state: 'SC', cities: ['Charleston'] },
  '845': { state: 'NY', cities: ['Poughkeepsie'] },
  '847': { state: 'IL', cities: ['Chicago suburbs'] },
  '848': { state: 'NJ', cities: ['New Brunswick'] },
  '850': { state: 'FL', cities: ['Tallahassee', 'Pensacola'] },
  '856': { state: 'NJ', cities: ['Camden'] },
  '857': { state: 'MA', cities: ['Boston'] },
  '858': { state: 'CA', cities: ['San Diego'] },
  '859': { state: 'KY', cities: ['Lexington'] },
  '860': { state: 'CT', cities: ['Hartford'] },
  '862': { state: 'NJ', cities: ['Newark'] },
  '863': { state: 'FL', cities: ['Lakeland'] },
  '864': { state: 'SC', cities: ['Greenville'] },
  '865': { state: 'TN', cities: ['Knoxville'] },
  '870': { state: 'AR', cities: ['Jonesboro'] },
  '872': { state: 'IL', cities: ['Chicago'] },
  '878': { state: 'PA', cities: ['Pittsburgh'] },
  '901': { state: 'TN', cities: ['Memphis'] },
  '903': { state: 'TX', cities: ['Tyler'] },
  '904': { state: 'FL', cities: ['Jacksonville'] },
  '906': { state: 'MI', cities: ['Upper Peninsula'] },
  '907': { state: 'AK', cities: ['Anchorage', 'Fairbanks'] },
  '908': { state: 'NJ', cities: ['Elizabeth'] },
  '909': { state: 'CA', cities: ['San Bernardino'] },
  '910': { state: 'NC', cities: ['Fayetteville', 'Wilmington'] },
  '912': { state: 'GA', cities: ['Savannah'] },
  '913': { state: 'KS', cities: ['Kansas City', 'Overland Park'] },
  '914': { state: 'NY', cities: ['White Plains', 'Yonkers'] },
  '915': { state: 'TX', cities: ['El Paso'] },
  '916': { state: 'CA', cities: ['Sacramento'] },
  '917': { state: 'NY', cities: ['New York City'] },
  '918': { state: 'OK', cities: ['Tulsa'] },
  '919': { state: 'NC', cities: ['Raleigh'] },
  '920': { state: 'WI', cities: ['Green Bay', 'Appleton'] },
  '925': { state: 'CA', cities: ['Concord', 'Walnut Creek'] },
  '928': { state: 'AZ', cities: ['Flagstaff', 'Yuma'] },
  '929': { state: 'NY', cities: ['New York City'] },
  '931': { state: 'TN', cities: ['Clarksville'] },
  '936': { state: 'TX', cities: ['Conroe'] },
  '937': { state: 'OH', cities: ['Dayton'] },
  '938': { state: 'AL', cities: ['Huntsville'] },
  '940': { state: 'TX', cities: ['Wichita Falls', 'Denton'] },
  '941': { state: 'FL', cities: ['Sarasota', 'Bradenton'] },
  '947': { state: 'MI', cities: ['Troy', 'Pontiac'] },
  '949': { state: 'CA', cities: ['Irvine'] },
  '951': { state: 'CA', cities: ['Riverside'] },
  '952': { state: 'MN', cities: ['Minneapolis suburbs'] },
  '954': { state: 'FL', cities: ['Fort Lauderdale'] },
  '956': { state: 'TX', cities: ['Laredo'] },
  '959': { state: 'CT', cities: ['Hartford'] },
  '970': { state: 'CO', cities: ['Fort Collins'] },
  '971': { state: 'OR', cities: ['Portland'] },
  '972': { state: 'TX', cities: ['Dallas'] },
  '973': { state: 'NJ', cities: ['Newark'] },
  '978': { state: 'MA', cities: ['Lowell'] },
  '979': { state: 'TX', cities: ['College Station'] },
  '980': { state: 'NC', cities: ['Charlotte'] },
  '984': { state: 'NC', cities: ['Raleigh'] },
  '985': { state: 'LA', cities: ['Houma'] },
};

// Validate email address
export function validateEmail(email: string): EmailValidationResult {
  const trimmedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const formatValid = emailRegex.test(trimmedEmail);

  // Extract domain
  const parts = trimmedEmail.split('@');
  const domain = parts.length === 2 ? parts[1] : '';

  // Check for typos
  let suggestedCorrection: string | undefined;
  if (domain && DOMAIN_TYPOS[domain]) {
    suggestedCorrection = `${parts[0]}@${DOMAIN_TYPOS[domain]}`;
  }

  // Build search URLs
  const searchUrls: { name: string; url: string }[] = [
    {
      name: 'Google Search',
      url: `https://www.google.com/search?q="${encodeURIComponent(trimmedEmail)}"`,
    },
    {
      name: 'Hunter.io (Email Finder)',
      url: `https://hunter.io/email-finder/${domain}`,
    },
    {
      name: 'Email Checker',
      url: `https://email-checker.net/validate?email=${encodeURIComponent(trimmedEmail)}`,
    },
    {
      name: 'Have I Been Pwned',
      url: `https://haveibeenpwned.com/account/${encodeURIComponent(trimmedEmail)}`,
    },
  ];

  return {
    email: trimmedEmail,
    isValid: formatValid && domain.length > 0,
    isDisposable: DISPOSABLE_DOMAINS.has(domain),
    isFreeEmail: FREE_EMAIL_PROVIDERS.has(domain),
    domain,
    suggestedCorrection,
    mxRecordExists: true, // Would need DNS lookup to verify
    formatValid,
    searchUrls,
  };
}

// Validate phone number
export function validatePhone(phone: string): PhoneValidationResult {
  // Clean the phone number
  const digits = phone.replace(/\D/g, '');

  // Handle different formats
  let cleanDigits = digits;
  if (digits.length === 11 && digits.startsWith('1')) {
    cleanDigits = digits.substring(1);
  }

  const isValid = cleanDigits.length === 10;
  const areaCode = cleanDigits.substring(0, 3);
  const exchange = cleanDigits.substring(3, 6);
  const subscriber = cleanDigits.substring(6, 10);

  // Format phone number
  const formatted = isValid ? `(${areaCode}) ${exchange}-${subscriber}` : phone;
  const e164 = isValid ? `+1${cleanDigits}` : phone;

  // Get location from area code
  const areaInfo = AREA_CODE_MAP[areaCode];

  // Determine line type (simplified - would need carrier lookup for accuracy)
  let lineType: PhoneValidationResult['lineType'] = 'unknown';
  if (isValid) {
    // VoIP ranges typically start with certain exchanges
    const voipExchanges = ['200', '201', '202'];
    if (voipExchanges.includes(exchange)) {
      lineType = 'voip';
    } else {
      lineType = 'unknown'; // Would need carrier lookup
    }
  }

  // Build search URLs
  const searchUrls: { name: string; url: string }[] = [
    {
      name: 'Google Search',
      url: `https://www.google.com/search?q="${formatted}"`,
    },
    {
      name: 'WhitePages',
      url: `https://www.whitepages.com/phone/1-${areaCode}-${exchange}-${subscriber}`,
    },
    {
      name: 'TruePeopleSearch',
      url: `https://www.truepeoplesearch.com/resultphone?phoneno=${cleanDigits}`,
    },
    {
      name: 'That\'s Them',
      url: `https://thatsthem.com/phone/${cleanDigits}`,
    },
    {
      name: 'Spy Dialer',
      url: `https://spydialer.com/results?phone=${cleanDigits}`,
    },
    {
      name: 'NumLookup',
      url: `https://www.numlookup.com/phone/${cleanDigits}`,
    },
  ];

  return {
    phone: cleanDigits,
    isValid,
    formatted,
    e164,
    countryCode: '1',
    areaCode,
    lineType,
    location: areaInfo ? { city: areaInfo.cities[0], state: areaInfo.state } : undefined,
    searchUrls,
  };
}

// Validate address format
export function validateAddress(
  street: string,
  city: string,
  state: string,
  zip: string
): {
  isValid: boolean;
  formatted: string;
  issues: string[];
  searchUrls: { name: string; url: string }[];
} {
  const issues: string[] = [];

  // Basic validation
  if (!street.trim()) issues.push('Street address is required');
  if (!city.trim()) issues.push('City is required');
  if (!state.trim()) issues.push('State is required');

  // Validate ZIP code
  const zipRegex = /^\d{5}(-\d{4})?$/;
  if (!zipRegex.test(zip)) {
    issues.push('Invalid ZIP code format');
  }

  // Validate state abbreviation
  const validStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
  ];
  if (!validStates.includes(state.toUpperCase())) {
    issues.push('Invalid state abbreviation');
  }

  const formatted = `${street.trim()}, ${city.trim()}, ${state.toUpperCase()} ${zip}`;
  const encodedAddress = encodeURIComponent(formatted);

  const searchUrls: { name: string; url: string }[] = [
    {
      name: 'Google Maps',
      url: `https://www.google.com/maps/search/${encodedAddress}`,
    },
    {
      name: 'Zillow',
      url: `https://www.zillow.com/homes/${encodedAddress.replace(/%20/g, '-').replace(/,/g, '')}`,
    },
    {
      name: 'County Assessor',
      url: `https://www.google.com/search?q=${state.toLowerCase()}+county+property+assessor+${encodedAddress}`,
    },
  ];

  return {
    isValid: issues.length === 0,
    formatted,
    issues,
    searchUrls,
  };
}

// Export all validators
export const DataValidation = {
  validateEmail,
  validatePhone,
  validateAddress,
  DISPOSABLE_DOMAINS,
  FREE_EMAIL_PROVIDERS,
  AREA_CODE_MAP,
};
