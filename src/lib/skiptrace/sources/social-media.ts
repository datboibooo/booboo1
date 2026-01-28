// Social Media Profile Finder
// Uses web search to find social profiles - no API keys needed

import { SocialProfile } from '../types';

// Platform search patterns
const SOCIAL_PLATFORMS = {
  linkedin: {
    name: 'LinkedIn',
    domain: 'linkedin.com',
    profilePattern: 'linkedin.com/in/',
    companyPattern: 'linkedin.com/company/',
    searchUrl: (name: string) => `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(name)}`,
    googleSearch: (name: string) => `site:linkedin.com/in "${name}"`,
  },
  facebook: {
    name: 'Facebook',
    domain: 'facebook.com',
    profilePattern: 'facebook.com/',
    searchUrl: (name: string) => `https://www.facebook.com/search/people/?q=${encodeURIComponent(name)}`,
    googleSearch: (name: string) => `site:facebook.com "${name}"`,
  },
  twitter: {
    name: 'Twitter/X',
    domain: 'twitter.com',
    altDomain: 'x.com',
    profilePattern: 'twitter.com/',
    searchUrl: (name: string) => `https://twitter.com/search?q=${encodeURIComponent(name)}&f=user`,
    googleSearch: (name: string) => `(site:twitter.com OR site:x.com) "${name}"`,
  },
  instagram: {
    name: 'Instagram',
    domain: 'instagram.com',
    profilePattern: 'instagram.com/',
    googleSearch: (name: string) => `site:instagram.com "${name}"`,
  },
  github: {
    name: 'GitHub',
    domain: 'github.com',
    profilePattern: 'github.com/',
    searchUrl: (name: string) => `https://github.com/search?q=${encodeURIComponent(name)}&type=users`,
    googleSearch: (name: string) => `site:github.com "${name}"`,
  },
  tiktok: {
    name: 'TikTok',
    domain: 'tiktok.com',
    profilePattern: 'tiktok.com/@',
    googleSearch: (name: string) => `site:tiktok.com "${name}"`,
  },
  youtube: {
    name: 'YouTube',
    domain: 'youtube.com',
    profilePattern: 'youtube.com/',
    googleSearch: (name: string) => `site:youtube.com/channel OR site:youtube.com/c "${name}"`,
  },
  pinterest: {
    name: 'Pinterest',
    domain: 'pinterest.com',
    profilePattern: 'pinterest.com/',
    googleSearch: (name: string) => `site:pinterest.com "${name}"`,
  },
};

// Professional platforms
const PROFESSIONAL_PLATFORMS = {
  crunchbase: {
    name: 'Crunchbase',
    domain: 'crunchbase.com',
    personPattern: 'crunchbase.com/person/',
    companyPattern: 'crunchbase.com/organization/',
    googleSearch: (name: string) => `site:crunchbase.com/person "${name}"`,
  },
  angellist: {
    name: 'AngelList',
    domain: 'angel.co',
    googleSearch: (name: string) => `site:angel.co "${name}"`,
  },
  bloomberg: {
    name: 'Bloomberg',
    domain: 'bloomberg.com',
    googleSearch: (name: string) => `site:bloomberg.com/profile "${name}"`,
  },
  zoominfo: {
    name: 'ZoomInfo',
    domain: 'zoominfo.com',
    googleSearch: (name: string) => `site:zoominfo.com "${name}"`,
  },
};

interface SocialSearchResult {
  profiles: SocialProfile[];
  searchLinks: { platform: string; url: string }[];
  googleSearchQuery: string;
}

// Build comprehensive Google search query for all social platforms
export function buildSocialSearchQuery(
  firstName: string,
  lastName: string,
  location?: string,
  company?: string
): string {
  const name = `"${firstName} ${lastName}"`;
  const siteClauses = [
    'site:linkedin.com/in',
    'site:facebook.com',
    'site:twitter.com',
    'site:instagram.com',
  ].join(' OR ');

  let query = `(${siteClauses}) ${name}`;

  if (location) {
    query += ` "${location}"`;
  }

  if (company) {
    query += ` "${company}"`;
  }

  return query;
}

// Search for social profiles by name
export async function searchSocialProfiles(
  firstName: string,
  lastName: string,
  options?: {
    location?: string;
    company?: string;
    email?: string;
    platforms?: (keyof typeof SOCIAL_PLATFORMS)[];
  }
): Promise<SocialSearchResult> {
  const searchLinks: { platform: string; url: string }[] = [];
  const fullName = `${firstName} ${lastName}`;

  const platforms = options?.platforms || Object.keys(SOCIAL_PLATFORMS) as (keyof typeof SOCIAL_PLATFORMS)[];

  // Generate search links for each platform
  for (const platformKey of platforms) {
    const platform = SOCIAL_PLATFORMS[platformKey];
    if ('searchUrl' in platform && typeof platform.searchUrl === 'function') {
      searchLinks.push({
        platform: platform.name,
        url: platform.searchUrl(fullName),
      });
    }
  }

  // Add professional platform searches
  Object.values(PROFESSIONAL_PLATFORMS).forEach(platform => {
    searchLinks.push({
      platform: platform.name,
      url: `https://www.google.com/search?q=${encodeURIComponent(platform.googleSearch(fullName))}`,
    });
  });

  // Build Google search query
  const googleSearchQuery = buildSocialSearchQuery(
    firstName,
    lastName,
    options?.location,
    options?.company
  );

  return {
    profiles: [], // Actual profiles would be extracted from search results
    searchLinks,
    googleSearchQuery,
  };
}

