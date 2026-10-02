import type { Metadata } from "next";
import Link from "next/link";
import { EpkCarousel } from "@/components/epk-carousel";
import { StationPage } from "@/components/station-page";
import { readContent } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Press Kit",
  description:
    "ISH D press kit — bio, photos, and full EPK download for press, promoters and booking agencies.",
  alternates: { canonical: "/epk" },
};

/**
 * /epk — the press / booking / agency entry point.
 *
 * Why this route exists: the press-kit assets were already live at
 * /epk/page-1..8.jpg and /epk/IshD_EPK_2024.pdf, but only reachable from
 * /about. Agency and press outreach needs one stable, human link, so this
 * page is the canonical EPK URL. It reuses the existing StationPage shell +
 * EpkCarousel so it stays inside the site's own visual system.
 *
 * Deliberately NOT on the home map — direct-link page, like /transmission-list.
 */
export default function PressKitPage() {
  const content = readContent();
  const booking = content.direct.find((entry) => entry[0] === "BOOKINGS") ?? content.direct[0];
  const listening = content.external.filter((entry) => entry[0] === "LISTEN");
  const dates = content.external.find((entry) => entry[0] === "DATES");

  return (
    <StationPage
      code="07"
      eyebrow="PRESS / BOOKING / AGENCY"
      title="Press Kit"
      kind="about"
      secondary={<EpkCarousel />}
    >
      <p className="panel-meta">ARTIST FILE</p>
      <p>One link for press, promoters, and booking agencies — bio, press kit, listening, and contact.</p>
      <p>
        Ish D is a Texas-raised, Los Angeles-based producer and DJ working across deep house,
        soulful house, disco, and UK garage. His work follows the Black American dance-music
        tradition: rhythm first, feeling intact, and made for the room.
      </p>
      <dl className="coordinate-list">
        <div><dt>BASE</dt><dd>LOS ANGELES</dd></div>
        <div><dt>FORMAT</dt><dd>DJ / PRODUCER</dd></div>
        <div><dt>FREQUENCIES</dt><dd>HOUSE / DISCO / GARAGE</dd></div>
        <div><dt>LABEL</dt><dd>COMPOSITION ROOM</dd></div>
      </dl>
      <div className="contact-switchboard">
        <section>
          <h2>BOOKING</h2>
          <ul className="contact-list">
            <li><span>{booking[0]}</span><a href={booking[2]}>{booking[1]} <b>↗</b></a></li>
            {dates ? (
              <li><span>{dates[0]}</span><a href={dates[2]} target="_blank" rel="noopener noreferrer">{dates[1]} <b>↗</b></a></li>
            ) : null}
          </ul>
        </section>
        <section>
          <h2>LISTEN</h2>
          <ul className="contact-list">
            {listening.map((entry) => (
              <li key={entry[1]}>
                <span>{entry[0]}</span>
                <a href={entry[2]} target="_blank" rel="noopener noreferrer">{entry[1]} <b>↗</b></a>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="contact-bottom">
        <section className="transmission-invite">
          <p className="panel-meta">FULL KIT</p>
          <p>The complete press kit is above — eight pages, plus a PDF download.</p>
          <Link href="/info">ALL CONTACT POINTS →</Link>
        </section>
        <p className="location-note">LOS ANGELES · COMPOSITION ROOM</p>
      </div>
    </StationPage>
  );
}
