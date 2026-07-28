#!/usr/bin/env node
/**
 * Generate TypeScript types from the active backend OpenAPI contract.
 * Source: backend_docs/current/OPENAPI.yaml
 * Output: src/shared/api/generated/schema.ts
 *
 * Skips generation (exit 0) when the current contract is not synced yet.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const openapiPath = path.join(root, "backend_docs", "current", "OPENAPI.yaml");
const outPath = path.join(root, "src", "shared", "api", "generated", "schema.ts");

if (!existsSync(openapiPath)) {
  console.warn(
    "CURRENT_BACKEND_CONTRACT_NOT_SYNCED: backend_docs/current/OPENAPI.yaml is missing; skipping generate:api and keeping existing schema.ts",
  );
  process.exit(0);
}

const result = spawnSync(
  "npx",
  ["openapi-typescript", openapiPath, "-o", outPath],
  { cwd: root, stdio: "inherit", shell: true },
);

process.exit(result.status ?? 1);
