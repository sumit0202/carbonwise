import type { Metadata, Viewport } from "next";
import { SkipLink } from "@/components/layout/SkipLink";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarbonWise — Carbon Footprint Awareness Platform",
  description:
    "Understand, track, and reduce your carbon footprint with simple actions and personalized, privacy-first insights.",
};

export const viewport: Viewport = {
  themeColor: "#0a6b4f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
