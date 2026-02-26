"use client";

import { useState } from "react";

type WizardStep = "trigger" | "sources" | "agreements" | "deploy";

export default function CreateClient() {
  const [step, setStep] = useState<WizardStep>("trigger");

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold mb-8">Create Insurance Pool</h1>
      <div className="text-muted-foreground">
        Step: {step} — wizard steps coming soon
      </div>
    </div>
  );
}
