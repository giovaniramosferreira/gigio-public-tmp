"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";

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
import { cn } from "@/lib/utils";
import { apiGet, runJob } from "@/lib/client";

interface ScriptListItem {
  id: string;
  title: string;
  status: string;
  originalityScore: number | null;
  rewriteCount: number;
}

interface Beat {
  beat: string;
  t_start: number;
  t_end: number;
  narration: string;
  visual_direction?: string;
}

interface OriginalityDimension {
  name: string;
  similarity: number;
  originality: number;
}

interface CritiqueQuestion {
  question: string;
  rating: string;
  note?: string;
}

interface CritiqueIssue {
  type: string;
  severity: string;
  detail: string;
}

interface CriticNotes {
  titleVariants?: string[];
  safetyNotes?: string[];
  originality?: {
    decision?: string;
    aggregateOriginality?: number;
    dimensions?: OriginalityDimension[];
    flaggedAgainst?: string;
  };
  critique?: {
    questions?: CritiqueQuestion[];
    issues?: CritiqueIssue[];
    rewrite_guidance?: string;
    verdict?: string;
  };
}

interface ScriptDetail {
  id: string;
  title: string;
  thesis: string | null;
  selectedHook: string | null;
  fullScript: string | null;
  status: string;
  originalityScore: number | null;
  rewriteCount: number;
}

interface DetailResponse {
  script: ScriptDetail;
  hookVariants: string[];
  beatPlan: Beat[];
  criticNotes: CriticNotes | null;
}

function fmtTime(n: number): string {
  if (typeof n !== "number" || Number.isNaN(n)) return "-";
  return `${n.toFixed(1)}s`;
}

