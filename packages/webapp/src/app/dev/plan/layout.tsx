import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plan | Surely Dev",
  description: "Development plan viewer.",
};

export default function DevPlanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
