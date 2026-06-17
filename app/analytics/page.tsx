"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiGet } from "@/lib/client";

interface PillarPerformance {
  pillar: string;
  videos: number;
  avgViews: number;
  avgViewedPct: number;
}
interface DurationBucket {
  label: string;
  videos: number;
  avgViewedPct: number;
}
interface TitlePattern {
  pattern: string;
  videos: number;
  avgViews: number;
}
interface Insights {
  sampleSize: number;
  topPillars: PillarPerformance[];
  durationWindows: DurationBucket[];
  titlePatterns: TitlePattern[];
  recommendations: string[];
}

interface Channel {
  id: string;
  name: string;
}

export default function AnalyticsPage() {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { active } = await apiGet<{ active: Channel | null }>("/api/channels");
        if (!active) {
          setError("No active channel configured.");
          return;
        }
        setChannel(active);
        const { insights } = await apiGet<{ insights: Insights }>(
          `/api/analytics/channel/${active.id}`,
        );
        setInsights(insights);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Track performance patterns to inform future content decisions."
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Loading insights...
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : !insights || insights.sampleSize === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>
              Learning loop for {channel?.name ?? "the channel"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
              <p className="max-w-md text-sm text-muted-foreground">
                {insights?.recommendations[0] ??
                  "No analytics yet. Import performance data per video to surface pillar, duration, and title-pattern trends."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>
                Derived from {insights.sampleSize} video
                {insights.sampleSize === 1 ? "" : "s"} with performance data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2 text-sm">
                {insights.recommendations.map((r, i) => (
                  <li key={i} className="text-foreground">
                    {r}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Strongest Pillars</CardTitle>
                <CardDescription>By average views.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                {insights.topPillars.map((p) => (
                  <div key={p.pillar} className="flex items-center justify-between">
                    <span className="text-foreground">{p.pillar}</span>
                    <span className="text-muted-foreground">
                      {p.avgViews.toLocaleString()} views · {p.avgViewedPct}% · {p.videos}x
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Duration Windows</CardTitle>
                <CardDescription>Average viewed percentage by length.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                {insights.durationWindows.map((d) => (
                  <div key={d.label} className="flex items-center justify-between">
                    <span className="text-foreground">{d.label}</span>
                    <span className="text-muted-foreground">
                      {d.avgViewedPct}% retention · {d.videos}x
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {insights.titlePatterns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Title Patterns</CardTitle>
                <CardDescription>By average views.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                {insights.titlePatterns.map((t) => (
                  <div key={t.pattern} className="flex items-center justify-between">
                    <span className="text-foreground">{t.pattern}</span>
                    <span className="text-muted-foreground">
                      {t.avgViews.toLocaleString()} views · {t.videos}x
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
