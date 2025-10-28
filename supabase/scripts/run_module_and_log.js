const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const repoDir = path.resolve(__dirname, "..");
const moduleArg = process.argv[2] || "module_3";
// tests are under src/tests/e2e/<module>/index.ts
const runner = `src/tests/e2e/${moduleArg}/index.ts`;
const logsDir = path.join(repoDir, "src", "tests", "e2e", moduleArg, "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const logPath = path.join(logsDir, `${timestamp}.log`);

console.log(`Running ${moduleArg} tests and writing log to ${logPath}`);
const out = fs.createWriteStream(logPath, { flags: "a" });

// Use npx to invoke ts-node so we don't require ts-node globally.
const child = spawn("npx", ["ts-node", runner], {
  cwd: repoDir,
  shell: true,
  env: process.env,
});

child.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
  out.write(chunk);
});
child.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
  out.write(chunk);
});

child.on("close", (code) => {
  const msg = `\nProcess exited with code ${code}\n`;
  out.write(msg);
  out.end();
  console.log(msg);
  process.exit(code);
});
