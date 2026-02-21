import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RC-505 MK2 — Web Loop Station",
  description: "Web-based loop station inspired by the BOSS RC-505 MK2",
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
