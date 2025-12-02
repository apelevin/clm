import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contract Parser",
  description: "Parse contracts and extract key provisions and actions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}

