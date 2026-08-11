"use client";

import { useCallback, useEffect, useState } from "react";
import { Clapperboard } from "lucide-react";

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
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { apiGet, runJob } from "@/lib/client";

interface QaRunSummary {
  decision: string | null;
  overallScore: number | null;
  createdAt: string;
}

interface VideoListItem {
  id: string;
  title: string;
  status: string;
  durationSeconds: number | null;
  qaRuns: QaRunSummary[];
}

interface Thumb {
  id: string;
  variantLabel: string;
  imagePath: string | null;
  readabilityScore: number | null;
  similarityScore: number | null;
  isSelected: boolean;
}

interface AssetPlan {
  totalScenes: number | null;
  status: string | null;
  provider: string | null;
}

interface Captions {
  status: string | null;
  wordCount: number | null;
}

interface VideoDetail {
  video: {
    id: string;
    title: string;
    status: string;
    durationSeconds: number | null;
    resolution: string | null;
    aspectRatio: string | null;
    previewFilePath: string | null;
    exportFilePath: string | null;
  };
  assetPlan: AssetPlan | null;
  captions: Captions | null;
  thumbnails: Thumb[];
}

interface JobItem {
  id: string;
  jobType: string;
  status: string;
  errorMessage: string | null;
  durationMs: number | null;
}

type Step =
  | "assets"
  | "voice"
  | "captions"
  | "assemble"
  | "thumbnails"
  | "metadata"
  | "qa";

const STEPS: { step: Step; label: string }[] = [
  { step: "assets", label: "Assets" },
  { step: "voice", label: "Voz" },
  { step: "captions", label: "Legendas" },
  { step: "assemble", label: "Montar" },
  { step: "thumbnails", label: "Miniaturas" },
  { step: "metadata", label: "Metadados" },
  { step: "qa", label: "QA" },
];

