import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(path.join(tmpdir(), "cuidado-test-"));
const outfile = path.join(dir, "redact.test.mjs");

await esbuild.build({
  absWorkingDir: root,
  entryPoints: ["src/lib/redact.test.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile,
  external: ["node:test", "node:assert/strict"],
});

const result = spawnSync(process.execPath, ["--test", outfile], { stdio: "inherit" });
rmSync(dir, { recursive: true, force: true });
process.exit(result.status ?? 1);
