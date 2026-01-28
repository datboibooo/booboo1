'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuickSearch } from '@/components/skiptrace/quick-search';
import { ResultDisplay, SearchLinksGrid } from '@/components/skiptrace/results-display';
import { ReportExport, QuickExportButton } from '@/components/skiptrace/report-export';
import { SearchHistoryPanel, HistoryButton, RecentSearchesDropdown, useSearchHistory } from '@/components/skiptrace/search-history';
import {
  Search,
  User,
  Building2,
  Phone,
  Mail,
  Car,
  Scale,
  Home,
  FileText,
  Share2,
  Award,
  ChevronDown,
  ExternalLink,
  Loader2,
  X,
  AlertTriangle,
  Plane,
  Scroll,
  Users,
  Briefcase,
  MapPin,
  Clock,
  Download,
} from 'lucide-react';

type SearchTab = 'person' | 'business' | 'phone' | 'email' | 'vehicle' | 'property' | 'court' | 'licenses' | 'social' | 'criminal' | 'assets' | 'records' | 'relatives' | 'employment' | 'address';

interface SearchResult {
  success: boolean;
  data: {
    searchLinks?: { name: string; url: string; category?: string; state?: string }[];
    sources?: string[];
    businesses?: Array<{
      id: string;
      name: string;
      stateOfFormation: string;
      status: string;
      sourceUrl?: string;
    }>;
    parsed?: Record<string, unknown>;
    location?: { city: string; state: string };
    decoded?: { valid: boolean; data?: Record<string, unknown> };
    recalls?: { hasRecalls: boolean; recalls: Array<{ campaign: string; summary: string }> };
    [key: string]: unknown;
  };
}

