"use client";

import { useParams } from "next/navigation";
import AcquireClient from "./acquire-client";

export default function AcquirePage() {
  const params = useParams<{ address: string }>();
  return <AcquireClient poolAddress={params.address} />;
}
