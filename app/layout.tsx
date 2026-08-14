import type { Metadata } from "next";

import { SiteNavigation } from "@/app/_components/site-navigation";
import { getSiteUrl } from "@/app/_lib/auth/site-url";
import { atlasDescription } from "@/app/_lib/seo";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: "FoodForFun Atlas",
  description: atlasDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteNavigation />
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
      </body>
    </html>
  );
}
