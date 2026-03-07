"use client";

import { useState } from "react";
import {
  CheckCircle2, XCircle, MinusCircle, ChevronDown, ChevronRight,
  Zap, Bell, Shield, Cloud, Link2, Eye, Code2, Database,
} from "lucide-react";
import type { PipelineTest } from "@/lib/pipeline-types";

const testStatusIcon: Record<string, React.ReactNode> = {
  pass: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />,
  fail: <XCircle className="h-4 w-4 text-red-500 shrink-0" />,
  error: <XCircle className="h-4 w-4 text-red-500 shrink-0" />,
  skipped: <MinusCircle className="h-4 w-4 text-zinc-500 shrink-0" />,
};

export function formatTestName(name: string): string {
  if (/[:/\\]/.test(name)) return name;
  return name
    .replace(/^test_/, "")
    .replace(/_/g, " ")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
}

interface StepNode {
  icon: React.ReactNode;
  label: string;
  chipCls: string;
  dotColor: string;
  lineColor: string;
  body: string;
}

function classifyStep(step: string): StepNode {
  const s = step.trim();
  if (/^HTTP Trigger/i.test(s))
    return { icon: <Zap className="h-2.5 w-2.5" />, label: "HTTP Trigger", chipCls: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", dotColor: "#EAB308", lineColor: "rgba(234,179,8,0.35)", body: s.replace(/^HTTP Trigger[:\s]*/i, "") };
  if (/^Log Trigger/i.test(s))
    return { icon: <Bell className="h-2.5 w-2.5" />, label: "Log Trigger", chipCls: "bg-orange-500/10 text-orange-500 border-orange-500/20", dotColor: "#F97316", lineColor: "rgba(249,115,22,0.35)", body: s.replace(/^Log Trigger[:\s]*/i, "") };
  if (/^Confidential HTTP/i.test(s))
    return { icon: <Shield className="h-2.5 w-2.5" />, label: "TEE Enclave", chipCls: "bg-violet-500/10 text-violet-400 border-violet-500/20", dotColor: "#8B5CF6", lineColor: "rgba(139,92,246,0.35)", body: s.replace(/^Confidential HTTP[:\s]*/i, "") };
  if (/^HTTP Client/i.test(s))
    return { icon: <Cloud className="h-2.5 w-2.5" />, label: "HTTP Client", chipCls: "bg-sky-500/10 text-sky-400 border-sky-500/20", dotColor: "#38BDF8", lineColor: "rgba(56,189,248,0.35)", body: s.replace(/^HTTP Client[:\s]*/i, "") };
  if (/^EVM Write/i.test(s))
    return { icon: <Link2 className="h-2.5 w-2.5" />, label: "EVM Write", chipCls: "bg-amber-500/10 text-amber-500 border-amber-500/20", dotColor: "#F59E0B", lineColor: "rgba(245,158,11,0.35)", body: s.replace(/^EVM Write[:\s]*/i, "") };
  if (/^EVM Read/i.test(s))
    return { icon: <Eye className="h-2.5 w-2.5" />, label: "EVM Read", chipCls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", dotColor: "#10B981", lineColor: "rgba(16,185,129,0.35)", body: s.replace(/^EVM Read[:\s]*/i, "") };
  if (/^Forge Test/i.test(s))
    return { icon: <Code2 className="h-2.5 w-2.5" />, label: "Forge Test", chipCls: "bg-orange-500/10 text-orange-500 border-orange-500/20", dotColor: "#F97316", lineColor: "rgba(249,115,22,0.35)", body: s.replace(/^Forge Test[:\s]*/i, "") };
  if (/^Assert/i.test(s))
    return { icon: <CheckCircle2 className="h-2.5 w-2.5" />, label: "Assert", chipCls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", dotColor: "#10B981", lineColor: "rgba(16,185,129,0.35)", body: s.replace(/^Assert[:\s]*/i, "") };
  if (/^vm\./i.test(s))
    return { icon: <Code2 className="h-2.5 w-2.5" />, label: "VM", chipCls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20", dotColor: "#71717A", lineColor: "rgba(113,113,122,0.4)", body: s };
  if (/^Encode/i.test(s))
    return { icon: <Database className="h-2.5 w-2.5" />, label: "Encode", chipCls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20", dotColor: "#71717A", lineColor: "rgba(113,113,122,0.4)", body: s.replace(/^Encode[:\s]*/i, "") };
  return { icon: null, label: "", chipCls: "", dotColor: "#52525B", lineColor: "rgba(113,113,122,0.6)", body: s };
}

function FlowDiagram({ steps }: { steps: string[] }) {
  return (
    <div className="mt-3 mb-2 ml-7 mr-2 rounded-lg border border-border/40 bg-muted/20 px-3 pt-4 pb-2">
      {steps.map((step, i) => {
        const node = classifyStep(step);
        const isLast = i === steps.length - 1;
        return (
          <div key={i} className="flex gap-3" style={{ minHeight: isLast ? 40 : 60 }}>
            <div className="flex flex-col items-center w-4 shrink-0">
              <div
                className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                style={{ backgroundColor: node.dotColor }}
              />
              {!isLast && (
                <div
                  className="w-0.5 flex-1 mt-1.5"
                  style={{ backgroundColor: node.lineColor, opacity: 0.8 }}
                />
              )}
            </div>
            <div className="flex-1 min-w-0 pb-2">
              {node.label && (
                <span className={`inline-flex items-center gap-1 !text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wide leading-none ${node.chipCls}`}>
                  {node.icon}
                  {node.label}
                </span>
              )}
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">{node.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TestRow({ test }: { test: PipelineTest }) {
  const [expanded, setExpanded] = useState(false);
  const hasSteps = test.steps && test.steps.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1 ${hasSteps ? "cursor-pointer hover:bg-muted/30 rounded px-1 -mx-1" : ""}`}
        onClick={() => hasSteps && setExpanded((e) => !e)}
      >
        {testStatusIcon[test.status]}
        <span className="text-xs text-foreground flex-1">{formatTestName(test.name)}</span>
        {test.message && <span className="text-xs text-muted-foreground truncate max-w-48">{test.message}</span>}
        {test.duration != null && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {test.duration < 1000 ? `${test.duration}ms` : `${(test.duration / 1000).toFixed(1)}s`}
          </span>
        )}
        {hasSteps && (
          expanded
            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </div>
      {expanded && hasSteps && <FlowDiagram steps={test.steps!} />}
    </div>
  );
}
