"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Inbox, Lightbulb, Settings } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { apiGet } from "@/lib/client";

interface Channel {
  id: string;
  name: string;
}

interface Idea {
  id: string;
  title: string;
  status: string;
  totalScore: number | null;
  pillar?: { id: string; name: string } | null;
}

interface Job {
  id: string;
  jobType: string;
  status: string;
}

interface Script {
  id: string;
}

interface Insights {
  sampleSize: number;
  recommendations: string[];
  topPillars: { pillar: string; avgViews: number; videos: number }[];
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [channelsRes, ideasRes, jobsRes, scriptsRes] = await Promise.all([
          apiGet<{ active: Channel | null }>("/api/channels"),
          apiGet<{ ideas: Idea[] }>("/api/ideas?limit=10"),
          apiGet<{ jobs: Job[] }>("/api/jobs?limit=10"),
          apiGet<{ scripts: Script[] }>("/api/scripts?limit=50"),
        ]);
        if (cancelled) return;
        setActiveChannel(channelsRes.active ?? null);
        setIdeas(ideasRes.ideas ?? []);
        setJobs(jobsRes.jobs ?? []);
        setScripts(scriptsRes.scripts ?? []);

        // Learning loop — fire after channel is known; fails silently if no data.
        if (channelsRes.active) {
          try {
            const insightsRes = await apiGet<{ insights: Insights }>(
              `/api/analytics/channel/${channelsRes.active.id}`,
            );
            if (!cancelled) setInsights(insightsRes.insights);
          } catch {
            // No analytics data yet — expected for new channels.
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const jobsRunning = jobs.filter(
    (j) => j.status === "QUEUED" || j.status === "RUNNING",
  ).length;

  const topIdeas = [...ideas]
    .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0))
    .slice(0, 5);

  const stats = [
    {
      label: "Active Channel",
      value: activeChannel?.name ?? "None",
      hint: activeChannel ? "Currently active" : "No channel configured",
    },
    {
      label: "Idea Backlog",
      value: String(ideas.length),
      hint: "Ideas awaiting review",
    },
    {
      label: "Jobs Running",
      value: String(jobsRunning),
      hint: "Queued or in progress",
    },
    {
      label: "Scripts Ready",
      value: String(scripts.length),
      hint: "Scripts generated",
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Operational overview of the DarkTube OS pipeline, from idea backlog to export."
      />

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Spinner /> Loading dashboard...
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="pb-2">
                  <CardDescription>{stat.label}</CardDescription>
                  <CardTitle className="text-3xl tabular-nums">
                    {stat.value}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{stat.hint}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          {insights && insights.sampleSize > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Learning Loop</CardTitle>
                  <CardDescription>
                    Recommendations derived from {insights.sampleSize} video
                    {insights.sampleSize === 1 ? "" : "s"} with performance data.
                  </CardDescription>
                </div>
                <Link href="/analytics" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Full Report
                  <ArrowRight className="ml-1 inline h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2 text-sm">
                  {insights.recommendations.slice(0, 3).map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <BarChart3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="text-foreground">{r}</span>
                    </li>
                  ))}
                </ul>
                {insights.topPillars.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {insights.topPillars.slice(0, 3).map((p) => (
                      <span
                        key={p.pillar}
                        className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        {p.pillar} · {p.avgViews.toLocaleString()} avg views
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Ideas</CardTitle>
                <CardDescription>
                  Highest-scoring candidate topics in the backlog.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topIdeas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                    <Inbox className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No ideas yet. Run discovery to populate the backlog.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {topIdeas.map((idea) => (
                      <li
                        key={idea.id}
                        className="flex items-center gap-3 py-2.5"
                      >
                        <span className="flex-1 truncate text-sm">
                          {idea.title}
                        </span>
                        <StatusBadge status={idea.status} />
                        <span className="w-10 text-right text-sm font-semibold tabular-nums">
                          {idea.totalScore ?? "-"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Jobs</CardTitle>
                <CardDescription>
                  Latest pipeline jobs and their status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No jobs have run yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {jobs.slice(0, 5).map((job) => (
                      <li
                        key={job.id}
                        className="flex items-center gap-3 py-2.5"
                      >
                        <span className="flex-1 truncate font-mono text-xs text-muted-foreground">
                          {job.jobType}
                        </span>
                        <StatusBadge status={job.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Jump into the most common pipeline entry points.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="sm:flex-1">
                <Link href="/ideas">
                  <Lightbulb className="h-4 w-4" />
                  Discover Ideas
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="sm:flex-1">
                <Link href="/settings">
                  <Settings className="h-4 w-4" />
                  Settings
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
