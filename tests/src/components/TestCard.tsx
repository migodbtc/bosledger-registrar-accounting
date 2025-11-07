import { TestCase } from "@/types/test";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ClipboardList } from "lucide-react";

interface TestCardProps {
  testCase: TestCase;
  onStartTest: (testCase: TestCase) => void;
}

export const TestCard = ({ testCase, onStartTest }: TestCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col h-[400px]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-base leading-tight">
              {testCase.title}
            </CardTitle>
            <CardDescription>
              <Badge variant="outline" className="mt-2 text-xs">
                {testCase.module}
              </Badge>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 overflow-auto thin-scrollbar">
        {testCase.prerequisites.length > 0 && (
          <div className="flex-shrink-0">
            <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground">
              Prerequisites:
            </h4>
            <ul className="text-xs space-y-1">
              {testCase.prerequisites.slice(0, 2).map((prereq, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                  <span className="line-clamp-2">{prereq}</span>
                </li>
              ))}
              {testCase.prerequisites.length > 2 && (
                <li className="text-muted-foreground italic">
                  +{testCase.prerequisites.length - 2} more
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="flex-shrink-0">
          <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground">
            Steps:
          </h4>
          <ol className="text-xs space-y-1 list-decimal list-inside">
            {testCase.steps.slice(0, 3).map((step, idx) => (
              <li key={idx} className="line-clamp-2">
                {step}
              </li>
            ))}
            {testCase.steps.length > 3 && (
              <li className="text-muted-foreground italic list-none">
                +{testCase.steps.length - 3} more steps
              </li>
            )}
          </ol>
        </div>

        <div className="flex-shrink-0">
          <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground">
            Success Criteria:
          </h4>
          <p className="text-xs line-clamp-3">{testCase.successCriteria}</p>
        </div>

        <div className="mt-auto pt-3 flex-shrink-0">
          <Button
            onClick={() => onStartTest(testCase)}
            className="w-full hypatia-gradient-bg hover:opacity-90 transition-opacity"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Start Test
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
