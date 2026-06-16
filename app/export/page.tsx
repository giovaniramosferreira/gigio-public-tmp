import { Package } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ExportPage() {
  return (
    <>
      <PageHeader
        title="Export Packages"
        description="Complete upload packages with video, thumbnail, metadata, and provenance."
      />

      <Card>
        <CardHeader>
          <CardTitle>Export packages</CardTitle>
          <CardDescription>
            Approved packages bundled for upload: mp4, thumbnail,
            metadata.json, and provenance.json.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Package className="h-8 w-8 text-muted-foreground" />
            <p className="max-w-md text-sm text-muted-foreground">
              No export packages yet. Approved reviews will produce downloadable
              upload bundles here.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
