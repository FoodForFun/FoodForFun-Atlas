import type { Metadata } from "next";

import { SiteNavigation } from "@/app/_components/site-navigation";

import "./globals.css";

export const metadata: Metadata = {
  title: "FoodForFun Atlas",
  description: "Through food, understand people. Through people, understand the world.",
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
