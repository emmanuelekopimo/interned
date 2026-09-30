import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource/caveat/600.css";
import "./globals.css";
import { Toaster } from "sonner";
import { env } from "@/env";

export const metadata: Metadata = {
  title: {
    default: "Internly — Find Your Next Opportunity",
    template: "%s · Internly",
  },
  description:
    "Internships, SIWES placements and real-world opportunities built for students and young professionals in Nigeria.",
  metadataBase: new URL(env.APP_URL),
};


export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
