import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "@/components/providers/client-providers";

export const metadata: Metadata = {
  title: "drip drip",
  description: "Find companies ready to buy. Real-time hiring signals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
