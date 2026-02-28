"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepSources from "@/components/create-wizard/step-sources";
import StepTrigger from "@/components/create-wizard/step-trigger";
import StepAgreements from "@/components/create-wizard/step-agreements";
import StepDeploy from "@/components/create-wizard/step-deploy";
import type { VerificationType } from "@/lib/mock-data";

const STEPS = ["Sources", "Trigger", "Agreements", "Deploy"];

export default function CreateClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [sources, setSources] = useState<string[]>([]);
  const [consensusMethod, setConsensusMethod] = useState("median");

  const [triggerConfig, setTriggerConfig] = useState({
    metric: "",
    comparison: "gt",
    threshold: "",
    duration: "12",
    cadence: "5m",
  });

  const [eligibilityText, setEligibilityText] = useState("");
  const [settlementText, setSettlementText] = useState("");
  const [verificationType, setVerificationType] =
    useState<VerificationType>("none");

  const [deployConfig, setDeployConfig] = useState({
    premium: "",
    maxPayout: "",
    duration: "30",
    minHolders: "1",
    maxHolders: "100",
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-6 text-center text-2xl font-bold text-primary">
        Create Insurance Pool
      </h1>

      {/* Step indicators */}
      <div className="mx-auto mb-8 flex max-w-lg items-center justify-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                i <= step
                  ? "bg-primary text-background"
                  : "bg-secondary text-dim"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`hidden text-sm sm:block ${i <= step ? "text-primary" : "text-dim"}`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px flex-1 ${i < step ? "bg-primary" : "bg-border"}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        {step === 0 && (
          <StepSources
            sources={sources}
            consensusMethod={consensusMethod}
            onChange={(s, c) => {
              setSources(s);
              setConsensusMethod(c);
            }}
          />
        )}
        {step === 1 && (
          <StepTrigger config={triggerConfig} onChange={setTriggerConfig} />
        )}
        {step === 2 && (
          <StepAgreements
            eligibilityText={eligibilityText}
            settlementText={settlementText}
            verificationType={verificationType}
            onChangeEligibility={setEligibilityText}
            onChangeSettlement={setSettlementText}
            onChangeVerification={setVerificationType}
          />
        )}
        {step === 3 && (
          <StepDeploy
            config={deployConfig}
            onChange={setDeployConfig}
            onDeploy={() => {
              setTimeout(() => router.push("/policies"), 1500);
            }}
            summary={{
              sources,
              consensusMethod,
              metric: triggerConfig.metric,
              comparison: triggerConfig.comparison,
              threshold: triggerConfig.threshold,
              verificationType,
            }}
            eligibilityText={eligibilityText}
            settlementText={settlementText}
            verificationType={verificationType}
            sources={sources}
            consensusMethod={consensusMethod}
            triggerConfig={triggerConfig}
          />
        )}
      </div>

      {step < 3 && (
        <div className="mt-4 flex justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-lg bg-secondary px-4 py-2 text-sm text-muted-fg transition-colors hover:text-primary disabled:opacity-30"
          >
            Back
          </button>
          <button
            onClick={() => setStep((s) => Math.min(3, s + 1))}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
