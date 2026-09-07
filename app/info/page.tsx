import type { Metadata } from "next";
import Link from "next/link";
import { StationPage } from "@/components/station-page";
import { readContent } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contact Points" };

export default function InfoPage() {
  const content = readContent();
  return (
    <StationPage code="04" eyebrow="LISTEN / WATCH / FOLLOW" title="Contact Points" kind="info">
      <p className="panel-meta">EXTERNAL CONNECTIONS</p>
      <p>Listen, follow, book, or get in touch.</p>
      <div className="contact-switchboard">
        <section>
          <h2>DIRECT</h2>
          <ul className="contact-list">
            {content.direct.map(([type, label, href]) => (
              <li key={type}><span>{type}</span><a href={href}>{label} <b>↗</b></a></li>
            ))}
          </ul>
        </section>
        <section>
          <h2>PLATFORMS</h2>
          <ul className="contact-list">
            {content.external.map(([type, label, href]) => (
              <li key={label}><span>{type}</span><a href={href} target="_blank" rel="noopener noreferrer">{label} <b>↗</b></a></li>
            ))}
          </ul>
        </section>
      </div>
      <div className="contact-bottom">
        <section className="transmission-invite">
          <p className="panel-meta">TRANSMISSION LIST</p>
          <p>New music, private links, and occasional notes from the room.</p>
          <Link href="/transmission-list">ENTER TRANSMISSION LIST →</Link>
        </section>
        <p className="location-note">LOS ANGELES · SIGNAL ACTIVE</p>
      </div>
    </StationPage>
  );
}
