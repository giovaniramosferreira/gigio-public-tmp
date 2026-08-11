"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, PlusCircle } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { apiGet, apiPost } from "@/lib/client";

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

interface VideoListItem {
  id: string;
  title: string;
  status: string;
}

interface FormState {
  videoProjectId: string;
  views: string;
  likes: string;
  comments: string;
  shares: string;
  averageViewPercentage: string;
  watchTimeSeconds: string;
  impressions: string;
  ctr: string;
  snapshotDate: string;
}

const EMPTY_FORM: FormState = {
  videoProjectId: "",
  views: "",
  likes: "",
  comments: "",
  shares: "",
  averageViewPercentage: "",
  watchTimeSeconds: "",
  impressions: "",
  ctr: "",
  snapshotDate: new Date().toISOString().split("T")[0],
};

function parseOptionalNumber(v: string): number | undefined {
  const n = parseFloat(v);
  return isNaN(n) ? undefined : n;
}

export default function AnalyticsPage() {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [videos, setVideos] = useState<VideoListItem[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadInsights = useCallback(async (channelId: string) => {
    const { insights } = await apiGet<{ insights: Insights }>(
      `/api/analytics/channel/${channelId}`,
    );
    setInsights(insights);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { active } = await apiGet<{ active: Channel | null }>("/api/channels");
        if (!active) {
          setError("Nenhum canal ativo configurado.");
          return;
        }
        setChannel(active);

        const [insightsRes, videosRes] = await Promise.all([
          apiGet<{ insights: Insights }>(`/api/analytics/channel/${active.id}`),
          apiGet<{ videos: VideoListItem[] }>("/api/videos"),
        ]);
        setInsights(insightsRes.insights);
        setVideos(videosRes.videos ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao carregar análises");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.videoProjectId) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await apiPost("/api/analytics/sync", {
        videoProjectId: form.videoProjectId,
        data: {
          snapshotDate: form.snapshotDate || undefined,
          views: parseOptionalNumber(form.views),
          likes: parseOptionalNumber(form.likes),
          comments: parseOptionalNumber(form.comments),
          shares: parseOptionalNumber(form.shares),
          averageViewPercentage: parseOptionalNumber(form.averageViewPercentage),
          watchTimeSeconds: parseOptionalNumber(form.watchTimeSeconds),
          impressions: parseOptionalNumber(form.impressions),
          ctr: parseOptionalNumber(form.ctr),
        },
      });
      setSubmitSuccess(true);
      setForm({ ...EMPTY_FORM, snapshotDate: form.snapshotDate });
      // Atualizar insights
      if (channel) await loadInsights(channel.id);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Falha ao salvar snapshot");
    } finally {
      setSubmitting(false);
    }
  }

  function field(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <>
      <PageHeader
        title="Análises"
        description="Acompanhe padrões de desempenho para orientar futuras decisões de conteúdo."
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Carregando insights...
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {/* ── Insights ── */}
          {!insights || insights.sampleSize === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Desempenho</CardTitle>
                <CardDescription>
                  Loop de aprendizado para {channel?.name ?? "o canal"}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  <p className="max-w-md text-sm text-muted-foreground">
                    {insights?.recommendations[0] ??
                      "Nenhuma análise ainda. Registre dados de desempenho abaixo para revelar tendências de pilar, duração e padrão de título."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recomendações</CardTitle>
                  <CardDescription>
                    Derivadas de {insights.sampleSize} vídeo
                    {insights.sampleSize === 1 ? "" : "s"} com dados de desempenho.
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
                    <CardTitle>Pilares Mais Fortes</CardTitle>
                    <CardDescription>Por visualizações médias.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm">
                    {insights.topPillars.map((p) => (
                      <div key={p.pillar} className="flex items-center justify-between">
                        <span className="text-foreground">{p.pillar}</span>
                        <span className="text-muted-foreground">
                          {p.avgViews.toLocaleString()} visualizações · {p.avgViewedPct}% · {p.videos}x
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Janelas de Duração</CardTitle>
                    <CardDescription>Percentual médio assistido por comprimento.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm">
                    {insights.durationWindows.map((d) => (
                      <div key={d.label} className="flex items-center justify-between">
                        <span className="text-foreground">{d.label}</span>
                        <span className="text-muted-foreground">
                          {d.avgViewedPct}% retenção · {d.videos}x
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {insights.titlePatterns.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Padrões de Título</CardTitle>
                    <CardDescription>Por visualizações médias.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm">
                    {insights.titlePatterns.map((t) => (
                      <div key={t.pattern} className="flex items-center justify-between">
                        <span className="text-foreground">{t.pattern}</span>
                        <span className="text-muted-foreground">
                          {t.avgViews.toLocaleString()} visualizações · {t.videos}x
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <Separator />

          {/* ── Entrada manual ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Registrar Dados de Desempenho
              </CardTitle>
              <CardDescription>
                Registre manualmente um snapshot de desempenho para um vídeo publicado
                para alimentar o loop de aprendizado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {videos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum vídeo encontrado. Complete o pipeline de produção primeiro.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  {/* Seletor de vídeo */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="videoProjectId">Vídeo</Label>
                    <select
                      id="videoProjectId"
                      required
                      value={form.videoProjectId}
                      onChange={(e) => field("videoProjectId", e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Selecione um vídeo…</option>
                      {videos.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.title}
                        </option>
                      ))}
                    </select>
                    {form.videoProjectId && (
                      <span className="text-xs text-muted-foreground">
                        Status:{" "}
                        <StatusBadge
                          status={
                            videos.find((v) => v.id === form.videoProjectId)?.status ?? ""
                          }
                        />
                      </span>
                    )}
                  </div>

                  {/* Data */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="snapshotDate">Data do Snapshot</Label>
                    <Input
                      id="snapshotDate"
                      type="date"
                      value={form.snapshotDate}
                      onChange={(e) => field("snapshotDate", e.target.value)}
                    />
                  </div>

                  {/* Métricas principais */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="views">Visualizações</Label>
                      <Input
                        id="views"
                        type="number"
                        min={0}
                        placeholder="ex: 12400"
                        value={form.views}
                        onChange={(e) => field("views", e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="likes">Curtidas</Label>
                      <Input
                        id="likes"
                        type="number"
                        min={0}
                        placeholder="ex: 340"
                        value={form.likes}
                        onChange={(e) => field("likes", e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="comments">Comentários</Label>
                      <Input
                        id="comments"
                        type="number"
                        min={0}
                        placeholder="ex: 28"
                        value={form.comments}
                        onChange={(e) => field("comments", e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="shares">Compartilhamentos</Label>
                      <Input
                        id="shares"
                        type="number"
                        min={0}
                        placeholder="ex: 15"
                        value={form.shares}
                        onChange={(e) => field("shares", e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="averageViewPercentage">% Média Assistida (0-100)</Label>
                      <Input
                        id="averageViewPercentage"
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        placeholder="ex: 68.5"
                        value={form.averageViewPercentage}
                        onChange={(e) => field("averageViewPercentage", e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="watchTimeSeconds">Tempo de Exibição (s)</Label>
                      <Input
                        id="watchTimeSeconds"
                        type="number"
                        min={0}
                        placeholder="ex: 8400"
                        value={form.watchTimeSeconds}
                        onChange={(e) => field("watchTimeSeconds", e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="impressions">Impressões</Label>
                      <Input
                        id="impressions"
                        type="number"
                        min={0}
                        placeholder="ex: 54000"
                        value={form.impressions}
                        onChange={(e) => field("impressions", e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="ctr">CTR (0-1)</Label>
                      <Input
                        id="ctr"
                        type="number"
                        min={0}
                        max={1}
                        step={0.001}
                        placeholder="ex: 0.042"
                        value={form.ctr}
                        onChange={(e) => field("ctr", e.target.value)}
                      />
                    </div>
                  </div>

                  {submitError && (
                    <p className="text-sm text-destructive">{submitError}</p>
                  )}
                  {submitSuccess && (
                    <p className="text-sm text-green-500">
                      Snapshot salvo. Insights atualizados acima.
                    </p>
                  )}

                  <Button type="submit" disabled={submitting || !form.videoProjectId} className="self-start">
                    {submitting ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Salvando…
                      </>
                    ) : (
                      "Salvar Snapshot"
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
