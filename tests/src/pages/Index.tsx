import { useState } from "react";
import { TestCase, TestResult, Module } from "@/types/test";
import { testCasesByModule, allModules } from "@/data/testCases";
import { TestCard } from "@/components/TestCard";
import { GradingForm } from "@/components/GradingForm";
import { TestHistory } from "@/components/TestHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, History, Sparkles } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [selectedModule, setSelectedModule] = useState<Module>("Mod 2: Basic Website Structure");
  const [activeTest, setActiveTest] = useState<TestCase | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const handleStartTest = (testCase: TestCase) => {
    setActiveTest(testCase);
  };

  const handleBackToTests = () => {
    setActiveTest(null);
  };

  const handleSubmitResult = (result: TestResult) => {
    setTestResults(prev => [result, ...prev]);
    setActiveTest(null);
    toast.success("Test result submitted successfully!");
  };

  const currentTests = testCasesByModule[selectedModule];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg hypatia-gradient-bg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold hypatia-gradient">
                Bosledger QA Test Generator
              </h1>
              <p className="text-sm text-muted-foreground">
                Quality Assurance Testing & Result Logger
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {activeTest ? (
          <GradingForm
            testCase={activeTest}
            onBack={handleBackToTests}
            onSubmit={handleSubmitResult}
          />
        ) : (
          <Tabs defaultValue="tests" className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="tests" className="gap-2">
                <ClipboardList className="w-4 h-4" />
                Test Cases
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="w-4 h-4" />
                Test History ({testResults.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tests" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Available Test Cases</h2>
                  <p className="text-muted-foreground mt-1">
                    Select a module to view and execute test cases
                  </p>
                </div>
                
                <Select value={selectedModule} onValueChange={(value) => setSelectedModule(value as Module)}>
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    {allModules.map((module) => (
                      <SelectItem key={module} value={module}>
                        {module}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentTests.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-fr">
                  {currentTests.map((testCase) => (
                    <TestCard
                      key={testCase.id}
                      testCase={testCase}
                      onStartTest={handleStartTest}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Test Cases Available</h3>
                  <p className="text-muted-foreground">
                    No test cases have been defined for {selectedModule} yet.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold">Test History</h2>
                <p className="text-muted-foreground mt-1">
                  View all completed test results and download JSON logs
                </p>
              </div>

              <TestHistory results={testResults} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default Index;
