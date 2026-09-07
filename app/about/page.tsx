import type { Metadata } from "next";
import { EpkCarousel } from "@/components/epk-carousel";
import { StationPage } from "@/components/station-page";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <StationPage code="03" eyebrow="ARTIST COORDINATES" title="About" kind="about" secondary={<EpkCarousel />}>
      <p className="panel-meta">ISH D</p>
      <p>Ish D is a Texas-raised, Los Angeles-based producer and DJ working across deep house, soulful house, disco, and UK garage.</p>
      <p>His work follows the Black American dance-music tradition: rhythm first, feeling intact, and made for the room.</p>
      <p>He is the founder of Composition Room, an independent label and working space for records, mixes, and edits.</p>
      <dl className="coordinate-list">
        <div><dt>BASE</dt><dd>LOS ANGELES</dd></div>
        <div><dt>FORMAT</dt><dd>DJ / PRODUCER</dd></div>
        <div><dt>FREQUENCIES</dt><dd>HOUSE / DISCO / GARAGE</dd></div>
        <div><dt>LABEL</dt><dd>COMPOSITION ROOM</dd></div>
      </dl>
    </StationPage>
  );
}
