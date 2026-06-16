import { Clapperboard } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProductionPage() {
  return (
    <>
      <PageHeader
        title="Production Job Monitor"
        description="Track voiceover, scene asset, caption, and video assembly jobs."
      />

      <Card>
        <CardHeader>
          <CardTitle>Production jobs</CardTitle>
          <CardDescription>
            Live status of render jobs across voiceover, scene generation,
            captioning, and FFmpeg assembly stages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Clapperboard className="h-8 w-8 text-muted-foreground" />
            <p className="max-w-md text-sm text-muted-foreground">
              No jobs running. Approved scripts queued for production will
              appear here with per-stage progress.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
