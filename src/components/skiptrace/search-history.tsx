'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Star,
  Trash2,
  Search,
  User,
  Building2,
  Phone,
  Mail,
  Car,
  Home,
  Scale,
  Shield,
  Users,
  Briefcase,
  MapPin,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';

// Search history item type
interface SearchHistoryItem {
  id: string;
  type: string;
  query: Record<string, unknown>;
  displayName: string;
  timestamp: string;
  isFavorite: boolean;
  resultCount?: number;
}

// Local storage keys
const HISTORY_KEY = 'skiptrace_search_history';
const MAX_HISTORY_ITEMS = 50;

// Type icons
const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  person: User,
  business: Building2,
  phone: Phone,
  email: Mail,
  vehicle: Car,
  property: Home,
  court: Scale,
  criminal: Shield,
  relatives: Users,
  employment: Briefcase,
  address: MapPin,
};

// Hook for managing search history
export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  // Save history to localStorage
  const saveHistory = useCallback((items: SearchHistoryItem[]) => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
    setHistory(items);
  }, []);

  // Add search to history
  const addSearch = useCallback((
    type: string,
    query: Record<string, unknown>,
    displayName: string,
    resultCount?: number
  ) => {
    const newItem: SearchHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type,
      query,
      displayName,
      timestamp: new Date().toISOString(),
      isFavorite: false,
      resultCount,
    };

    setHistory(prev => {
      // Remove duplicate searches
      const filtered = prev.filter(item =>
        !(item.type === type && JSON.stringify(item.query) === JSON.stringify(query))
      );

      // Add new item at the beginning
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.map(item =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      );
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Remove item
  const removeItem = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Clear all history (keep favorites)
  const clearHistory = useCallback(() => {
    setHistory(prev => {
      const updated = prev.filter(item => item.isFavorite);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Clear everything
  const clearAll = useCallback(() => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  }, []);

  return {
    history,
    addSearch,
    toggleFavorite,
    removeItem,
    clearHistory,
    clearAll,
  };
}

// Search History Sidebar Component
interface SearchHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSearch: (type: string, query: Record<string, unknown>) => void;
}

export function SearchHistoryPanel({ isOpen, onClose, onSelectSearch }: SearchHistoryPanelProps) {
  const { history, toggleFavorite, removeItem, clearHistory, clearAll } = useSearchHistory();
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const filteredHistory = filter === 'favorites'
    ? history.filter(item => item.isFavorite)
    : history;

  const favorites = history.filter(item => item.isFavorite);
  const recent = history.filter(item => !item.isFavorite);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-white/10 z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                <h2 className="text-white font-semibold">Search History</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="p-4 border-b border-white/10">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  All ({history.length})
                </button>
                <button
                  onClick={() => setFilter('favorites')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    filter === 'favorites'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  Favorites ({favorites.length})
                </button>
              </div>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50">
                    {filter === 'favorites' ? 'No favorite searches yet' : 'No search history yet'}
                  </p>
                  <p className="text-sm text-white/30 mt-1">
                    Your searches will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filter === 'all' && favorites.length > 0 && (
                    <>
                      <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Favorites</p>
                      {favorites.map(item => (
                        <HistoryItem
                          key={item.id}
                          item={item}
                          onSelect={() => {
                            onSelectSearch(item.type, item.query);
                            onClose();
                          }}
                          onToggleFavorite={() => toggleFavorite(item.id)}
                          onRemove={() => removeItem(item.id)}
                        />
                      ))}
                      {recent.length > 0 && (
                        <p className="text-xs text-white/40 uppercase tracking-wide mt-4 mb-2">Recent</p>
                      )}
                    </>
                  )}

                  {filter === 'all'
                    ? recent.map(item => (
                        <HistoryItem
                          key={item.id}
                          item={item}
                          onSelect={() => {
                            onSelectSearch(item.type, item.query);
                            onClose();
                          }}
                          onToggleFavorite={() => toggleFavorite(item.id)}
                          onRemove={() => removeItem(item.id)}
                        />
                      ))
                    : filteredHistory.map(item => (
                        <HistoryItem
                          key={item.id}
                          item={item}
                          onSelect={() => {
                            onSelectSearch(item.type, item.query);
                            onClose();
                          }}
                          onToggleFavorite={() => toggleFavorite(item.id)}
                          onRemove={() => removeItem(item.id)}
                        />
                      ))
                  }
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {history.length > 0 && (
              <div className="p-4 border-t border-white/10">
                {showConfirmClear ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/70 flex-1">Clear all history?</span>
                    <button
                      onClick={() => {
                        clearAll();
                        setShowConfirmClear(false);
                      }}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30"
                    >
                      Yes, clear all
                    </button>
                    <button
                      onClick={() => setShowConfirmClear(false)}
                      className="px-3 py-1 bg-white/10 text-white/70 rounded-lg text-sm hover:bg-white/20"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={clearHistory}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg text-sm transition-colors"
                    >
                      Clear History (Keep Favorites)
                    </button>
                    <button
                      onClick={() => setShowConfirmClear(true)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Individual history item
function HistoryItem({
  item,
  onSelect,
  onToggleFavorite,
  onRemove,
}: {
  item: SearchHistoryItem;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onRemove: () => void;
}) {
  const Icon = TYPE_ICONS[item.type] || Search;
  const timeAgo = getTimeAgo(item.timestamp);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="group bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white/5 rounded-lg">
          <Icon className="w-4 h-4 text-cyan-400" />
        </div>

        <div className="flex-1 min-w-0">
          <button
            onClick={onSelect}
            className="block w-full text-left"
          >
            <p className="text-white font-medium truncate">{item.displayName}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-cyan-400 capitalize">{item.type}</span>
              <span className="text-xs text-white/30">{timeAgo}</span>
              {item.resultCount !== undefined && (
                <span className="text-xs text-white/40">{item.resultCount} results</span>
              )}
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              item.isFavorite
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'hover:bg-white/10 text-white/30'
            }`}
          >
            <Star className="w-4 h-4" fill={item.isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white/30 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1.5 hover:bg-red-500/20 rounded-lg text-white/30 hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Helper: Format time ago
function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return then.toLocaleDateString();
}

// Compact history button for toolbar
export function HistoryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
    >
      <Clock className="w-4 h-4 text-white/50" />
      <span className="text-sm text-white/70 hidden md:inline">History</span>
    </button>
  );
}

// Quick access dropdown for recent searches
export function RecentSearchesDropdown({
  onSelectSearch,
}: {
  onSelectSearch: (type: string, query: Record<string, unknown>) => void;
}) {
  const { history } = useSearchHistory();
  const [isOpen, setIsOpen] = useState(false);

  const recentItems = history.slice(0, 5);

  if (recentItems.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors"
      >
        <Clock className="w-4 h-4" />
        <span>Recent Searches</span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 top-full mt-2 w-72 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-40 overflow-hidden"
            >
              <div className="p-2">
                {recentItems.map(item => {
                  const Icon = TYPE_ICONS[item.type] || Search;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectSearch(item.type, item.query);
                        setIsOpen(false);
                      }}
                      className="w-full p-2 flex items-center gap-3 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <div className="flex-1 text-left">
                        <p className="text-sm text-white truncate">{item.displayName}</p>
                        <p className="text-xs text-white/40">{getTimeAgo(item.timestamp)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
