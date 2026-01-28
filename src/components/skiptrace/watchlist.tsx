'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Trash2,
  RefreshCw,
  X,
  User,
  Building2,
  Phone,
  Mail,
  Car,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react';

// Watchlist item type
interface WatchlistItem {
  id: string;
  type: 'person' | 'business' | 'phone' | 'email' | 'vehicle';
  subject: string;
  query: Record<string, string>;
  addedAt: string;
  lastChecked: string | null;
  checkInterval: 'daily' | 'weekly' | 'monthly' | 'manual';
  isActive: boolean;
  notes?: string;
  lastResult?: {
    timestamp: string;
    changesDetected: boolean;
    summary: string;
  };
}

// Local storage key
const WATCHLIST_KEY = 'skiptrace_watchlist';

// Type icons
const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  person: User,
  business: Building2,
  phone: Phone,
  email: Mail,
  vehicle: Car,
};

// Hook for managing watchlist
export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        setItems([]);
      }
    }
  }, []);

  // Save to localStorage
  const saveItems = useCallback((newItems: WatchlistItem[]) => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(newItems));
    setItems(newItems);
  }, []);

  // Add item
  const addItem = useCallback((
    type: WatchlistItem['type'],
    subject: string,
    query: Record<string, string>,
    interval: WatchlistItem['checkInterval'] = 'weekly',
    notes?: string
  ) => {
    const newItem: WatchlistItem = {
      id: `watch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type,
      subject,
      query,
      addedAt: new Date().toISOString(),
      lastChecked: null,
      checkInterval: interval,
      isActive: true,
      notes,
    };

    setItems(prev => {
      const updated = [newItem, ...prev];
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
      return updated;
    });

    return newItem.id;
  }, []);

  // Remove item
  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Toggle active status
  const toggleActive = useCallback((id: string) => {
    setItems(prev => {
      const updated = prev.map(item =>
        item.id === id ? { ...item, isActive: !item.isActive } : item
      );
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Update check interval
  const updateInterval = useCallback((id: string, interval: WatchlistItem['checkInterval']) => {
    setItems(prev => {
      const updated = prev.map(item =>
        item.id === id ? { ...item, checkInterval: interval } : item
      );
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Mark as checked
  const markChecked = useCallback((id: string, result?: WatchlistItem['lastResult']) => {
    setItems(prev => {
      const updated = prev.map(item =>
        item.id === id ? {
          ...item,
          lastChecked: new Date().toISOString(),
          lastResult: result,
        } : item
      );
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Update notes
  const updateNotes = useCallback((id: string, notes: string) => {
    setItems(prev => {
      const updated = prev.map(item =>
        item.id === id ? { ...item, notes } : item
      );
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Get items due for checking
  const getDueItems = useCallback(() => {
    const now = new Date();
    return items.filter(item => {
      if (!item.isActive || item.checkInterval === 'manual') return false;
      if (!item.lastChecked) return true;

      const lastCheck = new Date(item.lastChecked);
      const daysSince = Math.floor((now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60 * 24));

      switch (item.checkInterval) {
        case 'daily': return daysSince >= 1;
        case 'weekly': return daysSince >= 7;
        case 'monthly': return daysSince >= 30;
        default: return false;
      }
    });
  }, [items]);

  return {
    items,
    addItem,
    removeItem,
    toggleActive,
    updateInterval,
    markChecked,
    updateNotes,
    getDueItems,
  };
}

// Watchlist Panel Component
interface WatchlistPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCheck: (item: WatchlistItem) => void;
}

export function WatchlistPanel({ isOpen, onClose, onRunCheck }: WatchlistPanelProps) {
  const { items, removeItem, toggleActive, updateInterval, markChecked, getDueItems } = useWatchlist();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const dueItems = getDueItems();
  const activeItems = items.filter(item => item.isActive);
  const inactiveItems = items.filter(item => !item.isActive);

  const handleRunCheck = async (item: WatchlistItem) => {
    setCheckingId(item.id);
    try {
      await onRunCheck(item);
      markChecked(item.id, {
        timestamp: new Date().toISOString(),
        changesDetected: false,
        summary: 'Check completed successfully',
      });
    } finally {
      setCheckingId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
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
                <Eye className="w-5 h-5 text-cyan-400" />
                <h2 className="text-white font-semibold">Watchlist</h2>
                {dueItems.length > 0 ? (
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                    {dueItems.length} due
                  </span>
                ) : null}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <Eye className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50">No items in watchlist</p>
                  <p className="text-sm text-white/30 mt-1">
                    Add subjects to monitor them over time
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Due for Check */}
                  {dueItems.length > 0 ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                        <p className="text-sm text-yellow-400">Due for Check ({dueItems.length})</p>
                      </div>
                      <div className="space-y-2">
                        {dueItems.map(item => (
                          <WatchlistItemCard
                            key={item.id}
                            item={item}
                            isExpanded={expandedId === item.id}
                            isChecking={checkingId === item.id}
                            onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                            onToggleActive={() => toggleActive(item.id)}
                            onRemove={() => removeItem(item.id)}
                            onRunCheck={() => handleRunCheck(item)}
                            onUpdateInterval={(interval) => updateInterval(item.id, interval)}
                            isDue
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Active Items */}
                  {activeItems.filter(item => !dueItems.includes(item)).length > 0 ? (
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Active</p>
                      <div className="space-y-2">
                        {activeItems.filter(item => !dueItems.includes(item)).map(item => (
                          <WatchlistItemCard
                            key={item.id}
                            item={item}
                            isExpanded={expandedId === item.id}
                            isChecking={checkingId === item.id}
                            onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                            onToggleActive={() => toggleActive(item.id)}
                            onRemove={() => removeItem(item.id)}
                            onRunCheck={() => handleRunCheck(item)}
                            onUpdateInterval={(interval) => updateInterval(item.id, interval)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Inactive Items */}
                  {inactiveItems.length > 0 ? (
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Paused</p>
                      <div className="space-y-2">
                        {inactiveItems.map(item => (
                          <WatchlistItemCard
                            key={item.id}
                            item={item}
                            isExpanded={expandedId === item.id}
                            isChecking={checkingId === item.id}
                            onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                            onToggleActive={() => toggleActive(item.id)}
                            onRemove={() => removeItem(item.id)}
                            onRunCheck={() => handleRunCheck(item)}
                            onUpdateInterval={(interval) => updateInterval(item.id, interval)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

// Individual watchlist item card
function WatchlistItemCard({
  item,
  isExpanded,
  isChecking,
  isDue,
  onToggleExpand,
  onToggleActive,
  onRemove,
  onRunCheck,
  onUpdateInterval,
}: {
  item: WatchlistItem;
  isExpanded: boolean;
  isChecking: boolean;
  isDue?: boolean;
  onToggleExpand: () => void;
  onToggleActive: () => void;
  onRemove: () => void;
  onRunCheck: () => void;
  onUpdateInterval: (interval: WatchlistItem['checkInterval']) => void;
}) {
  const Icon = TYPE_ICONS[item.type] || User;

  return (
    <motion.div
      layout
      className={`bg-white/5 border rounded-lg overflow-hidden ${
        isDue ? 'border-yellow-500/30' : 'border-white/10'
      }`}
    >
      {/* Header */}
      <div
        className="p-3 flex items-center gap-3 cursor-pointer hover:bg-white/5"
        onClick={onToggleExpand}
      >
        <div className={`p-2 rounded-lg ${item.isActive ? 'bg-cyan-500/20' : 'bg-white/10'}`}>
          <Icon className={`w-4 h-4 ${item.isActive ? 'text-cyan-400' : 'text-white/40'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className={`font-medium truncate ${item.isActive ? 'text-white' : 'text-white/50'}`}>
            {item.subject}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-white/40 capitalize">{item.type}</span>
            {item.lastChecked ? (
              <span className="text-xs text-white/30">
                Checked {getTimeAgo(item.lastChecked)}
              </span>
            ) : (
              <span className="text-xs text-yellow-400">Never checked</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isDue ? (
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
              Due
            </span>
          ) : null}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/40" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 border-t border-white/10 space-y-3">
              {/* Check Interval */}
              <div>
                <p className="text-xs text-white/40 mb-1">Check Interval</p>
                <div className="flex gap-1">
                  {(['daily', 'weekly', 'monthly', 'manual'] as const).map(interval => (
                    <button
                      key={interval}
                      onClick={() => onUpdateInterval(interval)}
                      className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                        item.checkInterval === interval
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {interval.charAt(0).toUpperCase() + interval.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Last Result */}
              {item.lastResult ? (
                <div className="p-2 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    {item.lastResult.changesDetected ? (
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                    <span className="text-sm text-white/70">{item.lastResult.summary}</span>
                  </div>
                </div>
              ) : null}

              {/* Notes */}
              {item.notes ? (
                <div>
                  <p className="text-xs text-white/40 mb-1">Notes</p>
                  <p className="text-sm text-white/70">{item.notes}</p>
                </div>
              ) : null}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={onRunCheck}
                  disabled={isChecking}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
                >
                  {isChecking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Checking...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span className="text-sm">Run Check</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onToggleActive}
                  className={`p-2 rounded-lg transition-colors ${
                    item.isActive
                      ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  {item.isActive ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                </button>

                <button
                  onClick={onRemove}
                  className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

// Add to Watchlist Button
interface AddToWatchlistButtonProps {
  type: WatchlistItem['type'];
  subject: string;
  query: Record<string, string>;
  variant?: 'button' | 'icon';
}

export function AddToWatchlistButton({ type, subject, query, variant = 'button' }: AddToWatchlistButtonProps) {
  const { items, addItem, removeItem } = useWatchlist();
  const [showOptions, setShowOptions] = useState(false);

  // Check if already in watchlist
  const existingItem = items.find(
    item => item.type === type && JSON.stringify(item.query) === JSON.stringify(query)
  );

  const handleAdd = (interval: WatchlistItem['checkInterval']) => {
    addItem(type, subject, query, interval);
    setShowOptions(false);
  };

  const handleRemove = () => {
    if (existingItem) {
      removeItem(existingItem.id);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={existingItem ? handleRemove : () => setShowOptions(!showOptions)}
        className={`p-2 rounded-lg transition-colors ${
          existingItem
            ? 'bg-cyan-500/20 text-cyan-400 hover:bg-red-500/20 hover:text-red-400'
            : 'hover:bg-white/10 text-white/50 hover:text-cyan-400'
        }`}
        title={existingItem ? 'Remove from watchlist' : 'Add to watchlist'}
      >
        {existingItem ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <div className="relative">
      {existingItem ? (
        <button
          onClick={handleRemove}
          className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors text-sm"
        >
          <EyeOff className="w-4 h-4" />
          <span>Remove from Watchlist</span>
        </button>
      ) : (
        <>
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 text-white/70 rounded-lg hover:bg-white/10 transition-colors text-sm border border-white/10"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Watchlist</span>
          </button>

          <AnimatePresence>
            {showOptions ? (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowOptions(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-40 overflow-hidden"
                >
                  <p className="px-3 py-2 text-xs text-white/40 border-b border-white/10">
                    Check Interval
                  </p>
                  {(['daily', 'weekly', 'monthly', 'manual'] as const).map(interval => (
                    <button
                      key={interval}
                      onClick={() => handleAdd(interval)}
                      className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
                    >
                      {interval.charAt(0).toUpperCase() + interval.slice(1)}
                    </button>
                  ))}
                </motion.div>
              </>
            ) : null}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// Watchlist button for toolbar
export function WatchlistButton({ onClick, dueCount }: { onClick: () => void; dueCount: number }) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
    >
      <Eye className="w-4 h-4 text-white/50" />
      <span className="text-sm text-white/70 hidden md:inline">Watchlist</span>
      {dueCount > 0 ? (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {dueCount}
        </span>
      ) : null}
    </button>
  );
}

// Helper: Format time ago
function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return then.toLocaleDateString();
}
