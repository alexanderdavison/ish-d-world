import type { Metadata } from "next";
import "./globals.css";
import { SignalDeckProvider } from "@/components/signal-deck";
import { SignalDock } from "@/components/signal-dock";

export const metadata: Metadata = {
  title: {
    default: "ISH D — Deep House & Soulful House DJ",
    template: "%s — ISH D",
  },
  description:
    "ISH D — Los Angeles DJ & producer in the Black American house tradition. Deep house & soulful house mixes, disco, UK garage. Club Dispatch + Composition Room.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* One audio engine for the whole site: mounted here so playback survives
            navigation between pages. See components/signal-deck.tsx. */}
        <SignalDeckProvider>
          {children}
          <SignalDock />
        </SignalDeckProvider>
      </body>
    </html>
  );
}
