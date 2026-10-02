import type { Metadata } from "next";
import { StationPage } from "@/components/station-page";
import { readContent } from "@/lib/site";

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
        {content.releases.map((release, index) => (
          <article className="release-item" key={release.title}>
            <span className="release-number">0{index + 1}</span>
            <div>
              <p className="release-meta">{release.meta}</p>
              <h2>{release.title}</h2>
              <p>{release.body}</p>
            </div>
            <a href={release.href} target="_blank" rel="noopener noreferrer">{release.action} ↗</a>
          </article>
        ))}
      </div>
    </StationPage>
  );
}
