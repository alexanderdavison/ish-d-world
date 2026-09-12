import type { Metadata } from "next";
import Link from "next/link";
import { StationPage } from "@/components/station-page";
import { readContent } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Club Dispatch" };

export default function MediaPage() {
  const content = readContent();
  return (
    <StationPage code="05" eyebrow="RECURRING MIX SERIES" title="Club Dispatch" kind="media">
      <p className="panel-meta">MIXES FROM THE ROOM</p>
      <p className="media-intro">An ongoing mix series from Ish D, moving through house, disco, gospel, and garage.</p>
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
