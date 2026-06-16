import { Lightbulb } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function IdeasPage() {
  return (
    <>
      <PageHeader
        title="Idea Discovery"
        description="Generate and rank original topic ideas from editorial pillars."
      />

      <Card>
        <CardHeader>
          <CardTitle>Discover topics</CardTitle>
          <CardDescription>
            Select a content pillar to generate a ranked list of candidate
            ideas scored for originality and editorial fit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Lightbulb className="h-8 w-8 text-muted-foreground" />
            <p className="max-w-md text-sm text-muted-foreground">
              No ideas generated yet. Pick a pillar and run discovery to
              populate a ranked backlog of candidate topics.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
