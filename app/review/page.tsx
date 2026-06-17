"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { apiGet, apiPost, runJob } from "@/lib/client";

interface VideoListItem {
  id: string;
  title: string;
  status: string;
  durationSeconds: number | null;
}

interface Thumb {
  id: string;
  variantLabel: string;
  imagePath: string | null;
  readabilityScore: number | null;
  similarityScore: number | null;
  isSelected: boolean;
}

interface ReasonCode {
  code: string;
  detail: string;
}

interface Qa {
  decision: string | null;
  overallScore: number | null;
  originalityRiskScore: number | null;
  reusedRiskScore: number | null;
  technicalRiskScore: number | null;
  reasonCodes: ReasonCode[];
}

interface Meta {
  title: string | null;
  description: string | null;
  hashtagsJson: string | null;
  pinnedComment: string | null;
  visibility: string | null;
}

interface VideoDetail {
  video: {
    id: string;
    title: string;
    status: string;
    previewFilePath: string | null;
  };
  qa: Qa | null;
  metadata: Meta | null;
  thumbnails: Thumb[];
}

const CHECKLIST = [
  "O ângulo é genuinamente específico?",
  "O efeito colateral oculto está claro até o segundo 8?",
  "O roteiro soa como este canal?",
  "O ritmo é forte para Shorts?",
  "Os visuais apoiam o significado?",
  "Um revisor de plataforma conseguiria ver valor original claro?",
];

