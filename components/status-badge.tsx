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

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={variantForStatus(status)}>{status}</Badge>;
}
