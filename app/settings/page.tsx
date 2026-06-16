"use client";

import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { apiGet } from "@/lib/client";

interface Pillar {
  id: string;
  name: string;
  active: boolean;
}

interface ActiveChannel {
  id: string;
  name: string;
  niche: string | null;
  reviewMode: string | null;
  pillars: Pillar[];
}

interface Provider {
  capability: "llm" | "tts" | "image";
  provider: string;
  configured: boolean;
  healthy: boolean;
  message?: string;
  checkedAt: string;
}

export default function SettingsPage() {
  const [channel, setChannel] = useState<ActiveChannel | null>(null);
  const [channelLoading, setChannelLoading] = useState(true);
  const [channelError, setChannelError] = useState<string | null>(null);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGet<{ active: ActiveChannel | null }>(
          "/api/channels",
        );
        if (!cancelled) setChannel(res.active ?? null);
      } catch (e) {
        if (!cancelled)
          setChannelError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setChannelLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const runHealthCheck = useCallback(async () => {
    setProvidersLoading(true);
    setProvidersError(null);
    try {
      const res = await apiGet<{ providers: Provider[] }>(
        "/api/providers/health",
      );
      setProviders(res.providers ?? []);
      setChecked(true);
    } catch (e) {
      setProvidersError(e instanceof Error ? e.message : String(e));
    } finally {
      setProvidersLoading(false);
    }
  }, []);

  useEffect(() => {
    void runHealthCheck();
  }, [runHealthCheck]);

  function providerBadge(p: Provider) {
    if (!p.configured) return <StatusBadge status="Not configured" />;
    if (p.healthy) return <StatusBadge status="Healthy" />;
    return <StatusBadge status="Unhealthy" />;
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Channel configuration and provider health for the DarkTube OS pipeline."
      />

      <Card>
        <CardHeader>
          <CardTitle>Channel Configuration</CardTitle>
          <CardDescription>
            The currently active channel and its editorial pillars (read-only).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {channelLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner /> Loading channel...
            </div>
          ) : channelError ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {channelError}
            </div>
          ) : !channel ? (
            <p className="text-sm text-muted-foreground">
              No active channel configured.
            </p>
          ) : (
            <div className="space-y-4">
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted-foreground">Name</dt>
                  <dd className="text-sm font-medium">{channel.name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Niche</dt>
                  <dd className="text-sm font-medium">
                    {channel.niche ?? "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Review Mode</dt>
                  <dd className="text-sm font-medium">
                    {channel.reviewMode ?? "-"}
                  </dd>
                </div>
              </dl>
              <Separator />
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Pillars</p>
                {channel.pillars.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No pillars defined.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {channel.pillars.map((p) => (
                      <Badge
                        key={p.id}
                        variant={p.active ? "secondary" : "outline"}
                      >
                        {p.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Providers</CardTitle>
              <CardDescription>
                Configured LLM, TTS, and image providers and their health.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={runHealthCheck}
              disabled={providersLoading}
            >
              {providersLoading ? <Spinner /> : null}
              Run health check
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {providersError ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {providersError}
            </div>
          ) : providersLoading && providers.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner /> Checking providers...
            </div>
          ) : checked && providers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No providers reported.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {providers.map((p) => (
                <li
                  key={`${p.capability}:${p.provider}`}
                  className="flex items-center gap-3 py-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{p.provider}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                        {p.capability}
                      </span>
                    </div>
                    {p.message ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {p.message}
                      </p>
                    ) : null}
                  </div>
                  {providerBadge(p)}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