function DimensionBar({ dim }: { dim: OriginalityDimension }) {
  const pct = Math.max(0, Math.min(100, dim.originality * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
        <span>{dim.name}</span>
        <span className="tabular-nums">{(dim.originality * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<ScriptListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [action, setAction] = useState<"critic" | "rewrite" | "approve" | null>(
    null,
  );
  const [approved, setApproved] = useState(false);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await apiGet<{ scripts: ScriptListItem[] }>(
        "/api/scripts?limit=50",
      );
      setScripts(res.scripts ?? []);
    } catch (e) {
      setListError(e instanceof Error ? e.message : String(e));
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await apiGet<DetailResponse>(`/api/scripts/${id}`);
      setDetail(res);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : String(e));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    setApproved(false);
    if (selectedId) void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  async function handleCritic() {
    if (!selectedId) return;
    setAction("critic");
    setDetailError(null);
    try {
      const job = await runJob(`/api/scripts/${selectedId}/critic`);
      if (job.status === "FAILED") {
        throw new Error(job.error?.message ?? "Critic job failed");
      }
      await loadDetail(selectedId);
      await loadList();
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : String(e));
    } finally {
      setAction(null);
    }
  }

  async function handleRewrite() {
    if (!selectedId) return;
    setAction("rewrite");
    setDetailError(null);
    try {
      const job = await runJob(`/api/scripts/${selectedId}/rewrite`, {});
      if (job.status === "FAILED") {
        throw new Error(job.error?.message ?? "Rewrite job failed");
      }
      await loadDetail(selectedId);
      await loadList();
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : String(e));
    } finally {
      setAction(null);
    }
  }

  async function handleApprove() {
    if (!selectedId) return;
    setAction("approve");
    setDetailError(null);
    try {
      const job = await runJob(`/api/scripts/${selectedId}/approve`);
      if (job.status === "FAILED") {
        throw new Error(job.error?.message ?? "Approve job failed");
      }
      setApproved(true);
      await loadDetail(selectedId);
      await loadList();
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : String(e));
    } finally {
      setAction(null);
    }
  }

  const critique = detail?.criticNotes?.critique;
  const originality = detail?.criticNotes?.originality;
  const isBlocked = detail?.script.status?.toUpperCase() === "BLOCKED";

  return (
    <>
      <PageHeader
        title="Script Review"
        description="Review generated scripts, originality, and critic feedback before production."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[20rem_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Scripts</CardTitle>
            <CardDescription>Select a script to review.</CardDescription>
          </CardHeader>
          <CardContent>
            {listLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner /> Loading...
              </div>
            ) : listError ? (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {listError}
              </div>
            ) : scripts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scripts yet.</p>
            ) : (
              <ul className="space-y-1">
                {scripts.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className={cn(
                        "w-full rounded-md border p-3 text-left transition-colors hover:bg-accent",
                        selectedId === s.id
                          ? "border-primary bg-accent"
                          : "border-border",
                      )}
                    >
                      <div className="mb-1.5 line-clamp-2 text-sm font-medium">
                        {s.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <StatusBadge status={s.status} />
                        <span>
                          orig {s.originalityScore ?? "-"}
                        </span>
                        <span>rewrites {s.rewriteCount}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {!selectedId ? (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Select a script from the list to review its details.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : detailLoading && !detail ? (
            <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
              <Spinner /> Loading script...
            </div>
          ) : detailError && !detail ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {detailError}
            </div>
          ) : detail ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <CardTitle>{detail.script.title}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={detail.script.status} />
                        <Badge variant="outline">
                          originality {detail.script.originalityScore ?? "-"}
                        </Badge>
                        <Badge variant="outline">
                          rewrites {detail.script.rewriteCount}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCritic}
                        disabled={action !== null}
                      >
                        {action === "critic" ? <Spinner /> : null}
                        Run Critic
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRewrite}
                        disabled={action !== null}
                      >
                        {action === "rewrite" ? <Spinner /> : null}
                        Rewrite
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleApprove}
                        disabled={action !== null || isBlocked}
                        title={
                          isBlocked
                            ? "Script is BLOCKED (originality) and cannot enter production"
                            : undefined
                        }
                      >
                        {action === "approve" ? <Spinner /> : null}
                        Approve for Production
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {detailError ? (
                    <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                      {detailError}
                    </div>
                  ) : null}
                  {approved ? (
                    <div className="rounded-md border border-success/50 bg-success/10 p-3 text-sm text-success">
                      Approved for production. A video project was created.{" "}
                      <Link
                        href="/production"
                        className="font-medium underline underline-offset-4"
                      >
                        Open Production Monitor
                      </Link>
                    </div>
                  ) : null}
                  {detail.script.thesis ? (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                        Thesis
                      </p>
                      <p className="text-sm">{detail.script.thesis}</p>
                    </div>
                  ) : null}
                  {detail.script.selectedHook ? (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                        Selected Hook
                      </p>
                      <p className="text-sm">{detail.script.selectedHook}</p>
                    </div>
                  ) : null}
                  {detail.hookVariants.length > 0 ? (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                        Hook Variants
                      </p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {detail.hookVariants.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {detail.script.fullScript ? (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                        Full Script
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {detail.script.fullScript}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {detail.beatPlan.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Beat Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-xs text-muted-foreground">
                            <th className="py-2 pr-3 font-medium">Beat</th>
                            <th className="py-2 pr-3 font-medium">Time</th>
                            <th className="py-2 font-medium">Narration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.beatPlan.map((b, i) => (
                            <tr
                              key={i}
                              className="border-b border-border/50 align-top"
                            >
                              <td className="py-2 pr-3 font-medium">{b.beat}</td>
                              <td className="whitespace-nowrap py-2 pr-3 tabular-nums text-muted-foreground">
                                {fmtTime(b.t_start)} - {fmtTime(b.t_end)}
                              </td>
                              <td className="py-2">{b.narration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {originality ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle>Originality</CardTitle>
                      {originality.decision ? (
                        <StatusBadge status={originality.decision} />
                      ) : null}
                    </div>
                    {typeof originality.aggregateOriginality === "number" ? (
                      <CardDescription>
                        Aggregate originality{" "}
                        {(originality.aggregateOriginality * 100).toFixed(0)}%
                      </CardDescription>
                    ) : null}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(originality.dimensions ?? []).map((d, i) => (
                      <DimensionBar key={i} dim={d} />
                    ))}
                    {originality.flaggedAgainst ? (
                      <p className="text-xs text-muted-foreground">
                        Flagged against: {originality.flaggedAgainst}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}

              {critique ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle>Critic</CardTitle>
                      {critique.verdict ? (
                        <StatusBadge status={critique.verdict} />
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(critique.questions ?? []).length > 0 ? (
                      <div className="space-y-2">
                        {critique.questions!.map((q, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <StatusBadge status={q.rating} />
                            <div className="flex-1">
                              <p className="text-sm">{q.question}</p>
                              {q.note ? (
                                <p className="text-xs text-muted-foreground">
                                  {q.note}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {(critique.issues ?? []).length > 0 ? (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            Issues
                          </p>
                          {critique.issues!.map((iss, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <StatusBadge status={iss.severity} />
                              <p className="flex-1 text-sm">
                                <span className="font-medium">{iss.type}:</span>{" "}
                                {iss.detail}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : null}

                    {critique.rewrite_guidance ? (
                      <>
                        <Separator />
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                            Rewrite Guidance
                          </p>
                          <p className="text-sm">{critique.rewrite_guidance}</p>
                        </div>
                      </>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
