import { FileText } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ScriptsPage() {
  return (
    <>
      <PageHeader
        title="Script Review Workspace"
        description="Review generated scripts with hooks, beat plans, and critic passes."
      />

      <Card>
        <CardHeader>
          <CardTitle>Scripts</CardTitle>
          <CardDescription>
            Differentiated scripts awaiting review against originality and
            editorial-quality standards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="max-w-md text-sm text-muted-foreground">
              No scripts in the workspace. Promote an idea to script generation
              to begin reviewing hooks and beat plans here.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
