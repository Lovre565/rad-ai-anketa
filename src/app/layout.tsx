import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mijenja li umjetna inteligencija način na koji potrošači donose financijske odluke na financijskim tržištima?",
  description: "Web aplikacija za anketu i eksperiment o AI podršci u financijskom odlučivanju."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hr" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
