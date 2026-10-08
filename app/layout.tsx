import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ishdonline.com"),
  title: {
    default: "ISH D — Deep House, Soulful House & Gospel House DJ",
    template: "%s — ISH D",
  },
  description:
    "ISH D — Los Angeles DJ & producer in the Black American house tradition. Deep house, soulful house & gospel house mixes, disco, UK garage. Club Dispatch + Composition Room.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    siteName: "ISH D",
    locale: "en_US",
    url: "https://ishdonline.com",
    title: "ISH D — Deep House, Soulful House & Gospel House DJ",
    description:
      "Los Angeles DJ & producer in the Black American house tradition. Deep house, soulful house & gospel house. Club Dispatch + Composition Room.",
    images: [
      {
        url: "https://ishdonline.com/og/ishd-og-1200x630.png",
        width: 1200,
        height: 630,
        alt: "ISH D — A Transmission From The Dancefloor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ISH D — Deep House, Soulful House & Gospel House DJ",
    description:
      "Los Angeles DJ & producer in the Black American house tradition. Club Dispatch + Composition Room.",
    images: ["https://ishdonline.com/og/ishd-og-1200x630.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

const artistSchema = {
  "@context": "https://schema.org",
  "@type": "MusicGroup",
  "@id": "https://ishdonline.com/#artist",
  name: "ISH D",
  alternateName: ["Ish D", "ISH D."],
  url: "https://ishdonline.com",
  description:
    "Los Angeles DJ and producer working in the Black American house tradition — deep house, soulful house, gospel house, disco and UK garage.",
  genre: [
    "Deep House",
    "Soulful House",
    "Gospel House",
    "Disco",
    "UK Garage",
    "Black House Music",
  ],
  image: "https://ishdonline.com/og/ishd-og-1200x630.png",
  sameAs: [
    "https://open.spotify.com/artist/5P6jJ9rSUU5KMnoQDmaPuo",
    "https://music.apple.com/us/artist/ish-d/1013408196",
    "https://ishd.bandcamp.com",
    "https://soundcloud.com/ish-d-1",
    "https://www.youtube.com/@ishdofficial",
    "https://www.instagram.com/ishd/",
    "https://www.threads.net/@ishd",
    "https://ra.co/dj/ishd",
    "https://www.discogs.com/artist/6206422-Ish-D",
    "https://musicbrainz.org/artist/5252cd63-b23d-419b-b634-3c0840b4698c",
    "https://www.wikidata.org/wiki/Q58452114",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://ishdonline.com/#website",
  url: "https://ishdonline.com",
  name: "ISH D",
  publisher: { "@id": "https://ishdonline.com/#artist" },
  inLanguage: "en-US",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([artistSchema, websiteSchema]) }}
        />
        {children}
      </body>
    </html>
  );
}
