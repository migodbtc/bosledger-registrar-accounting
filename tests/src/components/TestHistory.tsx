import { TestResult } from "@/types/test";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface TestHistoryProps {
  results: TestResult[];
}

export const TestHistory = ({ results }: TestHistoryProps) => {
  const downloadResult = (result: TestResult) => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-result-${result.testCase.id}-${result.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("JSON result downloaded");
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "partial":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    const variants = {
      passed: "default",
      failed: "destructive",
      partial: "secondary"
    } as const;

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    );
  };

  const calculateAverageScore = (result: TestResult) => {
    const scores = Object.values(result.grading);
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  };

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No test results yet. Complete a test to see results here.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <Card key={result.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-lg flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  {result.testCase.title}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{result.moduleType}</Badge>
                  {getStatusBadge(result.status)}
                  <span className="text-sm text-muted-foreground">
                    Avg Score: {calculateAverageScore(result)}/5
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Tester:</span>
                <p className="font-medium">{result.testerName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Date:</span>
                <p className="font-medium">
                  {new Date(result.testDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Time:</span>
                <p className="font-medium">
                  {new Date(result.testDate).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Grading Breakdown:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Functional Accuracy:</span>
                  <span className="font-medium">{result.grading.functionalAccuracy}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">System Stability:</span>
                  <span className="font-medium">{result.grading.systemStability}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">UI/UX Consistency:</span>
                  <span className="font-medium">{result.grading.uiuxConsistency}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Security & Access:</span>
                  <span className="font-medium">{result.grading.securityAccess}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Performance:</span>
                  <span className="font-medium">{result.grading.performanceResponsiveness}/5</span>
                </div>
              </div>
            </div>

            {result.notes && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-2">Notes:</h4>
                <p className="text-sm text-muted-foreground">{result.notes}</p>
              </div>
            )}

            <Button
              onClick={() => downloadResult(result)}
              variant="outline"
              size="sm"
              className="w-full mt-2"
            >
              <Download className="w-4 h-4 mr-2" />
              Download JSON
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
