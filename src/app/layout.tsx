import type { Metadata } from "next";
import "./globals.css";
import { OceanBackground } from "@/components/ui/ocean-background";

export const metadata: Metadata = {
  title: "LeadDrip - B2B Lead Intelligence",
  description: "Discover high-intent prospects using custom buying signals and automated research",
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
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <OceanBackground />
        {children}
      </body>
    </html>
  );
}
