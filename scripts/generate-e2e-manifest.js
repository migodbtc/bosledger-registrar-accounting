#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const E2E_DIR = path.join(__dirname, "..", "tests", "e2e");
const WEB_PUBLIC = path.join(__dirname, "..", "web", "public");

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch (e) {
    return null;
  }
}

function findModuleDirs() {
  return fs
    .readdirSync(E2E_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function extractMeta(content) {
  // title from first heading
  const titleMatch = content.match(/^#\s*(.+)/m);
  const title = titleMatch ? titleMatch[1].trim() : null;

  // Test ID line
  const idMatch = content.match(/Test ID:\s*(.+)/i);
  const testId = idMatch ? idMatch[1].trim() : null;

  // Try to find a route in the file using a simple regex for `/something` occurrences
  const routeMatches = Array.from(
    new Set(content.match(/\/[-A-Za-z0-9_\/]+/g) || [])
  );
  // prefer routes that start with / (and not markdown links)
  const routes = routeMatches.map((r) => r.trim()).filter((r) => r.length > 1);

  return { title, testId, routes };
}

function extractSections(content) {
  const headers = [
    "Scope",
    "Preconditions",
    "Steps",
    "Acceptance Criteria",
    "Notes",
    "Criteria",
  ];

  const sections = {};

  // Map readable header to target key
  const keyMap = {
    Scope: "scope",
    Preconditions: "preconditions",
    Steps: "steps",
    "Acceptance Criteria": "acceptanceCriteria",
    Notes: "notes",
    Criteria: "criteria",
  };

  // Find header positions robustly: accept Markdown headings (## Scope, ### Steps:) or plain lines "Scope" or "Scope:" (case-insensitive)
  const positions = {};

  headers.forEach((h) => {
    const esc = h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // regex: optional leading #s, optional spaces, header text, optional colon, line end
    const re = new RegExp("^(?:#{1,6}\\s*)?" + esc + "\\s*:?\\s*$", "gim");
    const m = re.exec(content);
    if (m) {
      positions[h] = { index: m.index, length: m[0].length };
    } else {
      positions[h] = null;
    }
  });

  // For each found header, extract content until the next header (earliest index > current)
  headers.forEach((h) => {
    const pos = positions[h];
    if (!pos) return;
    let nextIdx = content.length;
    Object.keys(positions).forEach((hh) => {
      const other = positions[hh];
      if (other && other.index > pos.index && other.index < nextIdx)
        nextIdx = other.index;
    });

    // header ends at pos.index + pos.length
    const afterHeader = pos.index + pos.length;
    const raw = content.substring(afterHeader, nextIdx).trim();

    if (keyMap[h] === "steps") {
      const lines = raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const steps = lines
        .map((l) => {
          const m = l.match(/^\d+\.\s*(.+)$/);
          return m ? m[1].trim() : l.replace(/^[-*]\s*/, "");
        })
        .filter(Boolean);
      sections.steps = steps;
    } else if (keyMap[h] === "acceptanceCriteria") {
      const lines = raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const ac = lines.map((l) => l.replace(/^[-*]\s*/, "")).filter(Boolean);
      sections.acceptanceCriteria = ac;
    } else if (keyMap[h] === "criteria") {
      // parse criteria lines into objects
      // allow formats:
      // - name | label | description | default
      // - Label — description
      // - label (fallback)
      const lines = raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const items = lines.map((l) => {
        const line = l.replace(/^[-*]\s*/, "");
        if (line.indexOf("|") !== -1) {
          const parts = line.split("|").map((p) => p.trim());
          const name = parts[0] || parts[1] || "";
          const label = parts[1] || parts[0] || name;
          const description = parts[2] || "";
          const def = parts[3] ? Number(parts[3]) : undefined;
          return {
            name: slugify(name || label),
            label: label || name,
            description,
            default: def,
          };
        }
        const em = line.split(/\s+[—–-]\s+/);
        if (em.length >= 2) {
          const label = em[0].trim();
          const description = em.slice(1).join(" - ").trim();
          return {
            name: slugify(label),
            label,
            description,
            default: undefined,
          };
        }
        return {
          name: slugify(line),
          label: line,
          description: "",
          default: undefined,
        };
      });
      sections.criteria = items;
    } else {
      const lines = raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const bullets = lines
        .map((l) => l.replace(/^[-*]\s*/, ""))
        .filter(Boolean);
      sections[keyMap[h]] = bullets;
    }
  });

  return sections;
}

// simple slugify for names
function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[\s\/]+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .replace(/^-+|-+$/g, "");
}

// parse YAML frontmatter for criteria block if present
function parseFrontmatterCriteria(content) {
  const fm = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const body = fm[1];
  // find criteria: block
  const critIndex = body.search(/\bcriteria\s*:\s*\n/i);
  if (critIndex === -1) return null;
  const criteriaBlock = body.slice(critIndex).replace(/^[^\n]*:\s*\n/, "");
  // split items starting with '-'
  const rawItems = criteriaBlock
    .split(/\n(?=-\s)/)
    .map((s) => s.trim())
    .filter(Boolean);
  const items = [];
  rawItems.forEach((ri) => {
    const lines = ri
      .split(/\n/)
      .map((l) => l.replace(/^[-\s]*/, "").trim())
      .filter(Boolean);
    const props = {};
    lines.forEach((l) => {
      const mm = l.match(/^([a-zA-Z0-9_\-]+):\s*(.*)$/);
      if (mm) props[mm[1].trim()] = mm[2].trim();
    });
    if (Object.keys(props).length > 0) {
      items.push({
        name: props.name || slugify(props.label || ""),
        label: props.label || props.name || "",
        description: props.description || "",
        default: props.default ? Number(props.default) : undefined,
      });
    }
  });
  return items.length > 0 ? items : null;
}

function buildManifest() {
  const modules = [];
  const moduleDirs = findModuleDirs();

  moduleDirs.forEach((md) => {
    const modulePath = path.join(E2E_DIR, md);
    const files = fs.readdirSync(modulePath).filter((f) => f.endsWith(".md"));
    const tests = [];
    files.forEach((f) => {
      if (f.toLowerCase() === "readme.md") return; // skip index
      const full = path.join(modulePath, f);
      const content = readFileSafe(full);
      if (!content) return;
      const meta = extractMeta(content);
      const sections = extractSections(content);
      const fmCriteria = parseFrontmatterCriteria(content);
      // prefer frontmatter criteria, then section criteria
      let criteria = fmCriteria || sections.criteria || [];
      // if no criteria declared, inject sensible defaults
      if (!criteria || criteria.length === 0) {
        criteria = [
          {
            name: "navigation",
            label: "Navigation clarity",
            description: "Was navigation clear and discoverable?",
            default: 3,
          },
          {
            name: "understandability",
            label: "Understandability",
            description: "Could a new user understand the flow quickly?",
            default: 3,
          },
          {
            name: "difficulty",
            label: "Difficulty",
            description: "How difficult was the task?",
            default: 3,
          },
        ];
      }
      const id = meta.testId || f.replace(/\.md$/i, "");
      const title = meta.title || id;
      const route =
        meta.routes && meta.routes.length > 0 ? meta.routes[0] : null;
      tests.push({
        id,
        title,
        file: path.relative(E2E_DIR, full).replace(/\\/g, "/"),
        route,
        inputs: [],
        // include extracted sections when present
        scope: sections.scope || [],
        preconditions: sections.preconditions || [],
        steps: sections.steps || [],
        acceptanceCriteria: sections.acceptanceCriteria || [],
        notes: sections.Notes || sections.notes || [],
        // criteria array of { name, label, description, default }
        criteria: criteria && criteria.length > 0 ? criteria : null,
      });
    });
    modules.push({ id: md, title: md.replace(/_/g, " "), tests });
  });

  return { generatedAt: new Date().toISOString(), modules };
}

function writeOutputs(manifest) {
  const outPath = path.join(E2E_DIR, "manifest.json");
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  console.log("Wrote", outPath);

  // also copy to web/public if exists
  if (fs.existsSync(WEB_PUBLIC)) {
    const outWeb = path.join(WEB_PUBLIC, "tests-e2e-manifest.json");
    fs.writeFileSync(outWeb, JSON.stringify(manifest, null, 2));
    console.log("Wrote", outWeb);
  } else {
    console.log("web/public not found; skipping web manifest write");
  }
}

function main() {
  const manifest = buildManifest();
  writeOutputs(manifest);
}

main();
