import fs from "fs";
import path from "path";

const moduleName = "module_5";
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const startTimestamp = Date.now();
const startedAt = new Date(startTimestamp).toISOString();

const logDir = path.resolve(__dirname, "..", "log");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const runningFile = path.join(logDir, `${moduleName}-${runId}-running.log`);

function append(obj: any) {
  fs.appendFileSync(runningFile, JSON.stringify(obj) + "\n");
}

// write header
append({ module: 5, startedAt, runId, env: process.env.NODE_ENV || "test" });

export function logEvent(
  testName: string,
  outcome: "success" | "error",
  message?: string
) {
  append({
    type: "event",
    test: testName,
    outcome,
    message,
    time: new Date().toISOString(),
  });
}

export function finalizeRun(successCount = 0, errorCount = 0) {
  const durationMs = Date.now() - startTimestamp;
  append({ success: successCount, errors: errorCount, durationMs });
  const status = errorCount > 0 ? "error" : "success";
  const finalName = path.join(
    logDir,
    `${moduleName}-${new Date().toISOString()}-${runId}-${status}.log`
  );
  try {
    if (fs.existsSync(runningFile)) {
      fs.renameSync(runningFile, finalName);
    } else {
      // running file missing: create final file containing header + summary
      const header = {
        module: 5,
        startedAt,
        runId,
        env: process.env.NODE_ENV || "test",
      };
      const summary = { success: successCount, errors: errorCount, durationMs };
      fs.writeFileSync(
        finalName,
        JSON.stringify(header) + "\n" + JSON.stringify(summary) + "\n"
      );
    }
  } catch (err) {
    // As a last resort, ensure finalName exists
    try {
      if (!fs.existsSync(finalName)) {
        fs.writeFileSync(
          finalName,
          JSON.stringify({
            module: 5,
            runId,
            status,
            success: successCount,
            errors: errorCount,
          }) + "\n"
        );
      }
    } catch {}
  }
  return finalName;
}

export default { logEvent, finalizeRun };
