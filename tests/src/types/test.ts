export type Module = 
  | "Mod 1: Foundationals"
  | "Mod 2: Basic Website Structure"
  | "Mod 3: Authentication"
  | "Mod 4: Student Operations"
  | "Mod 5: Registrar Operations"
  | "Mod 6: Accounting Operations"
  | "Mod 7: Administrative Operations"
  | "Mod 8: Polishing & Finalization";

export interface TestCase {
  id: string;
  module: Module;
  title: string;
  prerequisites: string[];
  steps: string[];
  successCriteria: string;
}

export interface GradingCriteria {
  functionalAccuracy: number;
  systemStability: number;
  uiuxConsistency: number;
  securityAccess: number;
  performanceResponsiveness: number;
}

export interface TestResult {
  id: string;
  testCase: TestCase;
  testerName: string;
  testDate: string;
  moduleType: Module;
  grading: GradingCriteria;
  notes?: string;
  status: "passed" | "failed" | "partial";
}
