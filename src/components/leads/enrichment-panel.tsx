"use client";

import * as React from "react";
import {
  Building2,
  Users,
  Globe,
  DollarSign,
  Linkedin,
  Twitter,
  Github,
  ExternalLink,
  Code,
  Server,
  Briefcase,
  MapPin,
  Calendar,
  TrendingUp,
  Award,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CompanyEnrichment {
  overview: {
    foundedYear?: number;
    employeeCount?: string;
    employeeGrowth?: number;
    funding?: {
      total: string;
      lastRound: string;
      lastRoundDate: string;
    };
    revenue?: string;
    headquarters?: string;
    industry?: string;
    description?: string;
  };
  techStack: string[];
  socialProfiles: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  };
  recentNews: Array<{
    title: string;
    date: string;
    url: string;
  }>;
  competitors: string[];
  keyPeople: Array<{
    name: string;
    title: string;
    linkedin?: string;
  }>;
}

interface EnrichmentPanelProps {
  companyName: string;
  domain: string;
  className?: string;
}

// Generate demo enrichment data
function generateDemoEnrichment(companyName: string): CompanyEnrichment {
  return {
    overview: {
      foundedYear: 2018 + Math.floor(Math.random() * 4),
      employeeCount: `${50 + Math.floor(Math.random() * 200)}-${200 + Math.floor(Math.random() * 300)}`,
      employeeGrowth: 15 + Math.floor(Math.random() * 30),
      funding: {
        total: `$${20 + Math.floor(Math.random() * 80)}M`,
        lastRound: ["Series A", "Series B", "Series C"][Math.floor(Math.random() * 3)],
        lastRoundDate: "Q4 2024",
      },
      revenue: `$${5 + Math.floor(Math.random() * 25)}M ARR`,
      headquarters: ["San Francisco, CA", "New York, NY", "Austin, TX", "Boston, MA"][Math.floor(Math.random() * 4)],
      industry: "Enterprise Software",
      description: `${companyName} is a leading provider of AI-powered solutions for modern businesses, helping teams work smarter and more efficiently.`,
    },
    techStack: [
      "React",
      "Node.js",
      "AWS",
      "PostgreSQL",
      "TypeScript",
      "Kubernetes",
      "Redis",
      "GraphQL",
    ].slice(0, 4 + Math.floor(Math.random() * 4)),
    socialProfiles: {
      linkedin: `https://linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, "")}`,
      twitter: `https://twitter.com/${companyName.toLowerCase().replace(/\s+/g, "")}`,
      github: `https://github.com/${companyName.toLowerCase().replace(/\s+/g, "")}`,
      website: `https://${companyName.toLowerCase().replace(/\s+/g, "")}.com`,
    },
    recentNews: [
      {
        title: `${companyName} Announces New AI Features`,
        date: "2 days ago",
        url: "#",
      },
      {
        title: `${companyName} Expands to European Markets`,
        date: "1 week ago",
        url: "#",
      },
      {
        title: `${companyName} Partners with Industry Leader`,
        date: "2 weeks ago",
        url: "#",
      },
    ],
    competitors: [
      "Competitor A",
      "Competitor B",
      "Competitor C",
    ],
    keyPeople: [
      {
        name: "John Smith",
        title: "CEO & Co-founder",
        linkedin: "#",
      },
      {
        name: "Sarah Johnson",
        title: "VP of Sales",
        linkedin: "#",
      },
      {
        name: "Michael Chen",
        title: "CTO",
        linkedin: "#",
      },
    ],
  };
}