// Search for company social profiles
export async function searchCompanySocials(
  companyName: string,
  domain?: string
): Promise<{
  profiles: { platform: string; url: string }[];
  searchLinks: { platform: string; url: string }[];
}> {
  const searchLinks: { platform: string; url: string }[] = [];

  // LinkedIn company search
  searchLinks.push({
    platform: 'LinkedIn',
    url: `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(companyName)}`,
  });

  // Twitter company search
  searchLinks.push({
    platform: 'Twitter/X',
    url: `https://twitter.com/search?q=${encodeURIComponent(companyName)}&f=user`,
  });

  // Facebook page search
  searchLinks.push({
    platform: 'Facebook',
    url: `https://www.facebook.com/search/pages/?q=${encodeURIComponent(companyName)}`,
  });

  // Crunchbase
  searchLinks.push({
    platform: 'Crunchbase',
    url: `https://www.crunchbase.com/discover/organization.companies/${encodeURIComponent(companyName.toLowerCase().replace(/\s+/g, '-'))}`,
  });

  return {
    profiles: [],
    searchLinks,
  };
}

// Extract profile username from URL
export function extractUsernameFromUrl(url: string): string | null {
  const patterns: Record<string, RegExp> = {
    linkedin: /linkedin\.com\/in\/([^\/\?]+)/,
    twitter: /(?:twitter|x)\.com\/([^\/\?]+)/,
    facebook: /facebook\.com\/(?:profile\.php\?id=)?([^\/\?]+)/,
    instagram: /instagram\.com\/([^\/\?]+)/,
    github: /github\.com\/([^\/\?]+)/,
    tiktok: /tiktok\.com\/@([^\/\?]+)/,
  };

  for (const [, pattern] of Object.entries(patterns)) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

// Identify platform from URL
export function identifyPlatform(url: string): keyof typeof SOCIAL_PLATFORMS | 'unknown' {
  const loweredUrl = url.toLowerCase();

  if (loweredUrl.includes('linkedin.com')) return 'linkedin';
  if (loweredUrl.includes('facebook.com')) return 'facebook';
  if (loweredUrl.includes('twitter.com') || loweredUrl.includes('x.com')) return 'twitter';
  if (loweredUrl.includes('instagram.com')) return 'instagram';
  if (loweredUrl.includes('github.com')) return 'github';
  if (loweredUrl.includes('tiktok.com')) return 'tiktok';
  if (loweredUrl.includes('youtube.com')) return 'youtube';
  if (loweredUrl.includes('pinterest.com')) return 'pinterest';

  return 'unknown';
}

// Search for email-associated social profiles
export async function searchByEmail(email: string): Promise<{
  profiles: SocialProfile[];
  searchLinks: { platform: string; url: string }[];
}> {
  const searchLinks: { platform: string; url: string }[] = [];

  // Google search for email
  searchLinks.push({
    platform: 'Google',
    url: `https://www.google.com/search?q="${encodeURIComponent(email)}"`,
  });

  // GitHub search by email (if it's linked)
  searchLinks.push({
    platform: 'GitHub',
    url: `https://github.com/search?q=${encodeURIComponent(email)}&type=users`,
  });

  return { profiles: [], searchLinks };
}

// Search for phone-associated social profiles
export async function searchByPhone(phone: string): Promise<{
  profiles: SocialProfile[];
  searchLinks: { platform: string; url: string }[];
}> {
  const searchLinks: { platform: string; url: string }[] = [];

  // Clean phone number
  const cleanPhone = phone.replace(/\D/g, '');

  // Google search for phone
  searchLinks.push({
    platform: 'Google',
    url: `https://www.google.com/search?q="${cleanPhone}" OR "${formatPhoneNumber(cleanPhone)}"`,
  });

  return { profiles: [], searchLinks };
}

// Helper: Format phone number
function formatPhoneNumber(phone: string): string {
  if (phone.length === 10) {
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
  }
  if (phone.length === 11 && phone.startsWith('1')) {
    return `+1 (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-${phone.slice(7)}`;
  }
  return phone;
}

// Platform icons (for UI)
export const PLATFORM_ICONS: Record<string, string> = {
  linkedin: '🔗',
  facebook: '👤',
  twitter: '🐦',
  instagram: '📷',
  github: '💻',
  tiktok: '🎵',
  youtube: '▶️',
  pinterest: '📌',
};

// Export all functions
export const SocialMedia = {
  searchProfiles: searchSocialProfiles,
  searchCompany: searchCompanySocials,
  searchByEmail,
  searchByPhone,
  buildSearchQuery: buildSocialSearchQuery,
  extractUsername: extractUsernameFromUrl,
  identifyPlatform,
  platforms: SOCIAL_PLATFORMS,
  professionalPlatforms: PROFESSIONAL_PLATFORMS,
  icons: PLATFORM_ICONS,
};
