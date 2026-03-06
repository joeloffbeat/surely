"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PipelineResult, PipelineResults } from "@/lib/pipeline-types";
import { TestRow } from "@/components/dev/TestRow";

const statusIcon: Record<string, React.ReactNode> = {
  pass: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  fail: <XCircle className="h-5 w-5 text-red-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  skipped: <MinusCircle className="h-5 w-5 text-zinc-500" />,
};

export default function PipelineTestsPage() {
  const [data, setData] = useState<PipelineResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPipelines, setExpandedPipelines] = useState<Set<string>>(new Set());

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dev/tests");
      const json: PipelineResults = await res.json();
      setData(json);
      // Auto-expand failed pipelines
      const failed = new Set<string>();
      json.pipelines.forEach((p) => {
        if (p.status === "fail" || p.status === "error") failed.add(p.pipeline);
      });
      setExpandedPipelines(failed);
    } catch {
      setData({ generatedAt: new Date().toISOString(), pipelines: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const toggleExpand = (pipeline: string) => {
    setExpandedPipelines((prev) => {
      const next = new Set(prev);
      if (next.has(pipeline)) next.delete(pipeline);
      else next.add(pipeline);
      return next;
    });
  };

  const passCount = data?.pipelines.filter((p) => p.status === "pass").length ?? 0;
  const totalCount = data?.pipelines.length ?? 0;

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dev/plan" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Pipeline Tests</h1>
            {totalCount > 0 && (
              <Badge
                variant={passCount === totalCount ? "secondary" : "destructive"}
                className={passCount === totalCount ? "text-xs text-emerald-600" : "text-xs"}
              >
                {passCount}/{totalCount} passing
              </Badge>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchResults} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Pipeline Cards */}
      {loading && !data ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : totalCount === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">No pipeline results yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Run <code className="font-mono bg-muted px-1 py-0.5 rounded text-xs">forge test</code> or other pipeline scripts to generate results.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data!.pipelines.map((pipeline) => (
            <PipelineCard
              key={pipeline.pipeline}
              pipeline={pipeline}
              expanded={expandedPipelines.has(pipeline.pipeline)}
              onToggle={() => toggleExpand(pipeline.pipeline)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PipelineCard({
  pipeline,
  expanded,
  onToggle,
}: {
  pipeline: PipelineResult;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasTests = pipeline.tests && pipeline.tests.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
      >
        {statusIcon[pipeline.status]}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{pipeline.displayName}</span>
            <span className="text-xs text-muted-foreground">{pipeline.summary}</span>
          </div>
          {pipeline.status !== "pass" && pipeline.output && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {pipeline.output.split("\n")[0]}
            </p>
          )}
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {pipeline.duration < 1000
            ? `${pipeline.duration}ms`
            : `${(pipeline.duration / 1000).toFixed(1)}s`}
        </span>
        {hasTests &&
          (expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ))}
      </button>

      {expanded && hasTests && (
        <div className="border-t border-border px-4 py-2 flex flex-col gap-1">
          {pipeline.tests!.map((test, i) => (
            <TestRow key={`${test.name}-${i}`} test={test} />
          ))}
        </div>
      )}
    </div>
  );
}
