import { CheckCircle } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ReviewPage() {
  return (
    <>
      <PageHeader
        title="Preview & QA Review"
        description="Approve packages against the QA engine and human checklist before export."
      />

      <Card>
        <CardHeader>
          <CardTitle>Pending review</CardTitle>
          <CardDescription>
            Preview composed videos and confirm the six-question approval
            checklist before a package can be exported.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <CheckCircle className="h-8 w-8 text-muted-foreground" />
            <p className="max-w-md text-sm text-muted-foreground">
              Nothing awaiting review. Completed production packages will queue
              here with their QA scores and preview.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
