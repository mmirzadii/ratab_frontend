#!/usr/bin/env node
/**
 * Lightweight documentation-structure validator for Ratab frontend.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];
let currentStatus = "CURRENT_BACKEND_CONTRACT_NOT_SYNCED";

const REQUIRED_CURRENT_FILES = [
  "README.md",
  "BACKEND_VERSION",
  "OPENAPI.yaml",
  "FRONTEND_HANDOFF.md",
  "AUTH_AND_CSRF.md",
  "PERMISSIONS.md",
  "ERROR_CODES.md",
  "API_USAGE_EXAMPLES.md",
  "INTEGRATION_CHECKLIST.md",
  "KNOWN_LIMITATIONS.md",
  "DB_SCHEMA_REFERENCE.dbml",
];

const PRODUCT_REFERENCE_FILES = [
  "PRODUCT_FLOW_NOTES.md",
  "UI_THEME_NOTES.md",
  "company_dual_nav_reference.png",
  "landing_reference.html",
  "main_updated.html",
];

const HISTORICAL_V0_REQUIRED = [
  "README.md",
  "OPENAPI.yaml",
  "frontend_handoff_v0_0.md",
  "api_schema_security_notes.md",
];

const SECRET_PATTERNS = [
  { name: "private_key_block", re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "aws_access_key", re: /AKIA[0-9A-Z]{16}/ },
  { name: "generic_api_key_assignment", re: /(?:api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*['"][^'"]{16,}['"]/i },
  { name: "bearer_token_literal", re: /Authorization:\s*Bearer\s+[A-Za-z0-9\-._~+/]+=+/ },
  { name: "django_secret_key", re: /SECRET_KEY\s*=\s*['"][^'"]{8,}['"]/ },
  { name: "database_url_with_password", re: /(?:postgres|mysql|mongodb|redis):\/\/[^:\s]+:[^@\s]+@/i },
];

function rel(p) {
  return path.relative(root, p).split(path.sep).join("/");
}

function existsRel(p) {
  return existsSync(path.join(root, p));
}

function fail(msg) {
  errors.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

function listFiles(dirRel, exts = null) {
  const abs = path.join(root, dirRel);
  if (!existsSync(abs)) return [];
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".vite" || entry.name === ".git") {
        continue;
      }
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (!exts || exts.includes(path.extname(entry.name).toLowerCase())) out.push(full);
    }
  };
  walk(abs);
  return out;
}

function sha256File(abs) {
  return createHash("sha256").update(readFileSync(abs)).digest("hex");
}

function packageGenerateScript() {
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  return String(pkg.scripts?.["generate:api"] ?? "");
}

// --- structural checks ---

if (!existsRel("backend_docs/README.md")) {
  fail("missing backend_docs/README.md");
}

if (existsRel("backend_docs/v0.0")) {
  fail("legacy path backend_docs/v0.0/ still exists; active contracts must not be read from it");
}

for (const name of HISTORICAL_V0_REQUIRED) {
  if (!existsRel(`backend_docs/history/v0.0/${name}`)) {
    fail(`missing historical v0 file backend_docs/history/v0.0/${name}`);
  }
}

if (existsRel("code_oder/v0.0/reference")) {
  fail("code_oder/v0.0/reference/ still exists; product references must live under docs/product_reference/");
}

for (const name of PRODUCT_REFERENCE_FILES) {
  if (!existsRel(`docs/product_reference/v0.0/${name}`)) {
    fail(`missing product reference docs/product_reference/v0.0/${name}`);
  }
}

if (!existsRel("docs/README.md")) {
  fail("missing docs/README.md");
}

if (!existsRel("code_oder/README.md")) {
  fail("missing code_oder/README.md");
}

// Duplicate canonical OpenAPI under history/v0.0: exactly one OPENAPI.yaml, non-canonical must be labeled
const historyOpenApi = listFiles("backend_docs/history/v0.0", [".yaml", ".yml"]).map((f) => path.basename(f));
const canonicalOpenApi = historyOpenApi.filter((n) => n === "OPENAPI.yaml");
if (canonicalOpenApi.length !== 1) {
  fail(`expected exactly one canonical OPENAPI.yaml under backend_docs/history/v0.0/, found ${canonicalOpenApi.length}`);
}
const unlabeledDuplicates = historyOpenApi.filter(
  (n) => n !== "OPENAPI.yaml" && !n.includes("NON_CANONICAL") && /^openapi/i.test(n),
);
if (unlabeledDuplicates.length) {
  fail(`unlabeled duplicate OpenAPI file(s) in history/v0.0: ${unlabeledDuplicates.join(", ")}`);
}

// current contract completeness
const currentDir = path.join(root, "backend_docs", "current");
const currentEntries = existsSync(currentDir)
  ? readdirSync(currentDir).filter((n) => n !== ".gitkeep")
  : [];
const hasBackendVersion = existsRel("backend_docs/current/BACKEND_VERSION");
const hasCurrentOpenApi = existsRel("backend_docs/current/OPENAPI.yaml");

if (hasBackendVersion || hasCurrentOpenApi || currentEntries.some((n) => REQUIRED_CURRENT_FILES.includes(n))) {
  const missing = REQUIRED_CURRENT_FILES.filter((n) => !existsRel(`backend_docs/current/${n}`));
  if (missing.length) {
    fail(`backend_docs/current/ is partially synced; missing: ${missing.join(", ")}`);
  } else {
    currentStatus = "CURRENT_BACKEND_CONTRACT_SYNCED";
  }
} else {
  currentStatus = "CURRENT_BACKEND_CONTRACT_NOT_SYNCED";
  warn("backend_docs/current/ has no official backend package yet (only placeholder allowed)");
}

if (hasCurrentOpenApi) {
  const gen = packageGenerateScript();
  if (!gen.includes("backend_docs/current/OPENAPI.yaml") && !gen.includes("generate-api")) {
    fail('package.json generate:api must point at backend_docs/current/OPENAPI.yaml (or scripts/generate-api.mjs)');
  }
  // If wrapper script exists, verify it targets current OPENAPI
  const genScript = path.join(root, "scripts", "generate-api.mjs");
  if (existsSync(genScript)) {
    const body = readFileSync(genScript, "utf8");
    if (!body.includes("backend_docs") || !body.includes("OPENAPI.yaml") || !body.includes("current")) {
      fail("scripts/generate-api.mjs does not reference backend_docs/current/OPENAPI.yaml");
    }
  }
} else {
  const gen = packageGenerateScript();
  if (gen.includes("backend_docs/v0.0") || gen.includes("history/v0.0")) {
    fail("generate:api must not point at historical OpenAPI paths");
  }
}

// Markdown local link resolution + secret scan over documentation trees
const docRoots = ["backend_docs", "docs", "code_oder", "AI_CODE_PRINCIPLES.md"];
const mdFiles = [];
for (const entry of docRoots) {
  const abs = path.join(root, entry);
  if (!existsSync(abs)) continue;
  if (statSync(abs).isFile()) {
    if (abs.endsWith(".md")) mdFiles.push(abs);
  } else {
    mdFiles.push(...listFiles(entry, [".md"]));
  }
}

const linkRe = /\[([^\]]*)\]\(([^)]+)\)/g;
for (const file of mdFiles) {
  const text = readFileSync(file, "utf8");
  const dir = path.dirname(file);

  for (const { name, re } of SECRET_PATTERNS) {
    if (re.test(text)) {
      // Allow documentation that mentions placeholder patterns / examples without real secrets
      const lowered = text.toLowerCase();
      const likelyExample =
        lowered.includes("<token>") ||
        lowered.includes("<dev-token>") ||
        lowered.includes("example") ||
        lowered.includes("placeholder") ||
        text.includes("Authorization: Token <token>");
      if (!likelyExample || name === "private_key_block" || name === "aws_access_key" || name === "database_url_with_password") {
        // Re-check: Token <token> style docs are fine; real-looking assignments are not
        if (name === "bearer_token_literal" || name === "generic_api_key_assignment" || name === "django_secret_key") {
          // only fail if not clearly placeholder
          const matches = text.match(re) || [];
          const realLooking = matches.some((m) => !/<|>|example|placeholder|your_/i.test(m));
          if (realLooking) fail(`possible secret (${name}) in ${rel(file)}`);
        } else if (name === "private_key_block" || name === "aws_access_key" || name === "database_url_with_password") {
          fail(`possible secret (${name}) in ${rel(file)}`);
        }
      }
    }
  }

  let match;
  while ((match = linkRe.exec(text)) !== null) {
    let target = match[2].trim();
    if (!target || target.startsWith("#") || target.startsWith("mailto:") || target.startsWith("http://") || target.startsWith("https://") || target.startsWith("tel:")) {
      continue;
    }
    // strip optional title
    target = target.replace(/\s+".*"$/, "").replace(/\s+'.*'$/, "");
    const hashIndex = target.indexOf("#");
    if (hashIndex >= 0) target = target.slice(0, hashIndex);
    if (!target) continue;
    // repo-root style paths in backticks are not markdown links; for markdown links resolve relative to file
    const resolved = path.resolve(dir, decodeURIComponent(target));
    if (!existsSync(resolved)) {
      // also allow links written as repo-root relative from docs
      const fromRoot = path.resolve(root, decodeURIComponent(target.replace(/^\//, "")));
      if (!existsSync(fromRoot)) {
        fail(`broken markdown link in ${rel(file)} -> ${match[2]}`);
      }
    }
  }
}

// Ensure no active contract is referenced as living under backend_docs/v0.0 in package scripts
const pkgText = readFileSync(path.join(root, "package.json"), "utf8");
if (pkgText.includes("backend_docs/v0.0")) {
  fail("package.json still references backend_docs/v0.0");
}

console.log("=== validate:docs ===");
console.log(`STATUS: ${currentStatus}`);
if (existsRel("backend_docs/history/v0.0/OPENAPI.yaml")) {
  console.log(`history canonical OPENAPI sha256: ${sha256File(path.join(root, "backend_docs/history/v0.0/OPENAPI.yaml"))}`);
}
if (warnings.length) {
  console.log("warnings:");
  for (const w of warnings) console.log(`  - ${w}`);
}
if (errors.length) {
  console.log("errors:");
  for (const e of errors) console.log(`  - ${e}`);
  process.exit(1);
}
console.log("OK: documentation structure checks passed");
process.exit(0);