function parseHashtags(json: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

function RiskBar({ label, value }: { label: string; value: number | null }) {
  const v = typeof value === "number" ? value : 0;
  const pct = Math.max(0, Math.min(100, v * 100));
  // Maior risco = pior: inclinado para destrutivo em valores altos.
  const barColor = v >= 0.66 ? "bg-destructive" : v >= 0.33 ? "bg-warning" : "bg-success";
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">
          {value != null ? `${pct.toFixed(0)}% risco` : "-"}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const [pending, setPending] = useState<VideoListItem[]>([]);
  const [done, setDone] = useState<VideoListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<VideoDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [action, setAction] = useState<"approve" | "reject" | "rewrite" | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const [approvedDone, setApprovedDone] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(() =>
    CHECKLIST.map(() => false),
  );

  const loadLists = useCallback(async () => {
    setListLoading(true);
    try {
      const [reviewRes, approvedRes, exportedRes] = await Promise.all([
        apiGet<{ videos: VideoListItem[] }>("/api/videos?status=REVIEW_READY"),
        apiGet<{ videos: VideoListItem[] }>("/api/videos?status=APPROVED"),
        apiGet<{ videos: VideoListItem[] }>("/api/videos?status=EXPORTED"),
      ]);
      setPending(reviewRes.videos ?? []);
      setDone([...(approvedRes.videos ?? []), ...(exportedRes.videos ?? [])]);
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
      const res = await apiGet<VideoDetail>(`/api/videos/${id}`);
      setDetail(res);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : String(e));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  useEffect(() => {
    setStatusLine(null);
    setApprovedDone(false);
    setRejectReason("");
    setChecked(CHECKLIST.map(() => false));
    if (selectedId) void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  async function handleApprove() {
    if (!selectedId) return;
    setAction("approve");
    setDetailError(null);
    try {
      await apiPost(`/api/review/${selectedId}`, { action: "approve" });
      setApprovedDone(true);
      setStatusLine("Aprovado. Pacote pronto para exportação.");
      await loadDetail(selectedId);
      await loadLists();
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : String(e));
    } finally {
      setAction(null);
    }
  }

  async function handleReject() {
    if (!selectedId) return;
    if (!rejectReason.trim()) {
      setDetailError("Um motivo é obrigatório para rejeitar.");
      return;
    }
    setAction("reject");
    setDetailError(null);
    try {
      await apiPost(`/api/review/${selectedId}`, {
        action: "reject",
        reason: rejectReason.trim(),
      });
      setStatusLine("Rejeitado.");
      await loadDetail(selectedId);
      await loadLists();
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : String(e));
    } finally {
      setAction(null);
    }
  }

  async function handleRequestRewrite() {
    if (!selectedId) return;
    setAction("rewrite");
    setDetailError(null);
    try {
      const job = await runJob(`/api/review/${selectedId}`, {
        action: "request-rewrite",
      });
      if (job.status === "FAILED") {
        throw new Error(job.error?.message ?? "Job de reescrita falhou");
      }
      setStatusLine("Reescrita solicitada. O roteiro foi enviado de volta para reescrita.");
      await loadDetail(selectedId);
      await loadLists();
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : String(e));
    } finally {
      setAction(null);
    }
  }

  const qa = detail?.qa;
  const blocked = qa?.decision?.toUpperCase() === "BLOCK";
  const hashtags = parseHashtags(detail?.metadata?.hashtagsJson ?? null);

  function renderList(items: VideoListItem[]) {
    return (
      <ul className="space-y-1">
        {items.map((v) => (
          <li key={v.id}>
            <button
              type="button"
              onClick={() => setSelectedId(v.id)}
              className={cn(
                "w-full rounded-md border p-3 text-left transition-colors hover:bg-accent",
                selectedId === v.id ? "border-primary bg-accent" : "border-border",
              )}
            >
              <div className="mb-1.5 line-clamp-2 text-sm font-medium">
                {v.title}
              </div>
              <StatusBadge status={v.status} />
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <PageHeader
        title="Prévia e Revisão de QA"
        description="Revise pontuações de QA e a lista de verificação humana antes de aprovar para exportação."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[22rem_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Aguardando Revisão</CardTitle>
            <CardDescription>Vídeos prontos para revisão de QA.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {listLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner /> Carregando...
              </div>
            ) : listError ? (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {listError}
              </div>
            ) : (
              <>
                {pending.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nada aguardando revisão.
                  </p>
                ) : (
                  renderList(pending)
                )}
                {done.length > 0 ? (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                        Aprovados / Exportados
                      </p>
                      {renderList(done)}
                    </div>
                  </>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {!selectedId ? (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <CheckCircle className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Selecione um vídeo para prévia e revisar seus resultados de QA.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : detailLoading && !detail ? (
            <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
              <Spinner /> Carregando vídeo...
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
                </CardHeader>
                <CardContent className="space-y-3">
                  {detail.video.previewFilePath ? (
                    <>
                      <video
                        controls
                        className="w-full max-w-md rounded-md border border-border bg-black"
                        src={detail.video.previewFilePath}
                      />
                      <p className="text-xs text-muted-foreground">
                        prévia em {detail.video.previewFilePath}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma prévia renderizada ainda.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">Resultados de QA</CardTitle>
                    {qa?.decision ? (
                      <StatusBadge status={qa.decision} />
                    ) : (
                      <Badge variant="secondary">sem execução de QA</Badge>
                    )}
                  </div>
                  {qa ? (
                    <CardDescription>
                      Pontuação geral{" "}
                      {qa.overallScore != null
                        ? qa.overallScore.toFixed(2)
                        : "-"}
                    </CardDescription>
                  ) : null}
                </CardHeader>
                {qa ? (
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <RiskBar
                        label="Risco de originalidade"
                        value={qa.originalityRiskScore}
                      />
                      <RiskBar label="Risco de conteúdo reutilizado" value={qa.reusedRiskScore} />
                      <RiskBar
                        label="Risco técnico"
                        value={qa.technicalRiskScore}
                      />
                    </div>
                    {qa.reasonCodes.length > 0 ? (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            Códigos de Motivo
                          </p>
                          {qa.reasonCodes.map((rc, i) => (
                            <div key={i} className="text-sm">
                              <span className="font-medium">{rc.code}:</span>{" "}
                              <span className="text-muted-foreground">
                                {rc.detail}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </CardContent>
                ) : (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Nenhuma execução de QA disponível para este vídeo ainda.
                    </p>
                  </CardContent>
                )}
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Metadados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {detail.metadata ? (
                    <>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Título
                        </p>
                        <p>{detail.metadata.title ?? "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Descrição
                        </p>
                        <p className="whitespace-pre-wrap text-muted-foreground">
                          {detail.metadata.description ?? "-"}
                        </p>
                      </div>
                      {hashtags.length > 0 ? (
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                            Hashtags
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {hashtags.map((h, i) => (
                              <Badge key={i} variant="outline">
                                {h}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {detail.metadata.pinnedComment ? (
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            Comentário Fixado
                          </p>
                          <p className="text-muted-foreground">
                            {detail.metadata.pinnedComment}
                          </p>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-muted-foreground">Nenhum metadado ainda.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Miniaturas ({detail.thumbnails.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {detail.thumbnails.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma miniatura ainda.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {detail.thumbnails.map((t) => (
                        <div
                          key={t.id}
                          className="space-y-1 rounded-md border border-border p-3 text-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{t.variantLabel}</span>
                            {t.isSelected ? (
                              <Badge variant="success">selecionada</Badge>
                            ) : null}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            legibilidade{" "}
                            {t.readabilityScore != null
                              ? t.readabilityScore.toFixed(2)
                              : "-"}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            similaridade{" "}
                            {t.similarityScore != null
                              ? t.similarityScore.toFixed(2)
                              : "-"}
                          </div>
                          {t.imagePath ? (
                            <div className="truncate text-[11px] text-muted-foreground">
                              {t.imagePath}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lista de Verificação Humana</CardTitle>
                  <CardDescription>
                    Apenas orientação. A aprovação está habilitada independentemente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {CHECKLIST.map((item, i) => (
                    <label
                      key={i}
                      className="flex cursor-pointer items-start gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={checked[i]}
                        onChange={(e) =>
                          setChecked((prev) => {
                            const next = [...prev];
                            next[i] = e.target.checked;
                            return next;
                          })
                        }
                      />
                      <span>
                        {i + 1}. {item}
                      </span>
                    </label>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Decisão</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {detailError ? (
                    <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                      {detailError}
                    </div>
                  ) : null}
                  {statusLine ? (
                    <div className="rounded-md border border-success/50 bg-success/10 p-3 text-sm text-success">
                      {statusLine}
                    </div>
                  ) : null}
                  {blocked ? (
                    <p className="text-xs text-destructive">
                      Decisão de QA é BLOQUEADO. A aprovação está desabilitada até que os
                      problemas de QA sejam resolvidos.
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={handleApprove}
                      disabled={action !== null || blocked}
                      title={
                        blocked
                          ? "Decisão de QA é BLOQUEADO; não é possível aprovar"
                          : undefined
                      }
                    >
                      {action === "approve" ? <Spinner /> : null}
                      Aprovar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRequestRewrite}
                      disabled={action !== null}
                    >
                      {action === "rewrite" ? <Spinner /> : null}
                      Solicitar Reescrita
                    </Button>
                    {approvedDone ? (
                      <Button asChild variant="secondary">
                        <Link href="/export">Ir para Exportação</Link>
                      </Button>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reject-reason">Motivo da rejeição</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        id="reject-reason"
                        placeholder="Por que está sendo rejeitado?"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        disabled={action !== null}
                        className="max-w-md"
                      />
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={action !== null}
                      >
                        {action === "reject" ? <Spinner /> : null}
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