function fmtDuration(seconds: number | null): string | null {
  if (typeof seconds !== "number" || Number.isNaN(seconds)) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function ProductionPage() {
  const [videos, setVideos] = useState<VideoListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [jobs, setJobs] = useState<JobItem[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<VideoDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [runningStep, setRunningStep] = useState<Step | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  const loadVideos = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await apiGet<{ videos: VideoListItem[] }>("/api/videos");
      setVideos(res.videos ?? []);
    } catch (e) {
      setListError(e instanceof Error ? e.message : String(e));
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadJobs = useCallback(async () => {
    try {
      const res = await apiGet<{ jobs: JobItem[] }>("/api/jobs?limit=20");
      setJobs(res.jobs ?? []);
    } catch {
      // Não fatal; painel de jobs permanece vazio.
    }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await apiGet<VideoDetail>(`/api/videos/${id}`);
      setDetail(res);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : String(e));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVideos();
    void loadJobs();
  }, [loadVideos, loadJobs]);

  useEffect(() => {
    setStepError(null);
    if (selectedId) void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  async function handleRunStep(step: Step) {
    if (!selectedId) return;
    setRunningStep(step);
    setStepError(null);
    try {
      const job = await runJob(`/api/videos/${selectedId}/${step}`);
      if (job.status === "FAILED") {
        throw new Error(job.error?.message ?? `Job ${step} falhou`);
      }
      await loadDetail(selectedId);
      await loadVideos();
      await loadJobs();
    } catch (e) {
      setStepError(e instanceof Error ? e.message : String(e));
      await loadJobs();
    } finally {
      setRunningStep(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Monitor de Jobs de Produção"
        description="Execute o pipeline de produção por etapa e acompanhe os jobs de renderização."
      />

      {listLoading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Spinner /> Carregando projetos de vídeo...
        </div>
      ) : listError ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {listError}
        </div>
      ) : videos.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Clapperboard className="h-8 w-8 text-muted-foreground" />
              <p className="max-w-md text-sm text-muted-foreground">
                Nenhum projeto de vídeo ainda. Aprovar um roteiro em{" "}
                <span className="font-medium">/scripts</span> (Aprovar para
                Produção) cria um projeto de vídeo que aparece aqui.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[22rem_1fr]">
          <div className="space-y-4">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Projetos de Vídeo</CardTitle>
                <CardDescription>Selecione um projeto para executar etapas.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {videos.map((v) => {
                    const qa = v.qaRuns[0];
                    const dur = fmtDuration(v.durationSeconds);
                    return (
                      <li key={v.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(v.id)}
                          className={cn(
                            "w-full rounded-md border p-3 text-left transition-colors hover:bg-accent",
                            selectedId === v.id
                              ? "border-primary bg-accent"
                              : "border-border",
                          )}
                        >
                          <div className="mb-1.5 line-clamp-2 text-sm font-medium">
                            {v.title}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            <StatusBadge status={v.status} />
                            {dur ? <span>{dur}</span> : null}
                            {qa?.decision ? (
                              <StatusBadge status={qa.decision} />
                            ) : null}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Jobs Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum job ainda.</p>
                ) : (
                  <ul className="space-y-2">
                    {jobs.map((j) => (
                      <li key={j.id} className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <StatusBadge status={j.status} />
                          <span className="font-medium">{j.jobType}</span>
                          {typeof j.durationMs === "number" ? (
                            <span className="text-muted-foreground tabular-nums">
                              {(j.durationMs / 1000).toFixed(1)}s
                            </span>
                          ) : null}
                        </div>
                        {j.errorMessage ? (
                          <p className="text-[11px] text-destructive">
                            {j.errorMessage}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {!selectedId ? (
              <Card>
                <CardContent>
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <Clapperboard className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Selecione um projeto de vídeo para executar seu pipeline de produção.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : detailLoading && !detail ? (
              <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
                <Spinner /> Carregando projeto...
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
                      <CardTitle>{detail.video.title}</CardTitle>
                      <StatusBadge status={detail.video.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                      {detail.video.resolution ? (
                        <Badge variant="outline">{detail.video.resolution}</Badge>
                      ) : null}
                      {detail.video.aspectRatio ? (
                        <Badge variant="outline">
                          {detail.video.aspectRatio}
                        </Badge>
                      ) : null}
                      {fmtDuration(detail.video.durationSeconds) ? (
                        <span>{fmtDuration(detail.video.durationSeconds)}</span>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stepError ? (
                      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                        {stepError}
                      </div>
                    ) : null}

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                        Pipeline
                      </p>
                      <div className="space-y-2">
                        {STEPS.map(({ step, label }, i) => {
                          const running = runningStep === step;
                          return (
                            <div
                              key={step}
                              className="flex items-center gap-3 rounded-md border border-border p-2"
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold tabular-nums text-secondary-foreground">
                                {i + 1}
                              </span>
                              <span className="flex-1 text-sm font-medium">
                                {label}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRunStep(step)}
                                disabled={runningStep !== null}
                              >
                                {running ? <Spinner /> : null}
                                Executar
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Plano de Assets</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      {detail.assetPlan ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cenas</span>
                            <span className="tabular-nums">
                              {detail.assetPlan.totalScenes ?? "-"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <span>{detail.assetPlan.status ?? "-"}</span>
                          </div>
                          {detail.assetPlan.provider ? (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Provedor
                              </span>
                              <span>{detail.assetPlan.provider}</span>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <p className="text-muted-foreground">Nenhum plano de assets ainda.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Legendas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      {detail.captions ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <span>{detail.captions.status ?? "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Palavras</span>
                            <span className="tabular-nums">
                              {detail.captions.wordCount ?? "-"}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-muted-foreground">Nenhuma legenda ainda.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Miniaturas ({detail.thumbnails.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {detail.thumbnails.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nenhuma miniatura gerada ainda.
                      </p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {detail.thumbnails.map((t) => (
                          <li
                            key={t.id}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <span className="font-medium">{t.variantLabel}</span>
                            {t.isSelected ? (
                              <Badge variant="success">selecionada</Badge>
                            ) : null}
                            <span className="text-muted-foreground">
                              legibilidade{" "}
                              {t.readabilityScore != null
                                ? t.readabilityScore.toFixed(2)
                                : "-"}
                            </span>
                            <span className="text-muted-foreground">
                              similaridade{" "}
                              {t.similarityScore != null
                                ? t.similarityScore.toFixed(2)
                                : "-"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
