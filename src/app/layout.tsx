import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