export function EnrichmentPanel({
  companyName,
  domain,
  className,
}: EnrichmentPanelProps) {
  const [enrichment, setEnrichment] = React.useState<CompanyEnrichment | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadEnrichment = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Simulate API call delay
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 500));

    // Generate demo data (in production, this would be an API call)
    const data = generateDemoEnrichment(companyName);
    setEnrichment(data);
    setIsLoading(false);
  }, [companyName]);

  // Load on mount
  React.useEffect(() => {
    loadEnrichment();
  }, [loadEnrichment]);

  if (isLoading) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-[--accent] mb-3" />
        <p className="text-sm text-[--foreground-muted]">
          Enriching company data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <p className="text-sm text-[--priority-high] mb-3">{error}</p>
        <Button variant="outline" size="sm" onClick={loadEnrichment}>
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!enrichment) return null;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Company Overview */}
      <section>
        <h4 className="text-sm font-medium uppercase tracking-wider text-[--foreground-subtle] mb-3">
          Company Overview
        </h4>
        <div className="rounded-lg border border-[--border] bg-[--background-secondary] p-4">
          <p className="text-sm text-[--foreground-muted] mb-4">
            {enrichment.overview.description}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {enrichment.overview.foundedYear && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[--foreground-subtle]" />
                <div>
                  <p className="text-xs text-[--foreground-subtle]">Founded</p>
                  <p className="text-sm font-medium">
                    {enrichment.overview.foundedYear}
                  </p>
                </div>
              </div>
            )}
            {enrichment.overview.employeeCount && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[--foreground-subtle]" />
                <div>
                  <p className="text-xs text-[--foreground-subtle]">Employees</p>
                  <p className="text-sm font-medium">
                    {enrichment.overview.employeeCount}
                    {enrichment.overview.employeeGrowth && (
                      <span className="text-[--score-excellent] text-xs ml-1">
                        +{enrichment.overview.employeeGrowth}%
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
            {enrichment.overview.headquarters && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[--foreground-subtle]" />
                <div>
                  <p className="text-xs text-[--foreground-subtle]">HQ</p>
                  <p className="text-sm font-medium">
                    {enrichment.overview.headquarters}
                  </p>
                </div>
              </div>
            )}
            {enrichment.overview.funding && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[--foreground-subtle]" />
                <div>
                  <p className="text-xs text-[--foreground-subtle]">Funding</p>
                  <p className="text-sm font-medium">
                    {enrichment.overview.funding.total}
                    <span className="text-[--foreground-subtle] text-xs ml-1">
                      ({enrichment.overview.funding.lastRound})
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section>
        <h4 className="text-sm font-medium uppercase tracking-wider text-[--foreground-subtle] mb-3 flex items-center gap-2">
          <Code className="h-4 w-4" />
          Tech Stack
        </h4>
        <div className="flex flex-wrap gap-2">
          {enrichment.techStack.map((tech) => (
            <Badge
              key={tech}
              variant="outline"
              className="bg-[--background-secondary]"
            >
              {tech}
            </Badge>
          ))}
        </div>
      </section>

      {/* Key People */}
      <section>
        <h4 className="text-sm font-medium uppercase tracking-wider text-[--foreground-subtle] mb-3 flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Key People
        </h4>
        <div className="space-y-2">
          {enrichment.keyPeople.map((person, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg border border-[--border] bg-[--background-secondary]"
            >
              <div>
                <p className="text-sm font-medium">{person.name}</p>
                <p className="text-xs text-[--foreground-muted]">
                  {person.title}
                </p>
              </div>
              {person.linkedin && (
                <a
                  href={person.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[--accent] hover:text-[--accent]/80"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Social Profiles */}
      <section>
        <h4 className="text-sm font-medium uppercase tracking-wider text-[--foreground-subtle] mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Social Profiles
        </h4>
        <div className="flex gap-2">
          {enrichment.socialProfiles.linkedin && (
            <a
              href={enrichment.socialProfiles.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-10 w-10 rounded-lg border border-[--border] bg-[--background-secondary] text-[--foreground-muted] hover:text-[--accent] hover:border-[--accent] transition-colors"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          )}
          {enrichment.socialProfiles.twitter && (
            <a
              href={enrichment.socialProfiles.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-10 w-10 rounded-lg border border-[--border] bg-[--background-secondary] text-[--foreground-muted] hover:text-[--accent] hover:border-[--accent] transition-colors"
            >
              <Twitter className="h-5 w-5" />
            </a>
          )}
          {enrichment.socialProfiles.github && (
            <a
              href={enrichment.socialProfiles.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-10 w-10 rounded-lg border border-[--border] bg-[--background-secondary] text-[--foreground-muted] hover:text-[--accent] hover:border-[--accent] transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
          )}
          {enrichment.socialProfiles.website && (
            <a
              href={enrichment.socialProfiles.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-10 w-10 rounded-lg border border-[--border] bg-[--background-secondary] text-[--foreground-muted] hover:text-[--accent] hover:border-[--accent] transition-colors"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          )}
        </div>
      </section>

      {/* Recent News */}
      <section>
        <h4 className="text-sm font-medium uppercase tracking-wider text-[--foreground-subtle] mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Recent News
        </h4>
        <div className="space-y-2">
          {enrichment.recentNews.map((news, idx) => (
            <a
              key={idx}
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg border border-[--border] bg-[--background-secondary] hover:border-[--accent] transition-colors"
            >
              <p className="text-sm font-medium">{news.title}</p>
              <p className="text-xs text-[--foreground-muted] mt-1">
                {news.date}
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* Competitors */}
      <section>
        <h4 className="text-sm font-medium uppercase tracking-wider text-[--foreground-subtle] mb-3 flex items-center gap-2">
          <Award className="h-4 w-4" />
          Known Competitors
        </h4>
        <div className="flex flex-wrap gap-2">
          {enrichment.competitors.map((competitor) => (
            <Badge
              key={competitor}
              variant="outline"
              className="bg-[--background-secondary]"
            >
              {competitor}
            </Badge>
          ))}
        </div>
      </section>
    </div>
  );
}
