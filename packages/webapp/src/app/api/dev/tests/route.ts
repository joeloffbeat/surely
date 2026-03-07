import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { PipelineResult, PipelineResults } from "@/lib/pipeline-types";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  // Check repo-root pipeline-results first, fall back to local
  const repoRoot = path.join(process.cwd(), "..", "..");
  const rootDir = path.join(repoRoot, "docs", "plan", "pipeline-results");
  const localDir = path.join(process.cwd(), "docs", "plan", "pipeline-results");

  const dir = fs.existsSync(rootDir) ? rootDir : localDir;

  if (!fs.existsSync(dir)) {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      pipelines: [],
    } satisfies PipelineResults);
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const pipelines: PipelineResult[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const data = JSON.parse(raw) as PipelineResult;
      pipelines.push(data);
    } catch {
      // skip malformed files
    }
  }

  // Sort: fail/error first, then by displayName
  pipelines.sort((a, b) => {
    const order = { fail: 0, error: 0, skipped: 1, pass: 2 };
    const ao = order[a.status] ?? 3;
    const bo = order[b.status] ?? 3;
    if (ao !== bo) return ao - bo;
    return a.displayName.localeCompare(b.displayName);
  });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    pipelines,
  } satisfies PipelineResults);
}
