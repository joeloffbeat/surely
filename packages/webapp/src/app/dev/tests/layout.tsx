import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tests | Surely Dev",
  description: "Development pipeline test runner.",
};

export default function DevTestsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
