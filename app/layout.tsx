import type { Metadata } from "next";
import "./globals.css";
import { CostProvider } from "@/contexts/CostContext";

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
      <body>
        <CostProvider>
          {children}
        </CostProvider>
      </body>
    </html>
  );
}

