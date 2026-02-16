import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Surely",
  description: "Parametric insurance on Chainlink CRE",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
