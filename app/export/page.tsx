"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Package } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { apiGet, runJob } from "@/lib/client";

interface VideoListItem {
  id: string;
  title: string;
  status: string;
}

interface PublishPackage {
  exportFolderPath: string | null;
}

interface VideoDetail {
  video: {
    id: string;
    title: string;
    status: string;
  };
  publishPackage: PublishPackage | null;
}

const PACKAGE_FILES = [
  "final.mp4",
  "thumbnails",
  "metadata.json",
  "script.txt",
  "qa-report.json",
  "provenance.json",
  "upload-notes.md",
];

export default function ExportPage() {
  const [approved, setApproved] = useState<VideoListItem[]>([]);
  const [exported, setExported] = useState<VideoListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<VideoDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportFolder, setExportFolder] = useState<string | null>(null);

  const loadLists = useCallback(async () => {
    setListLoading(true);
    try {
      const [approvedRes, exportedRes] = await Promise.all([
        apiGet<{ videos: VideoListItem[] }>("/api/videos?status=APPROVED"),
        apiGet<{ videos: VideoListItem[] }>("/api/videos?status=EXPORTED"),
      ]);
      setApproved(approvedRes.videos ?? []);
      setExported(exportedRes.videos ?? []);
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
    setExportError(null);
    setExportFolder(null);
    if (selectedId) void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  async function handleExport() {
    if (!selectedId) return;
    setExporting(true);
    setExportError(null);
    try {
      const job = await runJob(`/api/videos/${selectedId}/export`);
      if (job.status === "FAILED") {
        throw new Error(job.error?.message ?? "Export job failed");
      }
      await loadDetail(selectedId);
      await loadLists();
    } catch (e) {
      setExportError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  }

  const isExported = detail?.video.status?.toUpperCase() === "EXPORTED";
  const folder = detail?.publishPackage?.exportFolderPath ?? exportFolder;

  function renderList(items: VideoListItem[], emptyText: string) {
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground">{emptyText}</p>;
    }
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
        title="Export Packages"
        description="Bundle approved videos into upload-ready folders with all assets."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[22rem_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Packages</CardTitle>
            <CardDescription>Approved and exported videos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {listLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner /> Loading...
              </div>
            ) : listError ? (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {listError}
              </div>
            ) : (
              <>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Ready to Export
                  </p>
                  {renderList(approved, "No approved videos.")}
                </div>
                <Separator />
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Exported
                  </p>
                  {renderList(exported, "No exported packages yet.")}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {!selectedId ? (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Select a video to export or inspect its package.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : detailLoading && !detail ? (
            <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
              <Spinner /> Loading...
            </div>
          ) : detailError && !detail ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {detailError}
            </div>
          ) : detail ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle>{detail.video.title}</CardTitle>
                  <StatusBadge status={detail.video.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {exportError ? (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    {exportError}
                  </div>
                ) : null}

                {!isExported ? (
                  <div>
                    <Button onClick={handleExport} disabled={exporting}>
                      {exporting ? <Spinner /> : <Package className="h-4 w-4" />}
                      Export Package
                    </Button>
                  </div>
                ) : null}

                {folder ? (
                  <div className="rounded-md border border-border bg-secondary/40 p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Export Folder
                    </p>
                    <p className="break-all text-sm">{folder}</p>
                    {isExported ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Folder is ready for manual upload.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {folder ? (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                      Package Checklist
                    </p>
                    <ul className="space-y-1">
                      {PACKAGE_FILES.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Check className="h-4 w-4 text-success" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Export this package to generate the upload-ready folder and
                    file checklist.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
