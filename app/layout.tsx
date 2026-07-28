import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
