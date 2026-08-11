import { Badge, type BadgeProps } from "@/components/ui/badge";

type Variant = NonNullable<BadgeProps["variant"]>;

/** Map a backend status string to a Badge variant. */
function variantForStatus(status: string): Variant {
  const s = status.toUpperCase();
  if (s === "BLOCKED" || s === "FAILED") return "destructive";
  if (
    s.startsWith("APPROVED") ||
    s === "COMPLETED" ||
    s === "PASS"
  ) {
    return "success";
  }
  if (
    s.includes("REVIEW") ||
    s === "REWRITE" ||
    s === "RUNNING" ||
    s === "CONCERN"
  ) {
    return "warning";
  }
  return "secondary";
}

/** Translate backend status codes to Brazilian Portuguese labels. */
const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  SCORED: "Pontuado",
  SELECTED: "Selecionado",
  SCRIPT_READY: "Roteiro Pronto",
  CRITIC_REVIEW: "Em Revisão",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  BLOCKED: "Bloqueado",
  QUEUED: "Na Fila",
  RUNNING: "Executando",
  COMPLETED: "Concluído",
  FAILED: "Falhou",
  PENDING: "Pendente",
  IN_PRODUCTION: "Em Produção",
  PASS: "Aprovado",
  REVIEW: "Em Revisão",
  BLOCK: "Bloqueado",
  EXPORTED: "Exportado",
  REVIEW_READY: "Pronto para Revisão",
  REWRITE: "Reescrever",
  CONCERN: "Atenção",
};

function labelForStatus(status: string): string {
  return STATUS_LABELS[status.toUpperCase()] ?? status;
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={variantForStatus(status)}>{labelForStatus(status)}</Badge>;
}
