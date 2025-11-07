import { useEffect, useMemo, useState } from "react";
import { TestResult } from "@/types/test";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface TestHistoryProps {
  results: TestResult[];
}

type SortOption =
  | "newest"
  | "oldest"
  | "module-asc"
  | "module-desc"
  | "score-desc"
  | "score-asc";

export const TestHistory = ({ results }: TestHistoryProps) => {
  const [filterModule, setFilterModule] = useState<string>("all");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  // helper to download a result
  const downloadResult = (result: TestResult) => {
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
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
      partial: "secondary",
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

  // derive available modules from results
  const modules = useMemo(() => {
    const set = new Set<string>();
    for (const r of results)
      set.add(r.moduleType || r.testCase.module || "Unknown");
    return ["all", ...Array.from(set).sort()];
  }, [results]);

  // apply filters and sorting
  const filtered = useMemo(() => {
    let out = results.slice();

    if (filterModule && filterModule !== "all") {
      out = out.filter(
        (r) => (r.moduleType || r.testCase.module) === filterModule
      );
    }

    if (startDate) {
      const s = new Date(startDate);
      out = out.filter((r) => new Date(r.testDate) >= s);
    }

    if (endDate) {
      const e = new Date(endDate);
      // include the entire day of endDate
      e.setHours(23, 59, 59, 999);
      out = out.filter((r) => new Date(r.testDate) <= e);
    }

    switch (sortOption) {
      case "newest":
        out.sort(
          (a, b) =>
            new Date(b.testDate).getTime() - new Date(a.testDate).getTime()
        );
        break;
      case "oldest":
        out.sort(
          (a, b) =>
            new Date(a.testDate).getTime() - new Date(b.testDate).getTime()
        );
        break;
      case "module-asc":
        out.sort((a, b) =>
          (a.moduleType || a.testCase.module || "").localeCompare(
            b.moduleType || b.testCase.module || ""
          )
        );
        break;
      case "module-desc":
        out.sort((a, b) =>
          (b.moduleType || b.testCase.module || "").localeCompare(
            a.moduleType || a.testCase.module || ""
          )
        );
        break;
      case "score-desc":
        out.sort(
          (a, b) =>
            parseFloat(calculateAverageScore(b)) -
            parseFloat(calculateAverageScore(a))
        );
        break;
      case "score-asc":
        out.sort(
          (a, b) =>
            parseFloat(calculateAverageScore(a)) -
            parseFloat(calculateAverageScore(b))
        );
        break;
    }

    return out;
  }, [results, filterModule, startDate, endDate, sortOption]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    // reset to first page when filters change
    setPage(1);
  }, [filterModule, startDate, endDate, sortOption, pageSize]);

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
      {/* Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm text-muted-foreground">Module</label>
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
            aria-label="Filter by module"
          >
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <label className="text-sm text-muted-foreground">From</label>
          <input
            type="date"
            className="border rounded px-2 py-1 text-sm"
            onChange={(e) => setStartDate(e.target.value || null)}
            value={startDate || ""}
          />
          <label className="text-sm text-muted-foreground">To</label>
          <input
            type="date"
            className="border rounded px-2 py-1 text-sm"
            onChange={(e) => setEndDate(e.target.value || null)}
            value={endDate || ""}
          />

          <label className="text-sm text-muted-foreground">Sort</label>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="module-asc">Module ↑</option>
            <option value="module-desc">Module ↓</option>
            <option value="score-desc">Score ↓</option>
            <option value="score-asc">Score ↑</option>
          </select>

          <button
            className="text-sm text-muted-foreground underline ml-2"
            onClick={() => {
              setFilterModule("all");
              setStartDate(null);
              setEndDate(null);
              setSortOption("newest");
              setPageSize(5);
            }}
          >
            Clear
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {paged.map((result) => (
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
                <h4 className="text-sm font-semibold mb-3">
                  Grading Breakdown:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Functional Accuracy:
                    </span>
                    <span className="font-medium">
                      {result.grading.functionalAccuracy}/5
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      System Stability:
                    </span>
                    <span className="font-medium">
                      {result.grading.systemStability}/5
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      UI/UX Consistency:
                    </span>
                    <span className="font-medium">
                      {result.grading.uiuxConsistency}/5
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Security & Access:
                    </span>
                    <span className="font-medium">
                      {result.grading.securityAccess}/5
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Performance:</span>
                    <span className="font-medium">
                      {result.grading.performanceResponsiveness}/5
                    </span>
                  </div>
                </div>
              </div>

              {result.notes && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-2">Notes:</h4>
                  <p className="text-sm text-muted-foreground">
                    {result.notes}
                  </p>
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

      {/* Pagination footer (jump to) */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filtered.length} result(s)
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage(1)}
            disabled={page === 1}
          >
            First
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </Button>
          <span className="text-sm">
            Page {page} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
          >
            Last
          </Button>
        </div>
      </div>
    </div>
  );
};
