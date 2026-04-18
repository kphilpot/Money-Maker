import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { build, context } from "esbuild";

const rootDir = process.cwd();
const outDir = path.join(rootDir, "dist");
const watchMode = process.argv.includes("--watch");

const shared = {
  bundle: true,
  platform: "browser",
  target: "chrome114",
  sourcemap: true,
  logLevel: "info",
};

const backgroundConfig = {
  ...shared,
  entryPoints: [path.join(rootDir, "src/background.ts")],
  outfile: path.join(outDir, "background.js"),
  format: "iife",
};

const panelConfig = {
  ...shared,
  entryPoints: [path.join(rootDir, "src/panel.tsx")],
  outfile: path.join(outDir, "panel.js"),
  format: "iife",
  loader: {
    ".tsx": "tsx",
  },
};

const contentConfig = {
  ...shared,
  entryPoints: [path.join(rootDir, "src/content.ts")],
  outfile: path.join(outDir, "content.js"),
  format: "iife",
};

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

if (watchMode) {
  const backgroundContext = await context(backgroundConfig);
  const panelContext = await context(panelConfig);
  const contentContext = await context(contentConfig);
  await backgroundContext.watch();
  await panelContext.watch();
  await contentContext.watch();
  console.log("Watching VerifyAI bundles...");
} else {
  await Promise.all([
    build(backgroundConfig),
    build(panelConfig),
    build(contentConfig),
  ]);
}
