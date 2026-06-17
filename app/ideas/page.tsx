"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { apiGet, apiPost, runJob } from "@/lib/client";

interface Pillar {
  id: string;
  name: string;
}

interface ScoreBreakdown {
  novelty?: number;
  consequenceStrength?: number;
  policySafety?: number;
  retentionPotential?: number;
}

interface Idea {
  id: string;
  title: string;
  angle: string | null;
  status: string;
  totalScore: number | null;
  scoreBreakdownJson: string | null;
  pillar?: { id: string; name: string } | null;
}

function parseBreakdown(json: string | null): ScoreBreakdown {
  if (!json) return {};
  try {
    return JSON.parse(json) as ScoreBreakdown;
  } catch {
    return {};
  }
}

function ScoreBar({ label, value }: { label: string; value?: number }) {
  const v = typeof value === "number" ? value : 0;
  const pct = Math.max(0, Math.min(100, v * 10));
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{value ?? "-"}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function IdeasPage() {
  const router = useRouter();

  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [pillarId, setPillarId] = useState<string>("");
  const [seedPhrases, setSeedPhrases] = useState<string>("");

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(true);

  const [discovering, setDiscovering] = useState(false);
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyIdeaId, setBusyIdeaId] = useState<string | null>(null);

  const loadIdeas = useCallback(async () => {
    setIdeasLoading(true);
    try {
      const res = await apiGet<{ ideas: Idea[] }>("/api/ideas?limit=50");
      setIdeas(res.ideas ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIdeasLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet<{ active: { pillars: Pillar[] } | null }>(
          "/api/channels",
        );
        setPillars(res.active?.pillars ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    void loadIdeas();
  }, [loadIdeas]);

  function friendlyError(e: unknown): string {
    const raw = e instanceof Error ? e.message : String(e);
    if (raw.includes("ANTHROPIC_API_KEY") || raw.includes("not configured") || raw.includes("NOT_CONFIGURED"))
      return "Chave da Anthropic não configurada. Adicione ANTHROPIC_API_KEY no arquivo .env.local e reinicie o servidor.";
    if (raw.includes("non-empty content") || raw.includes("empty"))
      return "O conteúdo enviado estava vazio. Tente novamente.";
    if (raw.includes("401") || raw.includes("invalid_api_key") || raw.includes("authentication"))
      return "Chave de API inválida. Verifique o ANTHROPIC_API_KEY no .env.local.";
    if (raw.includes("429") || raw.includes("rate_limit"))
      return "Limite de requisições atingido. Aguarde alguns segundos e tente novamente.";
    if (raw.includes("500") || raw.includes("502") || raw.includes("503"))
      return "O serviço de IA está temporariamente indisponível. Tente novamente em instantes.";
    if (raw.includes("interrompida") || raw.includes("interrupted"))
      return "A tarefa anterior foi interrompida pelo reinício do servidor. Tente novamente.";
    if (raw.includes("FAILED") || raw.includes("falhou"))
      return "Não foi possível gerar ideias. Verifique suas chaves de API em Configurações e tente novamente.";
    return "Algo deu errado. Tente novamente ou verifique as configurações de API.";
  }

  async function handleDiscover() {
    setError(null);
    setDiscovering(true);
    setStatusLine("Gerando ideias...");
    try {
      const seeds = seedPhrases
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const job = await runJob("/api/ideas/discover", {
        pillarId: pillarId || undefined,
        seedPhrases: seeds.length > 0 ? seeds : undefined,
      });
      if (job.status === "FAILED") {
        setError(friendlyError(job.error?.message ?? ""));
        return;
      }
      setStatusLine("Ideias geradas com sucesso!");
      await loadIdeas();
    } catch (e) {
      setStatusLine(null);
      setError(friendlyError(e));
    } finally {
      setDiscovering(false);
    }
  }

  async function handleSelect(id: string) {
    setError(null);
    setBusyIdeaId(id);
    try {
      await apiPost(`/api/ideas/${id}/select`);
      await loadIdeas();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyIdeaId(null);
    }
  }

  async function handleGenerateScript(id: string) {
    setError(null);
    setBusyIdeaId(id);
    try {
      const job = await runJob("/api/scripts/generate", { ideaId: id });
      if (job.status === "FAILED") {
        throw new Error(job.error?.message ?? "Geração de roteiro falhou");
      }
      router.push("/scripts");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusyIdeaId(null);
    }
  }

  const sortedIdeas = [...ideas].sort(
    (a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0),
  );

  return (
    <>
      <PageHeader
        title="Descoberta de Ideias"
        description="Gere e classifique ideias de tópicos originais a partir dos pilares editoriais."
      />

      <Card>
        <CardHeader>
          <CardTitle>Descobrir tópicos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="pillar">Pilar</Label>
              <select
                id="pillar"
                value={pillarId}
                onChange={(e) => setPillarId(e.target.value)}
                disabled={discovering}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Qualquer pilar</option>
                {pillars.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="seeds">Frases-semente (separadas por vírgula)</Label>
              <Input
                id="seeds"
                placeholder="ex: colapso de modelo, deriva silenciosa de dados"
                value={seedPhrases}
                onChange={(e) => setSeedPhrases(e.target.value)}
                disabled={discovering}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleDiscover} disabled={discovering}>
              {discovering ? <Spinner /> : <Lightbulb className="h-4 w-4" />}
              Descobrir Ideias
            </Button>
            {statusLine ? (
              <span className="text-sm text-muted-foreground">{statusLine}</span>
            ) : null}
          </div>
          {error ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {ideasLoading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Spinner /> Carregando ideias...
        </div>
      ) : sortedIdeas.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Lightbulb className="h-8 w-8 text-muted-foreground" />
              <p className="max-w-md text-sm text-muted-foreground">
                Nenhuma ideia gerada ainda. Escolha um pilar e execute a descoberta para
                popular um backlog classificado de tópicos candidatos.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sortedIdeas.map((idea) => {
            const b = parseBreakdown(idea.scoreBreakdownJson);
            const busy = busyIdeaId === idea.id;
            return (
              <Card key={idea.id}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <CardTitle className="text-base">{idea.title}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        {idea.pillar ? (
                          <Badge variant="outline">{idea.pillar.name}</Badge>
                        ) : null}
                        <StatusBadge status={idea.status} />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-semibold tabular-nums">
                        {idea.totalScore ?? "-"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        pontuação
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {idea.angle ? (
                    <p className="text-sm text-muted-foreground">{idea.angle}</p>
                  ) : null}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <ScoreBar label="Novidade" value={b.novelty} />
                    <ScoreBar
                      label="Consequência"
                      value={b.consequenceStrength}
                    />
                    <ScoreBar label="Segurança de Política" value={b.policySafety} />
                    <ScoreBar
                      label="Retenção"
                      value={b.retentionPotential}
                    />
                  </div>
                  <div className={cn("flex gap-2")}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSelect(idea.id)}
                      disabled={busy}
                    >
                      {busy ? <Spinner /> : null}
                      Selecionar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleGenerateScript(idea.id)}
                      disabled={busy}
                    >
                      {busy ? <Spinner /> : null}
                      Gerar Roteiro
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