export default function SkipTracePage() {
  const [activeTab, setActiveTab] = useState<SearchTab>('person');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [lastSearchParams, setLastSearchParams] = useState<Record<string, string>>({});
  const { addSearch } = useSearchHistory();

  const tabs: { id: SearchTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'person', label: 'Person', icon: User },
    { id: 'business', label: 'Business', icon: Building2 },
    { id: 'phone', label: 'Phone', icon: Phone },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'vehicle', label: 'Vehicle', icon: Car },
    { id: 'property', label: 'Property', icon: Home },
    { id: 'relatives', label: 'Relatives', icon: Users },
    { id: 'employment', label: 'Employment', icon: Briefcase },
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'court', label: 'Court', icon: Scale },
    { id: 'criminal', label: 'Criminal', icon: AlertTriangle },
    { id: 'licenses', label: 'Licenses', icon: Award },
    { id: 'assets', label: 'Assets', icon: Plane },
    { id: 'records', label: 'Public Records', icon: Scroll },
    { id: 'social', label: 'Social', icon: Share2 },
  ];

  const handleSearch = async (endpoint: string, params: Record<string, string>) => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    setLastSearchParams(params);

    try {
      const response = await fetch(`/api/skiptrace/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data);

      // Generate display name for history
      let displayName = '';
      if (params.firstName && params.lastName) {
        displayName = `${params.firstName} ${params.lastName}`;
      } else if (params.name) {
        displayName = params.name;
      } else if (params.phone) {
        displayName = params.phone;
      } else if (params.email) {
        displayName = params.email;
      } else if (params.vin) {
        displayName = params.vin;
      } else if (params.address) {
        displayName = `${params.address}, ${params.city || ''} ${params.state || ''}`.trim();
      } else {
        displayName = Object.values(params).filter(v => v).join(' ');
      }

      // Add to search history
      addSearch(endpoint, params, displayName.substring(0, 50));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting a search from history
  const handleSelectFromHistory = useCallback((type: string, query: Record<string, unknown>) => {
    setActiveTab(type as SearchTab);
    // Trigger search with the saved query
    handleSearch(type, query as Record<string, string>);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0f0f11]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">SkipTrace Pro</h1>
                <p className="text-sm text-white/50">Professional Investigation Tools</p>
              </div>
            </div>
            <div className="hidden lg:block flex-1 max-w-xl">
              <QuickSearch className="w-full" />
            </div>
            <div className="flex items-center gap-2">
              <RecentSearchesDropdown onSelectSearch={handleSelectFromHistory} />
              <HistoryButton onClick={() => setShowHistory(true)} />
            </div>
          </div>
        </div>
      </div>

      {/* Search History Panel */}
      <SearchHistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectSearch={handleSelectFromHistory}
      />

      {/* Mobile Quick Search */}
      <div className="lg:hidden border-b border-white/10 bg-[#0f0f11]/50 px-4 py-3">
        <QuickSearch className="w-full" />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-white/10 bg-[#0f0f11]/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setResults(null);
                  setError(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Panel */}
          <div className="lg:col-span-1">
            <div className="bg-[#131316] rounded-xl border border-white/10 p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'person' && <PersonSearchForm onSearch={handleSearch} isLoading={isLoading} />}
                  {activeTab === 'business' && <BusinessSearchForm onSearch={handleSearch} isLoading={isLoading} />}
                  {activeTab === 'phone' && <PhoneSearchForm onSearch={handleSearch} isLoading={isLoading} />}
                  {activeTab === 'email' && <EmailSearchForm onSearch={handleSearch} isLoading={isLoading} />}
                  {activeTab === 'vehicle' && <VehicleSearchForm onSearch={handleSearch} isLoading={isLoading} />}
                  {activeTab === 'property' && <PropertySearchForm onSearch={handleSearch} isLoading={isLoading} />}
                  {activeTab === 'court' && <CourtSearchForm onSearch={handleSearch} isLoading={isLoading} />}
                  {activeTab === 'licenses' && <LicenseSearchForm onSearch={handleSearch} isLoading={isLoading} />}
                  {activeTab === 'criminal' && <CriminalSearchForm onSearch={handleSearch} isLoading={isLoading} />}
                  {activeTab === 'assets' && <AssetsSearchForm onSearch={handleSearch} isLoading={isLoading} />}
                  {activeTab === 'records' && <PublicRecordsSearchForm onSearch={handleSearch} isLoading={isLoading} />}
                  {activeTab === 'relatives' && <RelativesSearchForm onSearch={handleSearch} isLoading={isLoading} />}
                  {activeTab === 'employment' && <EmploymentSearchForm onSearch={handleSearch} isLoading={isLoading} />}
                  {activeTab === 'address' && <AddressSearchForm onSearch={handleSearch} isLoading={isLoading} />}
                  {activeTab === 'social' && <SocialSearchForm onSearch={handleSearch} isLoading={isLoading} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <div className="bg-[#131316] rounded-xl border border-white/10 min-h-[400px]">
              {/* Results Header with Export */}
              {results && !isLoading && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm text-white/70">Results found</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowExport(!showExport)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-sm"
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                      <span className="text-white/70">Export</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Export Panel */}
              <AnimatePresence>
                {showExport && results && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-b border-white/10 overflow-hidden"
                  >
                    <div className="p-4">
                      <ReportExport
                        data={{
                          type: activeTab,
                          subject: Object.values(lastSearchParams).filter(v => v).join(' '),
                          timestamp: new Date().toISOString(),
                          data: results.data,
                          searchLinks: results.data.searchLinks?.map(l => ({
                            name: l.name,
                            url: l.url,
                            category: l.category,
                          })),
                        }}
                        onClose={() => setShowExport(false)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isLoading && (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto mb-4" />
                    <p className="text-white/60">Searching databases...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-6">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                    <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-400">Search Error</p>
                      <p className="text-sm text-red-400/80 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {results && !isLoading && (
                <SearchResults results={results} searchType={activeTab} />
              )}

              {!results && !isLoading && !error && (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center">
                    <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40">Enter search criteria and click Search</p>
                    <p className="text-sm text-white/30 mt-2">Results will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Form Components
interface FormProps {
  onSearch: (endpoint: string, params: Record<string, string>) => void;
  isLoading: boolean;
}

function PersonSearchForm({ onSearch, isLoading }: FormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch('person', { firstName, lastName, city, state, phone, email, mode: 'standard' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <User className="w-5 h-5 text-cyan-500" />
        Person Search
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <Input label="First Name" value={firstName} onChange={setFirstName} placeholder="John" />
        <Input label="Last Name" value={lastName} onChange={setLastName} placeholder="Doe" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="City" value={city} onChange={setCity} placeholder="Miami" />
        <Input label="State" value={state} onChange={setState} placeholder="FL" />
      </div>
      <Input label="Phone" value={phone} onChange={setPhone} placeholder="(555) 123-4567" />
      <Input label="Email" value={email} onChange={setEmail} placeholder="john@example.com" />
      <SearchButton isLoading={isLoading} />
    </form>
  );
}

function BusinessSearchForm({ onSearch, isLoading }: FormProps) {
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [officerName, setOfficerName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch('business', { name, state, officerName, mode: 'standard' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Building2 className="w-5 h-5 text-cyan-500" />
        Business Search
      </h3>
      <Input label="Business Name" value={name} onChange={setName} placeholder="Acme Corporation" required />
      <Input label="State" value={state} onChange={setState} placeholder="FL, CA, NY..." />
      <Input label="Officer Name" value={officerName} onChange={setOfficerName} placeholder="Search by officer" />
      <SearchButton isLoading={isLoading} />
    </form>
  );
}

function PhoneSearchForm({ onSearch, isLoading }: FormProps) {
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch('phone', { phone });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Phone className="w-5 h-5 text-cyan-500" />
        Phone Lookup
      </h3>
      <Input label="Phone Number" value={phone} onChange={setPhone} placeholder="(555) 123-4567" required />
      <p className="text-xs text-white/40">Enter a US phone number to lookup carrier, location, and owner information.</p>
      <SearchButton isLoading={isLoading} />
    </form>
  );
}

function EmailSearchForm({ onSearch, isLoading }: FormProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [domain, setDomain] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName && lastName && domain) {
      onSearch('email', { firstName, lastName, domain });
    } else {
      onSearch('email', { email });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Mail className="w-5 h-5 text-cyan-500" />
        Email Lookup
      </h3>
      <Input label="Email Address" value={email} onChange={setEmail} placeholder="john@example.com" />
      <div className="relative flex items-center gap-2 py-2">
        <div className="flex-1 border-t border-white/10"></div>
        <span className="text-xs text-white/40">OR FIND EMAIL</span>
        <div className="flex-1 border-t border-white/10"></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="First Name" value={firstName} onChange={setFirstName} placeholder="John" />
        <Input label="Last Name" value={lastName} onChange={setLastName} placeholder="Doe" />
      </div>
      <Input label="Company Domain" value={domain} onChange={setDomain} placeholder="acme.com" />
      <SearchButton isLoading={isLoading} />
    </form>
  );
}

function VehicleSearchForm({ onSearch, isLoading }: FormProps) {
  const [vin, setVin] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [state, setState] = useState('');
  const [ownerName, setOwnerName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch('vehicle', { vin, licensePlate, state, ownerName });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Car className="w-5 h-5 text-cyan-500" />
        Vehicle Search
      </h3>
      <Input label="VIN" value={vin} onChange={setVin} placeholder="17-character VIN" />
      <div className="relative flex items-center gap-2 py-2">
        <div className="flex-1 border-t border-white/10"></div>
        <span className="text-xs text-white/40">OR</span>
        <div className="flex-1 border-t border-white/10"></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="License Plate" value={licensePlate} onChange={setLicensePlate} placeholder="ABC1234" />
        <Input label="State" value={state} onChange={setState} placeholder="FL" />
      </div>
      <Input label="Owner Name" value={ownerName} onChange={setOwnerName} placeholder="Search by owner" />
      <SearchButton isLoading={isLoading} />
    </form>
  );
}

function PropertySearchForm({ onSearch, isLoading }: FormProps) {
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [county, setCounty] = useState('');
  const [ownerName, setOwnerName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch('property', { address, city, state, county, ownerName });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Home className="w-5 h-5 text-cyan-500" />
        Property Search
      </h3>
      <Input label="Street Address" value={address} onChange={setAddress} placeholder="123 Main St" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="City" value={city} onChange={setCity} placeholder="Miami" />
        <Input label="State" value={state} onChange={setState} placeholder="FL" />
      </div>
      <Input label="County" value={county} onChange={setCounty} placeholder="Miami-Dade" />
      <div className="relative flex items-center gap-2 py-2">
        <div className="flex-1 border-t border-white/10"></div>
        <span className="text-xs text-white/40">OR SEARCH BY OWNER</span>
        <div className="flex-1 border-t border-white/10"></div>
      </div>
      <Input label="Owner Name" value={ownerName} onChange={setOwnerName} placeholder="John Doe" />
      <SearchButton isLoading={isLoading} />
    </form>
  );
}

function CourtSearchForm({ onSearch, isLoading }: FormProps) {
  const [name, setName] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [state, setState] = useState('');
  const [searchType, setSearchType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch('court', { name, caseNumber, state, searchType });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Scale className="w-5 h-5 text-cyan-500" />
        Court Records
      </h3>
      <Input label="Name" value={name} onChange={setName} placeholder="John Doe" />
      <Input label="Case Number" value={caseNumber} onChange={setCaseNumber} placeholder="Case #" />
      <Input label="State" value={state} onChange={setState} placeholder="FL" />
      <Select
        label="Record Type"
        value={searchType}
        onChange={setSearchType}
        options={[
          { value: '', label: 'All Records' },
          { value: 'bankruptcy', label: 'Bankruptcy' },
          { value: 'liens', label: 'Liens & Judgments' },
          { value: 'ucc', label: 'UCC Filings' },
        ]}
      />
      <SearchButton isLoading={isLoading} />
    </form>
  );
}

function LicenseSearchForm({ onSearch, isLoading }: FormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [state, setState] = useState('');
  const [licenseType, setLicenseType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch('licenses', { firstName, lastName, state, licenseType });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Award className="w-5 h-5 text-cyan-500" />
        License Search
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <Input label="First Name" value={firstName} onChange={setFirstName} placeholder="John" required />
        <Input label="Last Name" value={lastName} onChange={setLastName} placeholder="Doe" required />
      </div>
      <Input label="State" value={state} onChange={setState} placeholder="FL" />
      <Select
        label="License Type"
        value={licenseType}
        onChange={setLicenseType}
        options={[
          { value: '', label: 'All Licenses' },
          { value: 'contractor', label: 'Contractor' },
          { value: 'real_estate', label: 'Real Estate' },
          { value: 'medical', label: 'Medical' },
          { value: 'attorney', label: 'Attorney' },
        ]}
      />
      <SearchButton isLoading={isLoading} />
    </form>
  );
}

function CriminalSearchForm({ onSearch, isLoading }: FormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [state, setState] = useState('');
  const [searchType, setSearchType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch('criminal', { firstName, lastName, state, searchType });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-cyan-500" />
        Criminal Records
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <Input label="First Name" value={firstName} onChange={setFirstName} placeholder="John" required />
        <Input label="Last Name" value={lastName} onChange={setLastName} placeholder="Doe" required />
      </div>
      <Input label="State" value={state} onChange={setState} placeholder="FL" />
      <Select
        label="Search Type"
        value={searchType}
        onChange={setSearchType}
        options={[
          { value: '', label: 'All Records' },
          { value: 'inmate', label: 'Inmate/Prison' },
          { value: 'sexoffender', label: 'Sex Offender Registry' },
          { value: 'warrant', label: 'Active Warrants' },
          { value: 'arrest', label: 'Arrest Records' },
        ]}
      />
      <SearchButton isLoading={isLoading} />
    </form>
  );
}

function AssetsSearchForm({ onSearch, isLoading }: FormProps) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [nNumber, setNNumber] = useState('');
  const [searchType, setSearchType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch('assets', { name, company, nNumber, searchType });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Plane className="w-5 h-5 text-cyan-500" />
        Assets & Wealth
      </h3>
      <Input label="Owner Name" value={name} onChange={setName} placeholder="John Doe" />
      <Input label="Company Name" value={company} onChange={setCompany} placeholder="For business assets" />
      <div className="relative flex items-center gap-2 py-2">
        <div className="flex-1 border-t border-white/10"></div>
        <span className="text-xs text-white/40">OR DIRECT LOOKUP</span>
        <div className="flex-1 border-t border-white/10"></div>
      </div>
      <Input label="Aircraft N-Number" value={nNumber} onChange={setNNumber} placeholder="N12345" />
      <Select
        label="Asset Type"
        value={searchType}
        onChange={setSearchType}
        options={[
          { value: '', label: 'All Assets' },
          { value: 'aircraft', label: 'Aircraft (FAA)' },
          { value: 'vessel', label: 'Vessels (USCG)' },
        ]}
      />
      <p className="text-xs text-white/40">Search FAA aircraft registry, USCG vessel documentation, SEC holdings, and more.</p>
      <SearchButton isLoading={isLoading} />
    </form>
  );
}

function PublicRecordsSearchForm({ onSearch, isLoading }: FormProps) {
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [recordType, setRecordType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch('records', { name, state, recordType });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Scroll className="w-5 h-5 text-cyan-500" />
        Public Records
      </h3>
      <Input label="Full Name" value={name} onChange={setName} placeholder="John Doe" required />
      <Input label="State" value={state} onChange={setState} placeholder="FL" />
      <Select
        label="Record Type"
        value={recordType}
        onChange={setRecordType}
        options={[
          { value: '', label: 'All Records' },
          { value: 'ssdi', label: 'Death Records (SSDI)' },
          { value: 'voter', label: 'Voter Registration' },
          { value: 'vital', label: 'Vital Records' },
          { value: 'marriage', label: 'Marriage/Divorce' },
          { value: 'census', label: 'Census Records' },
          { value: 'military', label: 'Military Records' },
          { value: 'immigration', label: 'Immigration' },
        ]}
      />
      <SearchButton isLoading={isLoading} />
    </form>
  );
}

function RelativesSearchForm({ onSearch, isLoading }: FormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch('relatives', { firstName, lastName, address, city, state });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Users className="w-5 h-5 text-cyan-500" />
        Relatives & Associates
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <Input label="First Name" value={firstName} onChange={setFirstName} placeholder="John" required />
        <Input label="Last Name" value={lastName} onChange={setLastName} placeholder="Doe" required />
      </div>
      <Input label="Current Address" value={address} onChange={setAddress} placeholder="123 Main St" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="City" value={city} onChange={setCity} placeholder="Miami" />
        <Input label="State" value={state} onChange={setState} placeholder="FL" />
      </div>
      <p className="text-xs text-white/40">Find family members, neighbors, and business associates.</p>
      <SearchButton isLoading={isLoading} />
    </form>
  );
}

function EmploymentSearchForm({ onSearch, isLoading }: FormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [searchType, setSearchType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch('employment', { firstName, lastName, company, searchType });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-cyan-500" />
        Employment History
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <Input label="First Name" value={firstName} onChange={setFirstName} placeholder="John" required />
        <Input label="Last Name" value={lastName} onChange={setLastName} placeholder="Doe" required />
      </div>
      <Input label="Company" value={company} onChange={setCompany} placeholder="Known employer (optional)" />
      <Select
        label="Search Type"
        value={searchType}
        onChange={setSearchType}
        options={[
          { value: '', label: 'General Employment Search' },
          { value: 'verify', label: 'Verify Employment' },
          { value: 'company', label: 'Search Company Employees' },
        ]}
      />
      <p className="text-xs text-white/40">Find work history via LinkedIn, SEC filings, and professional licenses.</p>
      <SearchButton isLoading={isLoading} />
    </form>
  );
}

function AddressSearchForm({ onSearch, isLoading }: FormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [searchType, setSearchType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchType === 'reverse' && address && city && state) {
      onSearch('address', { address, city, state, searchType });
    } else {
      onSearch('address', { firstName, lastName, city, state });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MapPin className="w-5 h-5 text-cyan-500" />
        Address History
      </h3>
      <Select
        label="Search Type"
        value={searchType}
        onChange={setSearchType}
        options={[
          { value: '', label: 'Person Address History' },
          { value: 'reverse', label: 'Reverse Address Lookup' },
        ]}
      />
      {searchType === 'reverse' ? (
        <>
          <Input label="Street Address" value={address} onChange={setAddress} placeholder="123 Main St" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" value={city} onChange={setCity} placeholder="Miami" required />
            <Input label="State" value={state} onChange={setState} placeholder="FL" required />
          </div>
          <p className="text-xs text-white/40">Find all residents at this address.</p>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" value={firstName} onChange={setFirstName} placeholder="John" required />
            <Input label="Last Name" value={lastName} onChange={setLastName} placeholder="Doe" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Current City" value={city} onChange={setCity} placeholder="Miami" />
            <Input label="State" value={state} onChange={setState} placeholder="FL" />
          </div>
          <p className="text-xs text-white/40">Find previous addresses for this person.</p>
        </>
      )}
      <SearchButton isLoading={isLoading} />
    </form>
  );
}

function SocialSearchForm({ onSearch, isLoading }: FormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch('social', { firstName, lastName, company, location });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Share2 className="w-5 h-5 text-cyan-500" />
        Social Media
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <Input label="First Name" value={firstName} onChange={setFirstName} placeholder="John" required />
        <Input label="Last Name" value={lastName} onChange={setLastName} placeholder="Doe" required />
      </div>
      <Input label="Company" value={company} onChange={setCompany} placeholder="Acme Inc" />
      <Input label="Location" value={location} onChange={setLocation} placeholder="Miami, FL" />
      <SearchButton isLoading={isLoading} />
    </form>
  );
}

// Shared Components
function Input({
  label,
  value,
  onChange,
  placeholder,
  required = false
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm text-white/60 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm text-white/60 mb-1.5">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#131316]">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
      </div>
    </div>
  );
}

function SearchButton({ isLoading }: { isLoading: boolean }) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Searching...
        </>
      ) : (
        <>
          <Search className="w-4 h-4" />
          Search
        </>
      )}
    </button>
  );
}

// Results Display
function SearchResults({ results, searchType }: { results: SearchResult; searchType: SearchTab }) {
  const { data } = results;

  return (
    <div className="p-6 space-y-6">
      {/* Summary */}
      {data.sources && data.sources.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-white/40">Sources:</span>
          {data.sources.map((source, i) => (
            <span key={i} className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-full border border-cyan-500/20">
              {source}
            </span>
          ))}
        </div>
      )}

      {/* Enhanced Result Display based on search type */}
      <ResultDisplay type={searchType} data={data as Record<string, unknown>} />

      {/* Legacy display for backwards compatibility with some search types */}
      {/* Businesses Found - shown if not using enhanced display */}
      {data.businesses && data.businesses.length > 0 && searchType !== 'business' && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white/80 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Related Businesses ({data.businesses.length})
          </h4>
          <div className="space-y-2">
            {data.businesses.map((biz, i) => (
              <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{biz.name}</p>
                    <p className="text-sm text-white/50">{biz.stateOfFormation} • {biz.status}</p>
                  </div>
                  {biz.sourceUrl && (
                    <a
                      href={biz.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-cyan-400" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Links - Enhanced Grid */}
      {data.searchLinks && data.searchLinks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white/80 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Search Resources ({data.searchLinks.length})
          </h4>
          <SearchLinksGrid
            links={data.searchLinks.map(link => ({
              name: link.name,
              url: link.url,
              category: link.category || link.state || 'General',
            }))}
          />
        </div>
      )}
    </div>
  );
}
