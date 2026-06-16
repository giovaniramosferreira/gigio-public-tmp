import { BarChart3 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Analytics"
        description="Track performance patterns to inform future content decisions."
      />

      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
          <CardDescription>
            Aggregated metrics and surfaced patterns across published packages
            and editorial pillars.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
            <p className="max-w-md text-sm text-muted-foreground">
              No analytics available. Publish and connect performance data to
              surface pillar and format trends.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
