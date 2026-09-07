import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
