"use client";

import { useState } from "react";
import type { VerificationType } from "@/lib/mock-data";

interface StepAgreementsProps {
  eligibilityText: string;
  settlementText: string;
  verificationType: VerificationType;
  onChangeEligibility: (text: string) => void;
  onChangeSettlement: (text: string) => void;
  onChangeVerification: (type: VerificationType) => void;
}

export default function StepAgreements({
  eligibilityText,
  settlementText,
  verificationType,
  onChangeEligibility,
  onChangeSettlement,
  onChangeVerification,
}: StepAgreementsProps) {
  const [generatingTldr, setGeneratingTldr] = useState(false);
  const [tldr, setTldr] = useState<{
    eligibility: string;
    settlement: string;
  } | null>(null);

  const generateTldr = async () => {
    if (!eligibilityText.trim() && !settlementText.trim()) return;
    setGeneratingTldr(true);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Summarize these insurance agreements into two concise TL;DRs (1-2 sentences each). Return ONLY valid JSON with keys "eligibility" and "settlement".\n\nEligibility Agreement:\n${eligibilityText}\n\nSettlement Agreement:\n${settlementText}`,
          context:
            "User is creating a parametric insurance pool on Surely protocol.",
        }),
      });
      const { text } = await res.json();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setTldr({
          eligibility:
            parsed.eligibility || "Unable to parse eligibility summary.",
          settlement:
            parsed.settlement || "Unable to parse settlement summary.",
        });
      } else {
        setTldr({
          eligibility: text.slice(0, 200),
          settlement: "See above for full summary.",
        });
      }
    } catch {
      setTldr({
        eligibility:
          "AI service unavailable. Please review agreements manually.",
        settlement:
          "AI service unavailable. Please review agreements manually.",
      });
    }
    setGeneratingTldr(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1 block text-sm text-muted-fg">
          Verification Type
        </label>
        <select
          value={verificationType}
          onChange={(e) =>
            onChangeVerification(e.target.value as VerificationType)
          }
          className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-primary outline-none"
        >
          <option value="none">None</option>
          <option value="identity">Identity</option>
          <option value="flight">Flight</option>
          <option value="employment">Employment</option>
          <option value="property">Property</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted-fg">
          Eligibility Agreement
        </label>
        <textarea
          value={eligibilityText}
          onChange={(e) => onChangeEligibility(e.target.value)}
          rows={6}
          placeholder="Define who is eligible for this policy..."
          className="w-full rounded-lg border border-border bg-secondary px-3 py-2 font-mono text-xs text-primary placeholder:text-dim outline-none focus:border-dim"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted-fg">
          Settlement Agreement
        </label>
        <textarea
          value={settlementText}
          onChange={(e) => onChangeSettlement(e.target.value)}
          rows={6}
          placeholder="Define trigger conditions and payout terms..."
          className="w-full rounded-lg border border-border bg-secondary px-3 py-2 font-mono text-xs text-primary placeholder:text-dim outline-none focus:border-dim"
        />
      </div>

      <button
        onClick={generateTldr}
        disabled={generatingTldr}
        className="rounded-lg bg-secondary px-4 py-2 text-sm text-muted-fg transition-colors hover:text-primary"
      >
        {generatingTldr ? "Generating TL;DR..." : "Generate AI TL;DR"}
      </button>

      {tldr && (
        <div className="space-y-2 rounded-lg bg-muted p-4">
          <div className="text-xs text-dim">AI-Generated Summary</div>
          <div className="text-sm text-muted-fg">
            <strong className="text-primary">Eligibility:</strong>{" "}
            {tldr.eligibility}
          </div>
          <div className="text-sm text-muted-fg">
            <strong className="text-primary">Settlement:</strong>{" "}
            {tldr.settlement}
          </div>
        </div>
      )}
    </div>
  );
}
