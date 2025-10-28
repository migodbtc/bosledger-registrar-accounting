import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  List,
  FileText,
  CheckCircle,
  Info,
  SlidersHorizontal,
  ClipboardCheck,
  Archive,
  Hash,
  ArrowLeft,
} from "lucide-react";

type InputDef = {
  name: string;
  label?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
};
type TestDef = {
  id: string;
  title: string;
  route?: string;
  inputs?: InputDef[];
  file?: string;
  scope?: string[];
  preconditions?: string[];
  steps?: string[];
  acceptanceCriteria?: string[];
  notes?: string[];
  criteria?: {
    name: string;
    label?: string;
    description?: string;
    min?: number;
    max?: number;
    default?: number;
  }[];
};
type ModuleDef = { id: string; title?: string; tests: TestDef[] };

export default function E2ETestRunner() {
  const [manifest, setManifest] = useState<{
    generatedAt?: string;
    modules: ModuleDef[];
  } | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [testerName, setTesterName] = useState<string>("");

  function titleCase(s?: string) {
    if (!s) return s ?? "";
    return s
      .split(/[\s-_]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  useEffect(() => {
    fetch("/tests-e2e-manifest.json")
      .then((r) => r.json())
      .then((m) => setManifest(m))
      .catch(() => setManifest(null));
  }, []);

  const moduleObj =
    manifest?.modules.find((m) => m.id === selectedModule) ?? null;
  const testObj = moduleObj?.tests.find((t) => t.id === selectedTest) ?? null;

  useEffect(() => {
    const initial: Record<string, string> = {};
    testObj?.inputs?.forEach((i) => {
      initial[i.name] = "";
    });
    setValues(initial);

    // initialize ratings for criteria (if any)
    const initialRatings: Record<string, string> = {};
    testObj?.criteria?.forEach((c) => {
      initialRatings[c.name] = String(c.default ?? 3);
    });
    setRatings(initialRatings);
  }, [selectedTest]);

  function onChangeInput(name: string, v: string) {
    setValues((s) => ({ ...s, [name]: v }));
  }

  function openInApp() {
    if (!testObj || !testObj.route) return;
    const params = new URLSearchParams(values).toString();
    const url = `${window.location.origin}${testObj.route}${
      params ? `?${params}` : ""
    }`;
    window.open(url, "_blank");
  }

  function downloadJSON() {
    if (!testObj) return;
    const payload = {
      testId: testObj.id,
      route: testObj.route,
      tester: testerName || null,
      downloadedAt: new Date().toISOString(),
      inputs: values,
      ratings: Object.fromEntries(
        Object.entries(ratings).map(([k, v]) => [k, Number(v)])
      ),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    // include sanitized timestamp in filename to keep exports unique
    const now = new Date();
    const ts = now.toISOString().replace(/[:.]/g, "-");
    a.download = `${testObj.id}_${ts}.json`;
    a.click();
    // revoke object URL shortly after click
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  }

  if (!manifest) return <div style={{ padding: 24 }}>Loading manifest...</div>;

  const isDev = Boolean(import.meta.env.DEV);

  return (
    <div style={{ maxWidth: 960, margin: "24px auto", padding: 12 }}>
      <Card>
        <CardHeader
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button
              variant="ghost"
              size={"sm"}
              onClick={() => (window.location.href = "/dashboard")}
            >
              <ArrowLeft size={16} />
            </Button>
            <CardTitle
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <ClipboardCheck size={18} />
              E2E Test Runner
            </CardTitle>
          </div>
          <CardDescription>
            A simple interactive runner for end-to-end tests defined in JSON for
            the sake of external QA testing.
            <br />
            This interactive runner is tailor-fit to the design and development
            of Bosledger.
            <br />
            Pick a module and a test to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Archive size={16} />
              <Label>Module</Label>
            </div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
              Select a module to load its available tests.
            </div>
            <Select
              value={selectedModule ?? ""}
              onValueChange={(v) => {
                setSelectedModule(v || null);
                setSelectedTest(null);
              }}
            >
              <SelectTrigger>
                <SelectValue>
                  {selectedModule
                    ? titleCase(
                        manifest.modules.find((m) => m.id === selectedModule)
                          ?.title ?? selectedModule
                      )
                    : "-- Choose module --"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {manifest.modules.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {titleCase(m.title ?? m.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {moduleObj && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Hash size={16} />
                <Label>Test</Label>
              </div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                Choose a test to view steps, preconditions and rate criteria.
              </div>
              <Select
                value={selectedTest ?? ""}
                onValueChange={(v) => setSelectedTest(v || null)}
              >
                <SelectTrigger>
                  <SelectValue>
                    {selectedTest
                      ? moduleObj.tests.find((t) => t.id === selectedTest)
                          ?.title ?? selectedTest
                      : "-- choose test --"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {moduleObj.tests.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title ?? t.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* testerName moved inside active test view (before Criteria) */}

          {testObj && (
            <div style={{ marginTop: 16 }}>
              {/* Render test sections if present */}
              {testObj.scope && testObj.scope.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <List size={16} />
                    <Label>Scope</Label>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      border: "1px solid #eee",
                      borderRadius: 8,
                      padding: 10,
                      background: "#fff",
                    }}
                  >
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {testObj.scope.map((s, i) => (
                        <li key={i} style={{ marginBottom: 8 }}>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {testObj.preconditions && testObj.preconditions.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <FileText size={16} />
                    <Label>Preconditions</Label>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      border: "1px solid #eee",
                      borderRadius: 8,
                      padding: 10,
                      background: "#fff",
                    }}
                  >
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {testObj.preconditions.map((p, i) => (
                        <li key={i} style={{ marginBottom: 8 }}>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {testObj.steps && testObj.steps.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <CheckCircle size={16} />
                    <Label>Steps</Label>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      border: "1px solid #eee",
                      borderRadius: 8,
                      padding: 10,
                      background: "#fff",
                    }}
                  >
                    <ol style={{ margin: 0, paddingLeft: 18 }}>
                      {testObj.steps.map((st, i) => (
                        <li key={i} style={{ marginBottom: 8 }}>
                          {st}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {testObj.acceptanceCriteria &&
                testObj.acceptanceCriteria.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <SlidersHorizontal size={16} />
                      <Label>Acceptance criteria</Label>
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        border: "1px solid #eee",
                        borderRadius: 8,
                        padding: 10,
                        background: "#fff",
                      }}
                    >
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {testObj.acceptanceCriteria.map((ac, i) => (
                          <li key={i} style={{ marginBottom: 8 }}>
                            {ac}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

              {testObj.notes && testObj.notes.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Info size={16} />
                    <Label>Notes</Label>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      border: "1px solid #eee",
                      borderRadius: 8,
                      padding: 10,
                      background: "#fff",
                    }}
                  >
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {testObj.notes.map((n, i) => (
                        <li key={i} style={{ marginBottom: 8 }}>
                          {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tester name input (placed before Criteria) */}
              <div style={{ marginTop: 12 }}>
                <Label>Tester name</Label>
                <Input
                  placeholder="Your name"
                  value={testerName}
                  onChange={(e) => setTesterName(e.target.value)}
                />
              </div>

              {testObj.criteria && testObj.criteria.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Label>Criteria / Ratings (1 = low, 5 = high)</Label>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                    Rate each criterion from 1 (poor/low) to 5 (excellent/high).
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      display: "grid",
                      gap: 8,
                      border: "1px solid #eee",
                      borderRadius: 8,
                      padding: 8,
                      background: "linear-gradient(180deg, #fff, #fbfbfb)",
                    }}
                  >
                    {testObj.criteria.map((c, idx) => (
                      <div
                        key={c.name}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 220px",
                          gap: 12,
                          alignItems: "center",
                          padding: 8,
                          borderRadius: 6,
                          background: idx % 2 === 0 ? "#fff" : "#fcfcfc",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>
                            {c.label ?? c.name}
                          </div>
                          {c.description && (
                            <div
                              style={{
                                fontSize: 13,
                                color: "#666",
                                marginTop: 4,
                              }}
                            >
                              {c.description}
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <RadioGroup
                            value={ratings[c.name] ?? String(c.default ?? 3)}
                            onValueChange={(v) =>
                              setRatings((s) => ({ ...s, [c.name]: v }))
                            }
                            aria-label={c.label ?? c.name}
                          >
                            <div style={{ display: "flex", gap: 12 }}>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <label
                                  key={n}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <RadioGroupItem value={String(n)} />
                                  <span
                                    style={{
                                      fontSize: 13,
                                      minWidth: 16,
                                      textAlign: "center",
                                    }}
                                  >
                                    {n}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inputs are shown only if present in the manifest */}

              {testObj.inputs?.map((inp) => (
                <div key={inp.name} style={{ marginTop: 8 }}>
                  <Label>
                    {inp.label ?? inp.name}
                    {inp.required ? " *" : ""}
                  </Label>
                  <Input
                    type={inp.type ?? "text"}
                    placeholder={inp.placeholder ?? ""}
                    value={values[inp.name] ?? ""}
                    onChange={(e) => onChangeInput(inp.name, e.target.value)}
                  />
                </div>
              ))}

              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <Button onClick={downloadJSON}>Download result</Button>
              </div>

              {!isDev && (
                <p style={{ marginTop: 8, color: "#b33" }}>
                  This runner is for development only. Enable
                  `import.meta.env.DEV` to use Open in app.
                </p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter />
      </Card>
    </div>
  );
}
