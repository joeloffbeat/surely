"use client";

import { useState } from "react";

interface AgreementViewerProps {
  eligibilityAgreement: string;
  settlementAgreement: string;
  sources: string[];
}

export default function AgreementViewer({
  eligibilityAgreement,
  settlementAgreement,
  sources,
}: AgreementViewerProps) {
  const [activeTab, setActiveTab] = useState<"eligibility" | "settlement">(
    "eligibility",
  );
  const [showTldr, setShowTldr] = useState(false);

  const agreement =
    activeTab === "eligibility" ? eligibilityAgreement : settlementAgreement;

  const tldr =
    activeTab === "eligibility"
      ? "You need to meet the eligibility criteria and pay the premium to activate coverage. Exclusions apply for edge cases."
      : "Payout triggers automatically when conditions are met by data source consensus. Settlement is on-chain and final.";

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("eligibility")}
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "eligibility"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-fg hover:text-primary"
          }`}
        >
          Eligibility Agreement
        </button>
        <button
          onClick={() => setActiveTab("settlement")}
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "settlement"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-fg hover:text-primary"
          }`}
        >
          Settlement Agreement
        </button>
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-dim">
            {activeTab === "eligibility" ? "Eligibility" : "Settlement"} Terms
          </span>
          <button
            onClick={() => setShowTldr(!showTldr)}
            className="rounded bg-secondary px-2 py-1 text-xs text-muted-fg transition-colors hover:text-primary"
          >
            {showTldr ? "Full Text" : "TL;DR"}
          </button>
        </div>
        {showTldr ? (
          <div className="rounded bg-secondary p-3 text-sm text-muted-fg">
            {tldr}
          </div>
        ) : (
          <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-fg">
            {agreement}
          </pre>
        )}
      </div>
      <div className="border-t border-border px-4 py-3">
        <span className="mb-2 block text-xs text-dim">Data Sources</span>
        <div className="flex flex-wrap gap-2">
          {sources.map((source) => (
            <span
              key={source}
              className="rounded bg-secondary px-2 py-1 text-xs text-muted-fg"
            >
              {source}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
