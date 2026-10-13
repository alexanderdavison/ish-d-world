import type { Metadata } from "next";
import { StationPage } from "@/components/station-page";
import { readContent, soundcloudEmbedSrc } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Transmissions",
  description:
    "Current signals from ISH D — new releases, transmissions and works in progress.",
  alternates: { canonical: "/news" },
};

export default function NewsPage() {
  const content = readContent();
  return (
    <StationPage code="01" eyebrow="CURRENT SIGNALS" title="Transmissions" kind="news">
      <p className="panel-lead transmission-intro">New music, mixes, edits, and announcements from Ish D and Composition Room.</p>
      <div className="release-list">
        {content.releases.map((release, index) => {
          // A signal with an embed plays ON THE SITE: the player replaces the
          // outbound button so the listener is not sent away. Signals without an
          // embed keep the button they have always had — this is scoped per
          // record, not per page.
          const embed =
            release.embed && release.embed.provider === "soundcloud" && release.embed.url
              ? release.embed
              : null;
          return (
            <article className="release-item" key={release.title}>
              <span className="release-number">0{index + 1}</span>
              <div>
                <p className="release-meta">{release.meta}</p>
                <h2>{release.title}</h2>
                <p>{release.body}</p>
                {embed ? (
                  <div className="release-embed">
                    <iframe
                      src={soundcloudEmbedSrc(embed.url, embed.visual)}
                      title={`${release.title} — SoundCloud player`}
                      height={166}
                      loading="lazy"
                    />
                  </div>
                ) : null}
              </div>
              {/* The outbound button is OPTIONAL data now: it renders only for a release
                  that has BOTH an href and an action AND no in-page embed. A release with
                  no link (every recorded mix on this list) renders the player alone, with
                  no empty <a> left behind. */}
              {embed || !release.href || !release.action ? null : (
                <a href={release.href} target="_blank" rel="noopener noreferrer">{release.action} ↗</a>
              )}
            </article>
          );
        })}
      </div>
    </StationPage>
  );
}
