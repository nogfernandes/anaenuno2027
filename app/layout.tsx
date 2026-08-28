import type { Metadata } from "next";
import { Suspense } from "react";
import { DocumentLanguage } from "@/components/document-language";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Ana + Nuno — Together 2027", template: "%s — Ana + Nuno" },
  description: "O casamento de Ana e Nuno, 24 de abril de 2027, Lisboa.",
  openGraph: { title: "Ana + Nuno — Together 2027", description: "24.04.2027 · Lisboa", type: "website", images: [{ url: "/og.png", width: 1732, height: 908, alt: "Ana + Nuno — Together 2027" }] },
  twitter: { card: "summary_large_image", title: "Ana + Nuno — Together 2027", description: "24.04.2027 · Lisboa", images: ["/og.png"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body><Suspense><DocumentLanguage/></Suspense>{children}</body>
    </html>
  );
}
