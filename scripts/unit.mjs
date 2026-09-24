import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(path.join(tmpdir(), "cuidado-test-"));
await esbuild.build({
  absWorkingDir: root,
  entryPoints: ["src/lib/redact.test.ts", "src/lib/geo.test.ts", "src/lib/alerts.test.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outdir: dir,
  outExtension: { ".js": ".mjs" },
  external: ["node:test", "node:assert/strict"],
});

const files = readdirSync(dir)
  .filter((name) => name.endsWith(".mjs"))
  .map((name) => path.join(dir, name));
const result = spawnSync(process.execPath, ["--test", ...files], { stdio: "inherit" });
rmSync(dir, { recursive: true, force: true });
process.exit(result.status ?? 1);
