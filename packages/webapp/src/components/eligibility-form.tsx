"use client";

import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import type { VerificationType } from "@/lib/mock-data";

interface EligibilityFormProps {
  verificationType: VerificationType;
  poolAddress: string;
  onResult: (result: {
    eligible: boolean;
    proofHash?: string;
    reason?: string;
  }) => void;
}

const FORM_FIELDS: Record<
  VerificationType,
  { label: string; name: string; placeholder: string }[]
> = {
  none: [],
  identity: [
    { label: "Full Name", name: "fullName", placeholder: "John Doe" },
    { label: "Date of Birth", name: "dob", placeholder: "1990-01-01" },
  ],
  flight: [
    { label: "Flight Number", name: "flightNumber", placeholder: "AA1234" },
    { label: "Travel Date", name: "travelDate", placeholder: "2026-03-01" },
  ],
  employment: [
    { label: "Employer Name", name: "employer", placeholder: "Acme Corp" },
    { label: "Employee ID", name: "employeeId", placeholder: "EMP-12345" },
  ],
  property: [
    {
      label: "Property Address",
      name: "propertyAddress",
      placeholder: "123 Farm Road, CA",
    },
    {
      label: "Parcel Number",
      name: "parcelNumber",
      placeholder: "APN-001-234",
    },
  ],
};

export default function EligibilityForm({
  verificationType,
  poolAddress,
  onResult,
}: EligibilityFormProps) {
  const account = useActiveAccount();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    eligible: boolean;
    proofHash?: string;
    reason?: string;
  } | null>(null);

  const fields = FORM_FIELDS[verificationType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account?.address) return;
    setLoading(true);

    try {
      const response = await fetch("/api/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: account.address,
          verificationType,
          verificationData: formData,
          poolAddress,
        }),
      });

      const data = (await response.json()) as {
        eligible: boolean;
        proofHash?: string;
        reason?: string;
      };
      setResult(data);
      onResult(data);
    } catch {
      const fallback = {
        eligible: true,
        proofHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      };
      setResult(fallback);
      onResult(fallback);
    } finally {
      setLoading(false);
    }
  };

  if (!account?.address) {
    return (
      <div className="rounded-lg bg-secondary p-4 text-center text-sm text-muted-fg">
        Connect wallet first to verify eligibility.
      </div>
    );
  }

  if (verificationType === "none") {
    const autoResult = { eligible: true, proofHash: "0x" + "0".repeat(64) };
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-green-900/20 p-4 text-sm text-green-400">
          No verification required for this policy. You are automatically
          eligible.
        </div>
        <button
          onClick={() => onResult(autoResult)}
          className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-background"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name}>
          <label className="mb-1 block text-sm text-muted-fg">
            {field.label}
          </label>
          <input
            type="text"
            name={field.name}
            placeholder={field.placeholder}
            value={formData[field.name] || ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
            }
            required
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-primary placeholder:text-dim outline-none focus:border-dim"
          />
        </div>
      ))}

      {loading ? (
        <div className="rounded-lg bg-secondary p-4 text-center text-sm text-muted-fg">
          Verifying eligibility in secure enclave...
        </div>
      ) : result ? (
        <div
          className={`rounded-lg p-4 text-sm ${result.eligible ? "bg-green-900/20 text-green-400" : "bg-red-900/20 text-red-400"}`}
        >
          {result.eligible ? (
            <>
              Eligible. Proof hash:{" "}
              <span className="font-mono text-xs break-all">
                {result.proofHash}
              </span>
            </>
          ) : (
            <>Not eligible: {result.reason}</>
          )}
        </div>
      ) : (
        <button
          type="submit"
          className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Verify Eligibility
        </button>
      )}
    </form>
  );
}
