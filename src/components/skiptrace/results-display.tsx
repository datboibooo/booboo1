'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Scale,
  Shield,
  Car,
  Home,
  Users,
  Globe,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  FileText,
  Plane,
  Ship,
  BadgeCheck,
} from 'lucide-react';

// Helper to safely render conditional content
function ConditionalRender({ condition, children }: { condition: unknown; children: React.ReactNode }) {
  return condition ? <>{children}</> : null;
}

// Copy to clipboard helper
function useCopyToClipboard() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return { copied, copy };
}

// Collapsible section
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  badge,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-cyan-400" />
          <span className="font-medium text-white">{title}</span>
          {badge}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-white/50" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/50" />
        )}
      </button>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 border-t border-white/10">
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// Person Result Card
export function PersonResultCard({ data }: { data: Record<string, unknown> }) {
  const { copied, copy } = useCopyToClipboard();
  const person = (data.person || data) as Record<string, unknown>;
  const phones = Array.isArray(person.phones) ? person.phones as Array<{ number: string }> : [];
  const emails = Array.isArray(person.emails) ? person.emails as Array<{ address: string }> : [];
  const addresses = Array.isArray(person.addresses) ? person.addresses as Array<{ street?: string; city?: string; state?: string; zip?: string; type?: string }> : [];

  return (
    <div className="space-y-4 mt-4">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ConditionalRender condition={person.firstName}>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <User className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-xs text-white/50">Name</p>
              <p className="text-white font-medium">
                {String(person.firstName || '')} {String(person.lastName || '')}
              </p>
            </div>
          </div>
        </ConditionalRender>

        <ConditionalRender condition={phones.length > 0}>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <Phone className="w-5 h-5 text-green-400" />
            <div className="flex-1">
              <p className="text-xs text-white/50">Phone</p>
              {phones.map((phone, i) => (
                <div key={i} className="flex items-center gap-2">
                  <p className="text-white">{phone.number}</p>
                  <button
                    onClick={() => copy(phone.number, `phone-${i}`)}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    {copied === `phone-${i}` ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-white/40" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </ConditionalRender>

        <ConditionalRender condition={emails.length > 0}>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <Mail className="w-5 h-5 text-blue-400" />
            <div className="flex-1">
              <p className="text-xs text-white/50">Email</p>
              {emails.map((email, i) => (
                <div key={i} className="flex items-center gap-2">
                  <p className="text-white truncate">{email.address}</p>
                  <button
                    onClick={() => copy(email.address, `email-${i}`)}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    {copied === `email-${i}` ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-white/40" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </ConditionalRender>
      </div>

      {/* Addresses */}
      <ConditionalRender condition={addresses.length > 0}>
        <CollapsibleSection title="Addresses" icon={MapPin} badge={<span className="text-xs text-white/40">{addresses.length} found</span>}>
          <div className="space-y-2 mt-3">
            {addresses.map((addr, i) => (
              <div key={i} className="p-3 bg-white/5 rounded-lg flex items-start justify-between">
                <div>
                  <p className="text-white">{addr.street || 'Unknown Street'}</p>
                  <p className="text-white/60 text-sm">
                    {addr.city}, {addr.state} {addr.zip}
                  </p>
                  <ConditionalRender condition={addr.type}>
                    <span className="text-xs text-cyan-400">{addr.type}</span>
                  </ConditionalRender>
                </div>
                <button
                  onClick={() => copy(`${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`, `addr-${i}`)}
                  className="p-2 hover:bg-white/10 rounded"
                >
                  {copied === `addr-${i}` ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/40" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </ConditionalRender>
    </div>
  );
}

// Business Result Card
export function BusinessResultCard({ data }: { data: Record<string, unknown> }) {
  const rawBusinesses = data.businesses || data.data || [data];
  const businesses = (Array.isArray(rawBusinesses) ? rawBusinesses : [rawBusinesses]) as Array<{
    name?: string;
    entityType?: string;
    status?: string;
    stateOfFormation?: string;
    fileNumber?: string;
    filingDate?: string;
    registeredAgent?: string;
    principalAddress?: string;
    officers?: Array<{ name: string; title?: string }>;
    source?: string;
    sourceUrl?: string;
  }>;

  if (businesses.length === 0) {
    return <p className="text-white/50 text-sm mt-4">No business records found</p>;
  }

  return (
    <div className="space-y-4 mt-4">
      {businesses.map((biz, index) => (
        <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-cyan-400" />
              <div>
                <h3 className="text-white font-semibold">{biz.name || 'Unknown'}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                    {biz.entityType || 'Entity'}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    biz.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {biz.status || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
            <ConditionalRender condition={biz.sourceUrl}>
              <a
                href={biz.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-white/50" />
              </a>
            </ConditionalRender>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <ConditionalRender condition={biz.stateOfFormation}>
              <div>
                <p className="text-xs text-white/40">State</p>
                <p className="text-white text-sm">{biz.stateOfFormation}</p>
              </div>
            </ConditionalRender>
            <ConditionalRender condition={biz.fileNumber}>
              <div>
                <p className="text-xs text-white/40">File #</p>
                <p className="text-white text-sm">{biz.fileNumber}</p>
              </div>
            </ConditionalRender>
            <ConditionalRender condition={biz.filingDate}>
              <div>
                <p className="text-xs text-white/40">Filed</p>
                <p className="text-white text-sm">{biz.filingDate}</p>
              </div>
            </ConditionalRender>
            <ConditionalRender condition={biz.registeredAgent}>
              <div>
                <p className="text-xs text-white/40">Registered Agent</p>
                <p className="text-white text-sm">{biz.registeredAgent}</p>
              </div>
            </ConditionalRender>
          </div>

          <ConditionalRender condition={biz.officers && biz.officers.length > 0}>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-white/40 mb-2">Officers/Directors</p>
              <div className="flex flex-wrap gap-2">
                {(biz.officers || []).map((officer, i) => (
                  <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-sm text-white">
                    {officer.name} {officer.title ? <span className="text-white/50">({officer.title})</span> : null}
                  </span>
                ))}
              </div>
            </div>
          </ConditionalRender>

          <ConditionalRender condition={biz.source}>
            <div className="mt-3 text-xs text-white/30">
              Source: {biz.source}
            </div>
          </ConditionalRender>
        </div>
      ))}
    </div>
  );
}

// Phone Lookup Result
export function PhoneResultCard({ data }: { data: Record<string, unknown> }) {
  const { copied, copy } = useCopyToClipboard();
  const searchUrls = Array.isArray(data.searchUrls) ? data.searchUrls as Array<{ name: string; url: string }> : [];
  const location = data.location as Record<string, unknown> | undefined;

  return (
    <div className="mt-4 space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <Phone className="w-6 h-6 text-green-400" />
          <div>
            <p className="text-white font-medium">{String(data.formatted || data.phone || 'Unknown')}</p>
            <div className="flex items-center gap-2 mt-1">
              <ConditionalRender condition={data.lineType}>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                  {String(data.lineType)}
                </span>
              </ConditionalRender>
              <ConditionalRender condition={data.carrier}>
                <span className="text-xs text-white/50">{String(data.carrier)}</span>
              </ConditionalRender>
            </div>
          </div>
          <button
            onClick={() => copy(String(data.formatted || data.phone), 'phone')}
            className="ml-auto p-2 hover:bg-white/10 rounded"
          >
            {copied === 'phone' ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-white/40" />
            )}
          </button>
        </div>

        <ConditionalRender condition={location}>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <MapPin className="w-4 h-4 text-white/50" />
            <div>
              <p className="text-white text-sm">
                {String(location?.city || '')}, {String(location?.state || '')}
              </p>
              <ConditionalRender condition={location?.timezone}>
                <p className="text-xs text-white/40">{String(location?.timezone)}</p>
              </ConditionalRender>
            </div>
          </div>
        </ConditionalRender>
      </div>

      <ConditionalRender condition={searchUrls.length > 0}>
        <SearchLinksGrid links={searchUrls.map(u => ({ name: u.name, url: u.url, category: 'Phone Lookup' }))} />
      </ConditionalRender>
    </div>
  );
}

// Email Lookup Result
export function EmailResultCard({ data }: { data: Record<string, unknown> }) {
  const { copied, copy } = useCopyToClipboard();
  const searchUrls = Array.isArray(data.searchUrls) ? data.searchUrls as Array<{ name: string; url: string }> : [];

  return (
    <div className="mt-4 space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Mail className="w-6 h-6 text-blue-400" />
          <div className="flex-1">
            <p className="text-white font-medium">{String(data.email || 'Unknown')}</p>
            <ConditionalRender condition={data.domain}>
              <p className="text-xs text-white/50">Domain: {String(data.domain)}</p>
            </ConditionalRender>
          </div>
          <button
            onClick={() => copy(String(data.email), 'email')}
            className="p-2 hover:bg-white/10 rounded"
          >
            {copied === 'email' ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-white/40" />
            )}
          </button>
        </div>

        <ConditionalRender condition={data.gravatarUrl}>
          <div className="mt-4 flex items-center gap-3">
            <img src={String(data.gravatarUrl)} alt="Gravatar" className="w-12 h-12 rounded-full" />
            <span className="text-sm text-white/50">Gravatar Profile Found</span>
          </div>
        </ConditionalRender>
      </div>

      <ConditionalRender condition={searchUrls.length > 0}>
        <SearchLinksGrid links={searchUrls.map(u => ({ name: u.name, url: u.url, category: 'Email Lookup' }))} />
      </ConditionalRender>
    </div>
  );
}

// Vehicle/VIN Result
export function VehicleResultCard({ data }: { data: Record<string, unknown> }) {
  const decoded = data.decoded as Record<string, unknown> | undefined;
  const recalls = data.recalls as Record<string, unknown> | undefined;
  const complaints = data.complaints as Record<string, unknown> | undefined;
  const vehicle = decoded?.data as Record<string, unknown> | undefined;
  const recallList = Array.isArray(recalls?.recalls) ? recalls.recalls as Array<{ component?: string; summary?: string; consequence?: string }> : [];
  const complaintList = Array.isArray(complaints?.complaints) ? complaints.complaints as Array<{ component?: string; summary?: string }> : [];

  return (
    <div className="mt-4 space-y-4">
      {/* Vehicle Info */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <Car className="w-6 h-6 text-orange-400" />
          <div>
            <p className="text-white font-semibold">
              {String(vehicle?.year || '')} {String(vehicle?.make || '')} {String(vehicle?.model || '')}
            </p>
            <ConditionalRender condition={vehicle?.trim}>
              <p className="text-sm text-white/50">{String(vehicle?.trim)}</p>
            </ConditionalRender>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <ConditionalRender condition={vehicle?.vin}>
            <div>
              <p className="text-xs text-white/40">VIN</p>
              <p className="text-white text-sm font-mono">{String(vehicle?.vin)}</p>
            </div>
          </ConditionalRender>
          <ConditionalRender condition={vehicle?.vehicleType}>
            <div>
              <p className="text-xs text-white/40">Type</p>
              <p className="text-white text-sm">{String(vehicle?.vehicleType)}</p>
            </div>
          </ConditionalRender>
          <ConditionalRender condition={vehicle?.bodyClass}>
            <div>
              <p className="text-xs text-white/40">Body</p>
              <p className="text-white text-sm">{String(vehicle?.bodyClass)}</p>
            </div>
          </ConditionalRender>
          <ConditionalRender condition={vehicle?.engineCylinders}>
            <div>
              <p className="text-xs text-white/40">Engine</p>
              <p className="text-white text-sm">{String(vehicle?.engineCylinders)} cyl</p>
            </div>
          </ConditionalRender>
          <ConditionalRender condition={vehicle?.fuelType}>
            <div>
              <p className="text-xs text-white/40">Fuel</p>
              <p className="text-white text-sm">{String(vehicle?.fuelType)}</p>
            </div>
          </ConditionalRender>
          <ConditionalRender condition={vehicle?.plantCountry}>
            <div>
              <p className="text-xs text-white/40">Made In</p>
              <p className="text-white text-sm">{String(vehicle?.plantCountry)}</p>
            </div>
          </ConditionalRender>
        </div>
      </div>

      {/* Recalls */}
      <ConditionalRender condition={recallList.length > 0}>
        <CollapsibleSection
          title="Recalls"
          icon={AlertTriangle}
          badge={<span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">{recallList.length} found</span>}
        >
          <div className="space-y-2 mt-3">
            {recallList.map((recall, i) => (
              <div key={i} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-white font-medium">{recall.component || 'Unknown Component'}</p>
                <p className="text-sm text-white/70 mt-1">{recall.summary || ''}</p>
                <ConditionalRender condition={recall.consequence}>
                  <p className="text-xs text-red-400 mt-2">Consequence: {recall.consequence}</p>
                </ConditionalRender>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </ConditionalRender>

      {/* Complaints */}
      <ConditionalRender condition={complaintList.length > 0}>
        <CollapsibleSection
          title="Complaints"
          icon={FileText}
          badge={<span className="text-xs text-white/40">{complaintList.length} found</span>}
        >
          <div className="space-y-2 mt-3">
            {complaintList.slice(0, 5).map((complaint, i) => (
              <div key={i} className="p-3 bg-white/5 rounded-lg">
                <p className="text-white text-sm">{complaint.component || 'Unknown'}</p>
                <p className="text-xs text-white/50 mt-1">{complaint.summary || ''}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </ConditionalRender>
    </div>
  );
}

// Court Records Result
export function CourtResultCard({ data }: { data: Record<string, unknown> }) {
  const records = Array.isArray(data.records) ? data.records as Array<Record<string, unknown>> : [];
  const searchLinks = Array.isArray(data.searchLinks) ? data.searchLinks as Array<{ name: string; url: string; category: string }> : [];

  return (
    <div className="mt-4 space-y-4">
      {records.length > 0 ? (
        <CollapsibleSection title="Court Records" icon={Scale}>
          <div className="space-y-2 mt-3">
            {records.map((record, i) => (
              <div key={i} className="p-3 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-white font-medium">{String(record.caseNumber || 'Unknown')}</p>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    record.status === 'closed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {String(record.status || 'Unknown')}
                  </span>
                </div>
                <p className="text-sm text-white/70">{String(record.court || '')}</p>
                <ConditionalRender condition={record.filingDate}>
                  <p className="text-xs text-white/40 mt-1">Filed: {String(record.filingDate)}</p>
                </ConditionalRender>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      ) : (
        <p className="text-white/50 text-sm">No direct court records found. Use the search links below to search court databases.</p>
      )}

      <ConditionalRender condition={searchLinks.length > 0}>
        <SearchLinksGrid links={searchLinks} />
      </ConditionalRender>
    </div>
  );
}

// Property Records Result
export function PropertyResultCard({ data }: { data: Record<string, unknown> }) {
  const properties = Array.isArray(data.properties) ? data.properties as Array<Record<string, unknown>> : [];
  const searchLinks = Array.isArray(data.searchLinks) ? data.searchLinks as Array<{ name: string; url: string; category: string }> : [];

  return (
    <div className="mt-4 space-y-4">
      <ConditionalRender condition={properties.length > 0}>
        <CollapsibleSection title="Properties" icon={Home}>
          <div className="space-y-3 mt-3">
            {properties.map((prop, i) => (
              <div key={i} className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-start gap-3">
                  <Home className="w-5 h-5 text-cyan-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-white font-medium">{String(prop.address || 'Unknown Address')}</p>
                    <p className="text-sm text-white/50">{String(prop.city || '')}, {String(prop.state || '')} {String(prop.zip || '')}</p>

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <ConditionalRender condition={prop.assessedValue}>
                        <div>
                          <p className="text-xs text-white/40">Assessed Value</p>
                          <p className="text-white">${Number(prop.assessedValue).toLocaleString()}</p>
                        </div>
                      </ConditionalRender>
                      <ConditionalRender condition={prop.owner}>
                        <div>
                          <p className="text-xs text-white/40">Owner</p>
                          <p className="text-white">{String(prop.owner)}</p>
                        </div>
                      </ConditionalRender>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </ConditionalRender>

      <ConditionalRender condition={searchLinks.length > 0}>
        <SearchLinksGrid links={searchLinks} />
      </ConditionalRender>
    </div>
  );
}

// Assets Result Card
export function AssetsResultCard({ data }: { data: Record<string, unknown> }) {
  const aircraft = Array.isArray(data.aircraft) ? data.aircraft as Array<Record<string, unknown>> : [];
  const vessels = Array.isArray(data.vessels) ? data.vessels as Array<Record<string, unknown>> : [];
  const searchLinks = Array.isArray(data.searchLinks) ? data.searchLinks as Array<{ name: string; url: string; category: string }> : [];

  return (
    <div className="mt-4 space-y-4">
      <ConditionalRender condition={aircraft.length > 0}>
        <CollapsibleSection title="Aircraft" icon={Plane}>
          <div className="space-y-2 mt-3">
            {aircraft.map((a, i) => (
              <div key={i} className="p-3 bg-white/5 rounded-lg flex items-center gap-3">
                <Plane className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-white">{String(a.model || 'Unknown')}</p>
                  <p className="text-xs text-white/50">N-Number: {String(a.nNumber || 'N/A')}</p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </ConditionalRender>

      <ConditionalRender condition={vessels.length > 0}>
        <CollapsibleSection title="Vessels" icon={Ship}>
          <div className="space-y-2 mt-3">
            {vessels.map((v, i) => (
              <div key={i} className="p-3 bg-white/5 rounded-lg flex items-center gap-3">
                <Ship className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-white">{String(v.name || 'Unknown')}</p>
                  <p className="text-xs text-white/50">Hull: {String(v.hullNumber || 'N/A')}</p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </ConditionalRender>

      <ConditionalRender condition={searchLinks.length > 0}>
        <SearchLinksGrid links={searchLinks} />
      </ConditionalRender>
    </div>
  );
}

// Licenses Result Card
export function LicensesResultCard({ data }: { data: Record<string, unknown> }) {
  const licenses = Array.isArray(data.licenses) ? data.licenses as Array<Record<string, unknown>> : [];
  const searchUrls = Array.isArray(data.searchUrls) ? data.searchUrls as Array<{ name: string; url: string }> : [];

  return (
    <div className="mt-4 space-y-4">
      <ConditionalRender condition={licenses.length > 0}>
        <CollapsibleSection title="Professional Licenses" icon={BadgeCheck}>
          <div className="space-y-2 mt-3">
            {licenses.map((lic, i) => (
              <div key={i} className="p-3 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-green-400" />
                    <p className="text-white font-medium">{String(lic.type || 'Unknown')}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    lic.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {String(lic.status || 'Unknown')}
                  </span>
                </div>
                <p className="text-sm text-white/50 mt-1">License #: {String(lic.number || 'N/A')}</p>
                <ConditionalRender condition={lic.expirationDate}>
                  <p className="text-xs text-white/40">Expires: {String(lic.expirationDate)}</p>
                </ConditionalRender>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </ConditionalRender>

      <ConditionalRender condition={searchUrls.length > 0}>
        <SearchLinksGrid links={searchUrls.map(l => ({ ...l, category: 'Professional Licenses' }))} />
      </ConditionalRender>
    </div>
  );
}

// Relatives/Associates Result
export function RelativesResultCard({ data }: { data: Record<string, unknown> }) {
  const relatives = Array.isArray(data.relatives) ? data.relatives as Array<Record<string, unknown>> : [];
  const associates = Array.isArray(data.associates) ? data.associates as Array<Record<string, unknown>> : [];
  const searchLinks = Array.isArray(data.searchLinks) ? data.searchLinks as Array<{ name: string; url: string; category: string }> : [];

  return (
    <div className="mt-4 space-y-4">
      <ConditionalRender condition={relatives.length > 0}>
        <CollapsibleSection title="Possible Relatives" icon={Users}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
            {relatives.map((rel, i) => (
              <div key={i} className="p-3 bg-white/5 rounded-lg flex items-center gap-3">
                <User className="w-5 h-5 text-pink-400" />
                <div>
                  <p className="text-white">{String(rel.name || 'Unknown')}</p>
                  <p className="text-xs text-white/50">{String(rel.relationship || 'Relative')}</p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </ConditionalRender>

      <ConditionalRender condition={associates.length > 0}>
        <CollapsibleSection title="Associates" icon={Briefcase} defaultOpen={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
            {associates.map((assoc, i) => (
              <div key={i} className="p-3 bg-white/5 rounded-lg flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-white">{String(assoc.name || 'Unknown')}</p>
                  <p className="text-xs text-white/50">{String(assoc.connection || 'Associate')}</p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </ConditionalRender>

      <ConditionalRender condition={searchLinks.length > 0}>
        <SearchLinksGrid links={searchLinks} />
      </ConditionalRender>
    </div>
  );
}

// Criminal Records Result
export function CriminalResultCard({ data }: { data: Record<string, unknown> }) {
  const records = Array.isArray(data.records) ? data.records as Array<Record<string, unknown>> : [];
  const searchLinks = Array.isArray(data.searchLinks) ? data.searchLinks as Array<{ name: string; url: string; category: string }> : [];
  const warnings = Array.isArray(data.warnings) ? data.warnings as string[] : [];

  return (
    <div className="mt-4 space-y-4">
      <ConditionalRender condition={warnings.length > 0}>
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <p className="text-yellow-400 text-sm">{warnings[0]}</p>
          </div>
        </div>
      </ConditionalRender>

      <ConditionalRender condition={records.length > 0}>
        <CollapsibleSection title="Criminal Records" icon={Shield}>
          <div className="space-y-2 mt-3">
            {records.map((rec, i) => (
              <div key={i} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-white font-medium">{String(rec.offense || 'Unknown')}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                  <ConditionalRender condition={rec.date}>
                    <span>Date: {String(rec.date)}</span>
                  </ConditionalRender>
                  <ConditionalRender condition={rec.jurisdiction}>
                    <span>Jurisdiction: {String(rec.jurisdiction)}</span>
                  </ConditionalRender>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </ConditionalRender>

      <ConditionalRender condition={searchLinks.length > 0}>
        <SearchLinksGrid links={searchLinks} />
      </ConditionalRender>
    </div>
  );
}

// Social Profiles Result
export function SocialResultCard({ data }: { data: Record<string, unknown> }) {
  const profiles = Array.isArray(data.profiles) ? data.profiles as Array<Record<string, unknown>> : [];
  const searchLinks = Array.isArray(data.searchLinks) ? data.searchLinks as Array<{ platform: string; url: string }> : [];

  return (
    <div className="mt-4 space-y-4">
      <ConditionalRender condition={profiles.length > 0}>
        <CollapsibleSection title="Social Profiles Found" icon={Globe}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
            {profiles.map((profile, i) => (
              <a
                key={i}
                href={String(profile.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white/5 rounded-lg flex items-center gap-3 hover:bg-white/10 transition-colors"
              >
                <Globe className="w-5 h-5 text-cyan-400" />
                <div className="flex-1">
                  <p className="text-white">{String(profile.platform || 'Unknown')}</p>
                  <p className="text-xs text-white/50">{String(profile.username || '')}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-white/30" />
              </a>
            ))}
          </div>
        </CollapsibleSection>
      </ConditionalRender>

      <ConditionalRender condition={searchLinks.length > 0}>
        <SearchLinksGrid links={searchLinks.map(l => ({ name: l.platform, url: l.url, category: 'Social Media' }))} />
      </ConditionalRender>
    </div>
  );
}

// Employment History Result
export function EmploymentResultCard({ data }: { data: Record<string, unknown> }) {
  const employment = Array.isArray(data.employment) ? data.employment as Array<Record<string, unknown>> : [];
  const searchLinks = Array.isArray(data.searchLinks) ? data.searchLinks as Array<{ name: string; url: string; category: string }> : [];

  return (
    <div className="mt-4 space-y-4">
      <ConditionalRender condition={employment.length > 0}>
        <CollapsibleSection title="Employment History" icon={Briefcase}>
          <div className="space-y-3 mt-3">
            {employment.map((job, i) => (
              <div key={i} className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">{String(job.title || 'Unknown Position')}</p>
                    <p className="text-cyan-400 text-sm">{String(job.company || 'Unknown Company')}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-white/50">
                      <Clock className="w-3 h-3" />
                      <span>{String(job.startDate || '?')} - {String(job.endDate || 'Present')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </ConditionalRender>

      <ConditionalRender condition={searchLinks.length > 0}>
        <SearchLinksGrid links={searchLinks} />
      </ConditionalRender>
    </div>
  );
}

// Address History Result
export function AddressHistoryResultCard({ data }: { data: Record<string, unknown> }) {
  const addresses = Array.isArray(data.addresses) ? data.addresses as Array<Record<string, unknown>> : [];
  const searchLinks = Array.isArray(data.searchLinks) ? data.searchLinks as Array<{ name: string; url: string; category: string }> : [];

  return (
    <div className="mt-4 space-y-4">
      <ConditionalRender condition={addresses.length > 0}>
        <CollapsibleSection title="Address History" icon={MapPin}>
          <div className="relative mt-3 ml-2">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-white/10" />

            <div className="space-y-4">
              {addresses.map((addr, i) => (
                <div key={i} className="pl-6 relative">
                  <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-cyan-500/20 border-2 border-cyan-400" />
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-white">{String(addr.street || 'Unknown')}</p>
                    <p className="text-sm text-white/50">
                      {String(addr.city || '')}, {String(addr.state || '')} {String(addr.zip || '')}
                    </p>
                    <ConditionalRender condition={addr.startDate || addr.endDate}>
                      <p className="text-xs text-white/40 mt-1">
                        {String(addr.startDate || '?')} - {String(addr.endDate || 'Present')}
                      </p>
                    </ConditionalRender>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>
      </ConditionalRender>

      <ConditionalRender condition={searchLinks.length > 0}>
        <SearchLinksGrid links={searchLinks} />
      </ConditionalRender>
    </div>
  );
}

// Search Links Grid
export function SearchLinksGrid({ links }: { links: Array<{ name: string; url: string; category: string }> }) {
  // Group by category
  const grouped = links.reduce((acc, link) => {
    if (!acc[link.category]) acc[link.category] = [];
    acc[link.category].push(link);
    return acc;
  }, {} as Record<string, typeof links>);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, categoryLinks]) => (
        <div key={category}>
          <p className="text-xs text-white/40 mb-2">{category}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {categoryLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-between hover:from-cyan-500/20 hover:to-blue-500/20 transition-all group"
              >
                <span className="text-white text-sm">{link.name}</span>
                <ExternalLink className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Generic Result Display - Auto-detects type
export function ResultDisplay({ type, data }: { type: string; data: Record<string, unknown> }) {
  switch (type) {
    case 'person':
      return <PersonResultCard data={data} />;
    case 'business':
      return <BusinessResultCard data={data} />;
    case 'phone':
      return <PhoneResultCard data={data} />;
    case 'email':
      return <EmailResultCard data={data} />;
    case 'vehicle':
    case 'vin':
      return <VehicleResultCard data={data} />;
    case 'court':
      return <CourtResultCard data={data} />;
    case 'property':
      return <PropertyResultCard data={data} />;
    case 'assets':
      return <AssetsResultCard data={data} />;
    case 'licenses':
      return <LicensesResultCard data={data} />;
    case 'relatives':
      return <RelativesResultCard data={data} />;
    case 'criminal':
      return <CriminalResultCard data={data} />;
    case 'social':
      return <SocialResultCard data={data} />;
    case 'employment':
      return <EmploymentResultCard data={data} />;
    case 'address':
      return <AddressHistoryResultCard data={data} />;
    default:
      // Fallback: show raw data + search links
      const searchLinks = Array.isArray(data.searchLinks) ? data.searchLinks as Array<{ name: string; url: string; category: string }> : [];
      return (
        <div className="mt-4 space-y-4">
          <pre className="p-4 bg-white/5 rounded-lg text-xs text-white/70 overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
          <ConditionalRender condition={searchLinks.length > 0}>
            <SearchLinksGrid links={searchLinks} />
          </ConditionalRender>
        </div>
      );
  }
}
