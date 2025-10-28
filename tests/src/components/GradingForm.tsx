import { useState } from "react";
import { TestCase, GradingCriteria, TestResult } from "@/types/test";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";

interface GradingFormProps {
  testCase: TestCase;
  onBack: () => void;
  onSubmit: (result: TestResult) => void;
}

const gradingCriteria = [
  { key: "functionalAccuracy" as keyof GradingCriteria, label: "Functional Accuracy" },
  { key: "systemStability" as keyof GradingCriteria, label: "System Stability & Error Handling" },
  { key: "uiuxConsistency" as keyof GradingCriteria, label: "UI/UX Consistency" },
  { key: "securityAccess" as keyof GradingCriteria, label: "Security & Access Control" },
  { key: "performanceResponsiveness" as keyof GradingCriteria, label: "Performance & Responsiveness" }
];

export const GradingForm = ({ testCase, onBack, onSubmit }: GradingFormProps) => {
  const [testerName, setTesterName] = useState("");
  const [notes, setNotes] = useState("");
  const [grading, setGrading] = useState<GradingCriteria>({
    functionalAccuracy: 0,
    systemStability: 0,
    uiuxConsistency: 0,
    securityAccess: 0,
    performanceResponsiveness: 0
  });

  const handleGradingChange = (key: keyof GradingCriteria, value: string) => {
    setGrading(prev => ({ ...prev, [key]: parseInt(value) }));
  };

  const calculateStatus = (): "passed" | "failed" | "partial" => {
    const scores = Object.values(grading);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    if (average >= 4) return "passed";
    if (average >= 3) return "partial";
    return "failed";
  };

  const handleSubmit = () => {
    if (!testerName.trim()) {
      toast.error("Please enter tester name");
      return;
    }

    const allGraded = Object.values(grading).every(score => score > 0);
    if (!allGraded) {
      toast.error("Please complete all grading criteria");
      return;
    }

    const result: TestResult = {
      id: `result-${Date.now()}`,
      testCase,
      testerName,
      testDate: new Date().toISOString(),
      moduleType: testCase.module,
      grading,
      notes: notes.trim() || undefined,
      status: calculateStatus()
    };

    onSubmit(result);
  };

  const downloadJSON = () => {
    const allGraded = Object.values(grading).every(score => score > 0);
    if (!allGraded || !testerName.trim()) {
      toast.error("Please complete the form before downloading");
      return;
    }

    const result: TestResult = {
      id: `result-${Date.now()}`,
      testCase,
      testerName,
      testDate: new Date().toISOString(),
      moduleType: testCase.module,
      grading,
      notes: notes.trim() || undefined,
      status: calculateStatus()
    };

    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-result-${testCase.id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("JSON result downloaded");
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Tests
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{testCase.title}</CardTitle>
          <CardDescription>{testCase.module}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-base">Test Instructions</h3>
            
            {testCase.prerequisites.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Prerequisites:</h4>
                <ul className="text-sm space-y-1">
                  {testCase.prerequisites.map((prereq, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{prereq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Steps to Complete:</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                {testCase.steps.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">{step}</li>
                ))}
              </ol>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Success Criteria:</h4>
              <p className="text-sm leading-relaxed">{testCase.successCriteria}</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="testerName">Tester Name *</Label>
              <Input
                id="testerName"
                value={testerName}
                onChange={(e) => setTesterName(e.target.value)}
                placeholder="Enter your name"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Test Date</Label>
              <Input
                value={new Date().toLocaleDateString()}
                disabled
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="border-t pt-6 space-y-6">
            <h3 className="text-lg font-semibold">Grading Criteria (1-5 Scale)</h3>
            
            {gradingCriteria.map(({ key, label }) => (
              <div key={key} className="space-y-3">
                <Label className="text-base">{label} *</Label>
                <RadioGroup
                  value={grading[key].toString()}
                  onValueChange={(value) => handleGradingChange(key, value)}
                  className="flex gap-4"
                >
                  {[1, 2, 3, 4, 5].map((score) => (
                    <div key={score} className="flex items-center space-x-2">
                      <RadioGroupItem value={score.toString()} id={`${key}-${score}`} />
                      <Label htmlFor={`${key}-${score}`} className="cursor-pointer">
                        {score}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional observations or comments..."
              className="mt-1.5 min-h-[100px]"
            />
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleSubmit}
              className="flex-1 hypatia-gradient-bg hover:opacity-90"
            >
              Submit Test Result
            </Button>
            <Button 
              onClick={downloadJSON}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
