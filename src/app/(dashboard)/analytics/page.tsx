"use client";

import * as React from "react";
import { Header } from "@/components/layout/header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStoredLeads, getUserConfig } from "@/lib/store";
import { LeadRecord } from "@/lib/schemas";

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
}

interface SignalPerformance {
  signalId: string;
  signalName: string;
  count: number;
  avgScore: number;
  conversionRate: number;
}

export default function AnalyticsPage() {
  const [leads, setLeads] = React.useState<LeadRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const storedLeads = getStoredLeads();
    setLeads(storedLeads);
    setIsLoading(false);
  }, []);

  // Calculate metrics
  const metrics = React.useMemo(() => {
    const total = leads.length;
    const newLeads = leads.filter((l) => l.status === "new").length;
    const savedLeads = leads.filter((l) => l.status === "saved").length;
    const skippedLeads = leads.filter((l) => l.status === "skip").length;
    const contactedLeads = leads.filter((l) => l.status === "contacted").length;

    const avgScore = total > 0
      ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / total)
      : 0;

    const highScoreLeads = leads.filter((l) => l.score >= 80).length;
    const highScoreRate = total > 0 ? Math.round((highScoreLeads / total) * 100) : 0;

    const conversionRate = savedLeads + contactedLeads > 0 && total > 0
      ? Math.round(((savedLeads + contactedLeads) / total) * 100)
      : 0;

    return {
      total,
      newLeads,
      savedLeads,
      skippedLeads,
      contactedLeads,
      avgScore,
      highScoreLeads,
      highScoreRate,
      conversionRate,
    };
  }, [leads]);

  // Signal performance analysis
  const signalPerformance = React.useMemo(() => {
    const signalMap = new Map<string, { count: number; totalScore: number; saved: number }>();

    leads.forEach((lead) => {
      lead.triggeredSignals.forEach((signal) => {
        const existing = signalMap.get(signal.signalName) || { count: 0, totalScore: 0, saved: 0 };
        existing.count++;
        existing.totalScore += lead.score;
        if (lead.status === "saved" || lead.status === "contacted") {
          existing.saved++;
        }
        signalMap.set(signal.signalName, existing);
      });
    });

    const performance: SignalPerformance[] = [];
    signalMap.forEach((data, signalName) => {
      performance.push({
        signalId: signalName.toLowerCase().replace(/\s+/g, "_"),
        signalName,
        count: data.count,
        avgScore: Math.round(data.totalScore / data.count),
        conversionRate: Math.round((data.saved / data.count) * 100),
      });
    });

    return performance.sort((a, b) => b.count - a.count).slice(0, 10);
  }, [leads]);

  // Score distribution
  const scoreDistribution = React.useMemo(() => {
    const distribution = {
      excellent: leads.filter((l) => l.score >= 80).length,
      good: leads.filter((l) => l.score >= 60 && l.score < 80).length,
      fair: leads.filter((l) => l.score >= 40 && l.score < 60).length,
      low: leads.filter((l) => l.score < 40).length,
    };
    return distribution;
  }, [leads]);

  // Industry breakdown
  const industryBreakdown = React.useMemo(() => {
    const industries = new Map<string, number>();
    leads.forEach((lead) => {
      if (lead.industry) {
        industries.set(lead.industry, (industries.get(lead.industry) || 0) + 1);
      }
    });
    return Array.from(industries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [leads]);

  // Recent activity (simulated based on status changes)
  const recentActivity = React.useMemo(() => {
    return leads
      .filter((l) => l.status !== "new")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [leads]);

  const metricCards: MetricCard[] = [
    {
      title: "Total Leads",
      value: metrics.total,
      change: 12,
      changeLabel: "vs last week",
      icon: Target,
      trend: "up",
    },
    {
      title: "Saved Rate",
      value: `${metrics.conversionRate}%`,
      change: 5,
      changeLabel: "vs last week",
      icon: CheckCircle,
      trend: "up",
    },
    {
      title: "Avg Score",
      value: metrics.avgScore,
      change: -2,
      changeLabel: "vs last week",
      icon: Zap,
      trend: "down",
    },
    {
      title: "High Quality",
      value: `${metrics.highScoreRate}%`,
      changeLabel: "score ≥80",
      icon: TrendingUp,
      trend: "neutral",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <Header
          title="Analytics"
          subtitle="Loading insights..."
          showSearch={false}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-[--foreground-muted]">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Analytics"
        subtitle={`Insights from ${metrics.total} leads`}
        showSearch={false}
      />

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <section>
            <h2 className="text-sm font-medium uppercase tracking-wider text-[--foreground-subtle] mb-4">
              Key Metrics
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {metricCards.map((metric) => (
                <Card key={metric.title}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-[--foreground-muted]">{metric.title}</p>
                        <p className="text-2xl font-bold mt-1">{metric.value}</p>
                        {metric.change !== undefined && (
                          <div className="flex items-center gap-1 mt-1">
                            {metric.trend === "up" ? (
                              <ArrowUpRight className="h-3 w-3 text-[--score-excellent]" />
                            ) : metric.trend === "down" ? (
                              <ArrowDownRight className="h-3 w-3 text-[--priority-high]" />
                            ) : null}
                            <span
                              className={cn(
                                "text-xs",
                                metric.trend === "up"
                                  ? "text-[--score-excellent]"
                                  : metric.trend === "down"
                                  ? "text-[--priority-high]"
                                  : "text-[--foreground-subtle]"
                              )}
                            >
                              {metric.change > 0 ? "+" : ""}
                              {metric.change}% {metric.changeLabel}
                            </span>
                          </div>
                        )}
                        {!metric.change && metric.changeLabel && (
                          <p className="text-xs text-[--foreground-subtle] mt-1">
                            {metric.changeLabel}
                          </p>
                        )}
                      </div>
                      <div className="p-2 rounded-lg bg-[--background-tertiary]">
                        <metric.icon className="h-5 w-5 text-[--accent]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Funnel & Distribution */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Lead Funnel
                </CardTitle>
                <CardDescription>Lead progression through stages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>New</span>
                      <span className="font-medium">{metrics.newLeads}</span>
                    </div>
                    <Progress
                      value={metrics.total > 0 ? (metrics.newLeads / metrics.total) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[--score-excellent]">Saved</span>
                      <span className="font-medium">{metrics.savedLeads}</span>
                    </div>
                    <Progress
                      value={metrics.total > 0 ? (metrics.savedLeads / metrics.total) * 100 : 0}
                      className="h-2 [&>div]:bg-[--score-excellent]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[--accent]">Contacted</span>
                      <span className="font-medium">{metrics.contactedLeads}</span>
                    </div>
                    <Progress
                      value={metrics.total > 0 ? (metrics.contactedLeads / metrics.total) * 100 : 0}
                      className="h-2 [&>div]:bg-[--accent]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[--foreground-subtle]">Skipped</span>
                      <span className="font-medium">{metrics.skippedLeads}</span>
                    </div>
                    <Progress
                      value={metrics.total > 0 ? (metrics.skippedLeads / metrics.total) * 100 : 0}
                      className="h-2 [&>div]:bg-[--foreground-subtle]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Score Distribution
                </CardTitle>
                <CardDescription>Lead quality breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[--score-excellent]" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span>Excellent (80+)</span>
                        <span className="font-medium">{scoreDistribution.excellent}</span>
                      </div>
                      <Progress
                        value={metrics.total > 0 ? (scoreDistribution.excellent / metrics.total) * 100 : 0}
                        className="h-1.5 mt-1 [&>div]:bg-[--score-excellent]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[--score-good]" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span>Good (60-79)</span>
                        <span className="font-medium">{scoreDistribution.good}</span>
                      </div>
                      <Progress
                        value={metrics.total > 0 ? (scoreDistribution.good / metrics.total) * 100 : 0}
                        className="h-1.5 mt-1 [&>div]:bg-[--score-good]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[--score-fair]" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span>Fair (40-59)</span>
                        <span className="font-medium">{scoreDistribution.fair}</span>
                      </div>
                      <Progress
                        value={metrics.total > 0 ? (scoreDistribution.fair / metrics.total) * 100 : 0}
                        className="h-1.5 mt-1 [&>div]:bg-[--score-fair]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[--score-low]" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span>Low (&lt;40)</span>
                        <span className="font-medium">{scoreDistribution.low}</span>
                      </div>
                      <Progress
                        value={metrics.total > 0 ? (scoreDistribution.low / metrics.total) * 100 : 0}
                        className="h-1.5 mt-1 [&>div]:bg-[--score-low]"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Signal Performance & Industry */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Performing Signals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Top Signals
                </CardTitle>
                <CardDescription>Most frequently triggered signals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {signalPerformance.length === 0 ? (
                    <p className="text-sm text-[--foreground-muted]">No signal data yet</p>
                  ) : (
                    signalPerformance.map((signal, idx) => (
                      <div key={signal.signalId} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-[--foreground-subtle] w-5">
                          #{idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{signal.signalName}</p>
                          <div className="flex items-center gap-3 text-xs text-[--foreground-muted]">
                            <span>{signal.count} leads</span>
                            <span>Avg: {signal.avgScore}</span>
                            <span className="text-[--score-excellent]">
                              {signal.conversionRate}% saved
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {signal.count}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Industry Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Industry Breakdown
                </CardTitle>
                <CardDescription>Leads by industry vertical</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {industryBreakdown.length === 0 ? (
                    <p className="text-sm text-[--foreground-muted]">No industry data yet</p>
                  ) : (
                    industryBreakdown.map(([industry, count]) => (
                      <div key={industry} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{industry}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                          <Progress
                            value={(count / metrics.total) * 100}
                            className="h-1.5"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest lead status changes</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-[--foreground-muted]">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[--background-tertiary]"
                    >
                      {lead.status === "saved" ? (
                        <CheckCircle className="h-4 w-4 text-[--score-excellent]" />
                      ) : lead.status === "contacted" ? (
                        <CheckCircle className="h-4 w-4 text-[--accent]" />
                      ) : (
                        <XCircle className="h-4 w-4 text-[--foreground-subtle]" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lead.companyName}</p>
                        <p className="text-xs text-[--foreground-muted]">
                          {lead.status === "saved"
                            ? "Saved to pipeline"
                            : lead.status === "contacted"
                            ? "Marked as contacted"
                            : "Skipped"}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            lead.status === "saved"
                              ? "high"
                              : lead.status === "contacted"
                              ? "medium"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {lead.status}
                        </Badge>
                        <p className="text-xs text-[--foreground-subtle] mt-1">
                          {new Date(lead.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
