import type { Metadata } from "next";
import { EpkCarousel } from "@/components/epk-carousel";
import { StationPage } from "@/components/station-page";

export const metadata: Metadata = {
  title: "About",
  description:
    "ISH D is a Los Angeles DJ and producer — deep house, soulful house, disco and UK garage. Studio work from the Composition Room.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <StationPage code="03" eyebrow="ARTIST COORDINATES" title="About" kind="about" secondary={<EpkCarousel />}>
      <p className="panel-meta">ISH D</p>
      <p>ISH D is a Grammy-nominated DJ and producer. He plays deep house, soulful house, gospel house, disco and UK garage.</p>
      <p>He runs Composition Room, his own label and working space for records, mixes and edits, and Club Dispatch, a recurring mix series. Full sets, mixes and records land here.</p>
      <p>Rhythm first, feeling intact, and made for the room.</p>
      <dl className="coordinate-list">
        <div><dt>BASE</dt><dd>LOS ANGELES</dd></div>
        <div><dt>FORMAT</dt><dd>DJ / PRODUCER</dd></div>
        <div><dt>FREQUENCIES</dt><dd>HOUSE / DISCO / GARAGE</dd></div>
        <div><dt>LABEL</dt><dd>COMPOSITION ROOM</dd></div>
      </dl>
    </StationPage>
  );
}
