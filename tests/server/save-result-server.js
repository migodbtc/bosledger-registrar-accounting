#!/usr/bin/env node
/**
 * Simple local server to persist test result JSON files into ./results
 * Usage: node server/save-result-server.js
 * This is intended for local dev only. It listens on localhost and accepts
 * POST /save-result with a JSON body representing TestResult.
 */

const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");

const app = express();
const port = process.env.SAVE_SERVER_PORT || 5002;

app.use(express.json({ limit: "1mb" }));

// CORS for local dev (vite on different port)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:8081");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const RESULTS_DIR = path.resolve(__dirname, "..", "results");

if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

function safeFileName(name) {
  return name.replace(/[^a-z0-9-_\.]/gi, "-").toLowerCase();
}

app.post("/save-result", (req, res) => {
  try {
    const result = req.body;
    if (!result || !result.testCase || !result.testCase.id) {
      return res.status(400).json({ error: "Invalid result payload" });
    }

    const timestamp = Date.now();
    const modulePart = safeFileName(
      result.moduleType || result.testCase.module || "module"
    );
    const testId = safeFileName(result.testCase.id || "test");
    const fileName = `test-result-${modulePart}-${testId}-result-${timestamp}.json`;
    const filePath = path.join(RESULTS_DIR, fileName);

    fs.writeFile(filePath, JSON.stringify(result, null, 2) + os.EOL, (err) => {
      if (err) {
        console.error("Error saving result file", err);
        return res.status(500).json({ error: "Failed to write file" });
      }

      return res.status(201).json({ saved: true, file: fileName });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.get("/results", (req, res) => {
  // list files
  fs.readdir(RESULTS_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: "failed to read results" });
    const jsonFiles = files.filter((f) => f.endsWith(".json"));
    res.json({ files: jsonFiles });
  });
});

app.listen(port, () => {
  console.log(`Save-result server listening on http://localhost:${port}`);
});
