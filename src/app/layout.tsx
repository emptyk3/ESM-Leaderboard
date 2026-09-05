import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "eSports Mostviertel Leaderboard",
    template: "%s · eSports Mostviertel",
  },
  description: "Das Vereins-Leaderboard von eSports Mostviertel",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
