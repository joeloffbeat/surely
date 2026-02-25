"use client";

import { use } from "react";
import PolicyDetailClient from "./detail-client";

export default function PolicyDetailPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  return <PolicyDetailClient poolAddress={address} />;
}
