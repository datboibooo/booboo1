import { createHash } from "crypto";

// ============================================
// Cache Entry Types
// ============================================

interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
}

// ============================================
// URL Cache (24h TTL)
// ============================================

const URL_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface URLCacheValue {
  url: string;
  title: string;
  content: string;
  fetchedAt: string;
  statusCode: number;
}

const urlCache = new Map<string, CacheEntry<URLCacheValue>>();
const urlCacheStats: CacheStats = { hits: 0, misses: 0 };

export function getCachedURL(url: string): URLCacheValue | null {
  const key = normalizeURL(url);
  const entry = urlCache.get(key);

  if (!entry) {
    urlCacheStats.misses++;
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    urlCache.delete(key);
    urlCacheStats.misses++;
    return null;
  }

  urlCacheStats.hits++;
  return entry.value;
}

export function setCachedURL(url: string, value: URLCacheValue): void {
  const key = normalizeURL(url);
  const now = Date.now();
  urlCache.set(key, {
    value,
    createdAt: now,
    expiresAt: now + URL_CACHE_TTL_MS,
  });
}

// ============================================
// Claim Hash Cache (8h TTL)
// ============================================

const CLAIM_CACHE_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

interface ClaimCacheValue {
  companyKey: string;
  claimHash: string;
  verificationResult: {
    status: string;
    confidence: number;
    topEvidence: { url: string; snippet: string }[];
  };
  verifiedAt: string;
}

const claimCache = new Map<string, CacheEntry<ClaimCacheValue>>();
const claimCacheStats: CacheStats = { hits: 0, misses: 0 };

export function getCachedClaim(
  company: string,
  claimHash: string
): ClaimCacheValue | null {
  const key = makeClaimKey(company, claimHash);
  const entry = claimCache.get(key);

  if (!entry) {
    claimCacheStats.misses++;
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    claimCache.delete(key);
    claimCacheStats.misses++;
    return null;
  }

  claimCacheStats.hits++;
  return entry.value;
}

export function setCachedClaim(
  company: string,
  claimHash: string,
  value: ClaimCacheValue
): void {
  const key = makeClaimKey(company, claimHash);
  const now = Date.now();
  claimCache.set(key, {
    value,
    createdAt: now,
    expiresAt: now + CLAIM_CACHE_TTL_MS,
  });
}

// ============================================
// Helpers
// ============================================

function normalizeURL(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove tracking params
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "ref",
      "source",
    ];
    trackingParams.forEach((p) => parsed.searchParams.delete(p));
    // Normalize
    return parsed.toString().toLowerCase().replace(/\/$/, "");
  } catch {
    return url.toLowerCase().replace(/\/$/, "");
  }
}

function makeClaimKey(company: string, claimHash: string): string {
  const normalizedCompany = company.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${normalizedCompany}:${claimHash}`;
}

export function hashClaim(claim: {
  type: string;
  statement: string;
  entities: Record<string, unknown>;
}): string {
  const normalized = JSON.stringify({
    type: claim.type,
    statement: claim.statement.toLowerCase().trim(),
    entities: Object.fromEntries(
      Object.entries(claim.entities)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v).toLowerCase().trim()])
        .sort(([a], [b]) => a.localeCompare(b))
    ),
  });
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

// Near-duplicate detection for evidence
export function hashContent(content: string): string {
  // Normalize: lowercase, remove extra whitespace, punctuation
  const normalized = content
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500); // First 500 chars
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

// ============================================
// Stats
// ============================================

export function getCacheStats() {
  return {
    url: { ...urlCacheStats, size: urlCache.size },
    claim: { ...claimCacheStats, size: claimCache.size },
  };
}

export function getVerificationCacheStats() {
  return {
    urlHits: urlCacheStats.hits,
    urlMisses: urlCacheStats.misses,
    claimHits: claimCacheStats.hits,
    claimMisses: claimCacheStats.misses,
  };
}

// ============================================
// Cleanup
// ============================================

export function cleanupExpiredCache(): { urlsRemoved: number; claimsRemoved: number } {
  const now = Date.now();
  let urlsRemoved = 0;
  let claimsRemoved = 0;

  for (const [key, entry] of urlCache) {
    if (now > entry.expiresAt) {
      urlCache.delete(key);
      urlsRemoved++;
    }
  }

  for (const [key, entry] of claimCache) {
    if (now > entry.expiresAt) {
      claimCache.delete(key);
      claimsRemoved++;
    }
  }

  return { urlsRemoved, claimsRemoved };
}

// Run cleanup periodically (every hour)
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredCache, 60 * 60 * 1000);
}
