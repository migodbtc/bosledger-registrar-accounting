import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";

const MODULE = "module_2";
const logDir = path.resolve(__dirname, "..", "log");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// We'll write to a temporary running file and then finalize with status in filename
const runId = `${Date.now()}-${randomBytes(4).toString("hex")}`;
const tmpFile = path.join(logDir, `${MODULE}-${runId}-running.log`);

let successCount = 0;
let errorCount = 0;
let events: any[] = [];

function writeLine(obj: any) {
  fs.appendFileSync(tmpFile, JSON.stringify(obj) + "\n");
}

// Header per supabase testing guidelines
const header = {
  module: 2,
  startedAt: new Date().toISOString(),
  runId,
  env: process.env.NODE_ENV || "test",
};
writeLine(header);

export function logEvent(event: any) {
  events.push(event);
  writeLine(event);
}

export function logSuccess(testName: string, message?: string) {
  successCount++;
  const entry = {
    type: "event",
    outcome: "success",
    test: testName,
    message,
    time: new Date().toISOString(),
  };
  logEvent(entry);
}

export function logError(testName: string, error: unknown) {
  errorCount++;
  const entry = {
    type: "event",
    outcome: "error",
    test: testName,
    error: String(error),
    time: new Date().toISOString(),
  };
  logEvent(entry);
}

export function getCounts() {
  return { success: successCount, error: errorCount };
}

export function finalizeRun() {
  const summary = {
    success: successCount,
    errors: errorCount,
    durationMs: Date.now() - Number(runId.split("-")[0]),
  };
  writeLine(summary);
  // rename file to include status
  const status = errorCount > 0 ? "error" : "success";
  const finalName = path.join(
    logDir,
    `${MODULE}-${new Date()
      .toISOString()
      .replace(/:/g, "-")}-${runId}-${status}.log`
  );
  fs.renameSync(tmpFile, finalName);
  return { finalName, summary };
}
