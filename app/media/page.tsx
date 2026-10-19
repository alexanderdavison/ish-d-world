import type { Metadata } from "next";
import Link from "next/link";
import { StationPage } from "@/components/station-page";
import { readContent } from "@/lib/site";
import type { SetRecord } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Club Dispatch",
  description:
    "Club Dispatch — ISH D's house mix series. Soulful house, deep house and gospel house mixes, recorded live from the dancefloor.",
  alternates: { canonical: "/media" },
};

const seriesSchema = {
  "@context": "https://schema.org",
  "@type": "MusicPlaylist",
  name: "Club Dispatch",
  url: "https://ishdonline.com/media",
  description:
    "ISH D's house mix series — soulful house, deep house and gospel house, recorded live.",
  creator: { "@id": "https://ishdonline.com/#artist" },
};

/**
 * One set card. Markup and classes are unchanged from the single-list version —
 * the only reason this is a component is that the list is now rendered twice
 * (own sets / guest mixes) with numbering that restarts in each section.
 */
function SetCard({ item, index }: { item: SetRecord; index: number }) {
  return (
    <li className="set-card">
      <div className="set-frame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${item.youtubeId}`}
          title={`${item.title} — ${item.label}`}
          loading="lazy"
          allow="encrypted-media; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <div className="set-readout">
        <span className="set-index">— {index + 1} —</span>
        <span className="set-label">{item.label}</span>
        <strong className="set-title">{item.title}</strong>
        <span className="set-meta">{item.meta}</span>
        <p className="set-credit">{item.credit}</p>
        <a
          className="set-outbound"
          href={`https://www.youtube.com/watch?v=${item.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          WATCH ON YOUTUBE ↗
        </a>
      </div>
    </li>
  );
}

export default function MediaPage() {
  const content = readContent();
  // His own sets first; sets recorded for other rooms and channels are GUEST MIX.
  const ownSets = content.sets.filter((item) => !item.guest);
  const guestSets = content.sets.filter((item) => item.guest);
  return (
    <StationPage code="05" eyebrow="RECURRING MIX SERIES" title="Club Dispatch" kind="media">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seriesSchema) }}
      />
      <p className="panel-meta">MIXES FROM THE ROOM</p>
      <p className="media-intro">An ongoing mix series from Ish D, moving through house, disco, gospel, and garage.</p>
      {ownSets.length > 0 && (
        <section className="recorded-sets" aria-labelledby="recorded-sets-title">
          <header className="recorded-sets-head">
            <h2 id="recorded-sets-title">RECORDED SETS</h2>
            <p className="recorded-sets-lead">Full sets, start to finish.</p>
          </header>
          <ol className="set-list">
            {ownSets.map((item, i) => (
              <SetCard key={item.youtubeId} item={item} index={i} />
            ))}
          </ol>
        </section>
      )}
      {guestSets.length > 0 && (
        <section className="recorded-sets" aria-labelledby="guest-mix-title">
          <header className="recorded-sets-head">
            <h2 id="guest-mix-title">GUEST MIX</h2>
            <p className="recorded-sets-lead">Sets recorded for other rooms and channels.</p>
          </header>
          <ol className="set-list">
            {guestSets.map((item, i) => (
              <SetCard key={item.youtubeId} item={item} index={i} />
            ))}
          </ol>
        </section>
      )}
      <div className="dispatch-links">
        <span>LISTEN ELSEWHERE</span>
        {content.dispatchLinks.map(([label, href]) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer">{label} ↗</a>
        ))}
      </div>
      <Link className="unrouted-node" href="/unrouted" aria-label="Open restricted unrouted node">
        <i />
        <span><small>PRIVATE ACCESS</small><strong>UNROUTED NODE →</strong></span>
      </Link>
    </StationPage>
  );
}
