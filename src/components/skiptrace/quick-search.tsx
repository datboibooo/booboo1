'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  User,
  Building2,
  Phone,
  Mail,
  Car,
  Hash,
  Loader2,
  ArrowRight,
  X,
} from 'lucide-react';

type DetectedType = 'person' | 'business' | 'phone' | 'email' | 'vin' | 'unknown';

interface QuickSearchResult {
  success: boolean;
  type: string;
  data: unknown;
}

const TYPE_ICONS: Record<DetectedType, React.ComponentType<{ className?: string }>> = {
  person: User,
  business: Building2,
  phone: Phone,
  email: Mail,
  vin: Car,
  unknown: Hash,
};

const TYPE_LABELS: Record<DetectedType, string> = {
  person: 'Person Search',
  business: 'Business Search',
  phone: 'Phone Lookup',
  email: 'Email Lookup',
  vin: 'VIN Decode',
  unknown: 'Search',
};

// Smart detection of input type
function detectInputType(input: string): DetectedType {
  const trimmed = input.trim();

  // Email detection
  if (/@/.test(trimmed) && /\.\w{2,}$/.test(trimmed)) {
    return 'email';
  }

  // Phone detection (10+ digits)
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length >= 10 && digits.length <= 11) {
    return 'phone';
  }

  // VIN detection (17 alphanumeric, no I, O, Q)
  const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/i;
  if (vinPattern.test(trimmed.replace(/\s/g, ''))) {
    return 'vin';
  }

  // Name detection (2+ words, no special chars except hyphen/apostrophe)
  const words = trimmed.split(/\s+/);
  if (words.length >= 2 && /^[A-Za-z\s'-]+$/.test(trimmed)) {
    return 'person';
  }

  // Business if contains common business terms or single word
  if (/\b(inc|llc|corp|company|co|ltd|group|holdings|enterprises?)\b/i.test(trimmed) ||
      (words.length === 1 && trimmed.length > 2)) {
    return 'business';
  }

  return 'unknown';
}

interface QuickSearchProps {
  onResult?: (result: QuickSearchResult) => void;
  className?: string;
}

export function QuickSearch({ onResult, className }: QuickSearchProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QuickSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detectedType = query.length > 2 ? detectInputType(query) : 'unknown';
  const Icon = TYPE_ICONS[detectedType];

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/skiptrace/report?q=${encodeURIComponent(query.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResult(data);
      onResult?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, [query, onResult]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResult(null);
    setError(null);
  };

  return (
    <div className={className}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={detectedType}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Icon className="w-5 h-5 text-cyan-400" />
            </motion.div>
          </AnimatePresence>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter name, phone, email, VIN, or business..."
          className="w-full pl-12 pr-24 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all text-lg"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {query && (
            <button
              onClick={clearSearch}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white/40" />
            </button>
          )}
          <button
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Type Indicator */}
      <AnimatePresence>
        {query.length > 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 flex items-center gap-2 text-sm text-white/50"
          >
            <Icon className="w-4 h-4" />
            <span>Detected: {TYPE_LABELS[detectedType]}</span>
            {detectedType !== 'unknown' && (
              <ArrowRight className="w-3 h-3" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Quick Result Preview */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
              {result.type}
            </div>
            <span className="text-sm text-white/50">Results found</span>
          </div>
          <p className="text-sm text-white/70">
            Use the search tabs above for detailed results and resource links.
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default QuickSearch;
