import type { Metadata } from "next";
import { nodeSlug, readContent } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Links",
  description:
    "Everything in one address — Club Dispatch nodes, listening, watching, dates and contact points.",
  alternates: { canonical: "/links" },
};

type Row = [string, string, string];
type Item = { href: string; title: string; sub: string };

/**
 * Chip descriptor — the small orange line under a chip title.
 *
 * The content store holds [group, label, url]; the descriptor is presentational
 * and is NOT in the store, so it is derived here. Handles come out of the URL so
 * they stay correct when a URL is edited in /admin; the rest are label constants.
 * An unmapped label falls back to the group name rather than showing nothing.
 */
const DESCRIPTOR: Record<string, string> = {
  SPOTIFY: "ARTIST",
  "APPLE MUSIC": "ARTIST",
  BANDCAMP: "STORE",
  SOUNDCLOUD: "DEMOS",
  "RESIDENT ADVISOR": "DATES & TOUR",
};

function descriptor(label: string, url: string, group: string): string {
  if (/youtube\.com|instagram\.com|threads\.net|x\.com|tiktok\.com/i.test(url)) {
    const handle = url.replace(/\/+$/, "").split("/").filter(Boolean).pop() ?? "";
    if (handle) {
      // Uppercase either way so /@ishdofficial and /ishd read consistently.
      return (handle.startsWith("@") ? handle : `@${handle}`).toUpperCase();
    }
  }
  return DESCRIPTOR[label] ?? group;
}

/**
 * `external` rows are [GROUP, LABEL, url] — LABEL is the title, descriptor derived.
 *
 * `direct` rows are [TITLE, LABEL, url] — e.g. ["BOOKINGS", "EMAIL", "mailto:…"].
 * The title is field 0 there, NOT field 1: reading field 1 renders three identical
 * "EMAIL" cards and loses the whole section. The two shapes differ, so they are
 * mapped separately rather than forced through one helper.
 */
const fromExternal = (entries: Row[]): Item[] =>
  entries.map(([group, label, url]) => ({
    href: url,
    title: label,
    sub: descriptor(label, url, group),
  }));

const fromDirect = (entries: Row[]): Item[] =>
  entries.map(([title, label, url]) => ({ href: url, title, sub: label }));

function Chip({ item, wide }: { item: Item; wide?: boolean }) {
  const external = item.href.startsWith("http");
  return (
    <a
      className={wide ? "li-chip li-wide" : "li-chip"}
      href={item.href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      <span className="li-chip-t">{item.title}</span>
      <span className="li-chip-s">{item.sub}</span>
    </a>
  );
}

/**
 * An odd number of items leaves a gap in a 2-column grid, so the trailing item
 * spans the full width instead (3 -> 2 up + 1 wide, as in the design).
 */
function ChipList({ items }: { items: Item[] }) {
  const trailingWide = items.length % 2 === 1;
  return (
    <>
      {items.map((item, i) => (
        <Chip
          key={`${item.title}-${item.href}`}
          item={item}
          wide={trailingWide && i === items.length - 1}
        />
      ))}
    </>
  );
}

/**
 * /links — the single address for a bio, a caption, a QR code.
 *
 * Deliberately NOT wrapped in StationPage. StationPage renders `.interior`, whose
 * ground is `--paper` (cream) with `--ink` text — correct for the station pages,
 * but it inverts this one. The link index uses the LANDING surface instead:
 * `--void` ground carrying `--paper` node cards, the same language as the site's
 * own `.station-card`. Do not re-wrap it in StationPage.
 */
export default function LinksPage() {
  const content = readContent();
  const nodes = content.nodes.filter((node) => Boolean(node[2]));
  const listen = fromExternal(content.external.filter((entry) => entry[0] === "LISTEN"));
  const follow = fromExternal(
    content.external.filter(
      (entry) => entry[0] === "WATCH" || entry[0] === "FOLLOW" || entry[0] === "DATES",
    ),
  );
  const contact = fromDirect(content.direct);

  return (
    <main className="link-index">
      <header className="li-mast">
        <h1 className="li-wordmark">
          ISH&nbsp;D<i aria-hidden="true" />
        </h1>
        <p className="li-meta">
          LINK INDEX
          <br />
          LA / DALLAS
        </p>
      </header>
      <div className="li-rail" aria-hidden="true" />

      <section className="li-hero">
        {nodes.map(([code, label, url]) => (
          <a className="li-card" href={url} key={label} target="_blank" rel="noreferrer">
            <span className="li-card-k">Club Dispatch · {code} · Live</span>
            <span className="li-card-t">{label}</span>
            <span className="li-card-m">Reel source · Spotify playlist</span>
            <span className="li-card-go">
              /l/{nodeSlug(label)}
              <i aria-hidden="true" />
            </span>
          </a>
        ))}
      </section>

      <h2 className="li-sect">Listen</h2>
      <div className="li-grid">
        <ChipList items={listen} />
      </div>

      <h2 className="li-sect">Watch / Follow</h2>
      <div className="li-grid">
        <ChipList items={follow} />
      </div>

      <h2 className="li-sect">Contact</h2>
      <div className="li-grid">
        <ChipList items={contact} />
      </div>

      <footer className="li-foot">
        <b>ishdonline.com</b> · press kit at /epk
      </footer>
    </main>
  );
}
