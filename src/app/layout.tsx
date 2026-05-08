import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eksperiment financijskog odlučivanja",
  description: "Web aplikacija za anketu i eksperiment o AI podršci u financijskom odlučivanju."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hr" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
