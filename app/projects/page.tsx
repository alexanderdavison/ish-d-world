import type { Metadata } from "next";
import { StationPage } from "@/components/station-page";
import { readContent } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "The Room",
  description:
    "The Room — studio work and private demos from ISH D's Composition Room in Los Angeles.",
  alternates: { canonical: "/projects" },
};

function DemoSlots() {
  const content = readContent();
  return (
    <section className="room-demos" aria-labelledby="room-demos-title">
      <header>
        <div>
          <p className="panel-meta">PRIVATE ROOM FILES</p>
          <h2 id="room-demos-title">Unreleased demos</h2>
        </div>
        <span>{String(content.demos.length).padStart(2, "0")} SLOTS</span>
      </header>
      <div className="demo-grid">
        {content.demos.map((demo) => (
          <article className="demo-slot" key={demo.number}>
            <div className="demo-cover" aria-hidden="true"><span>{demo.number}</span></div>
            <p>{demo.status}</p>
            <strong>{demo.title}</strong>
            <small>{demo.note}</small>
            <time dateTime="2026-08-27">UPDATED 08.27.26</time>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function ProjectsPage() {
  return (
    <StationPage
      code="02"
      eyebrow="COMPOSITION ROOM"
      title="The Room"
      kind="projects"
      secondary={<DemoSlots />}
    >
      <p className="panel-meta">CURRENTLY IN THE ROOM</p>
      <h2 className="panel-lead room-statement">Drums first.<br />Everything else after.</h2>
      <p>Composition Room is the working space behind Ish D. New records, edits, mixes, and unfinished ideas move through here before they go anywhere else.</p>
      <div className="room-progress">
        <p className="panel-meta">IN PROGRESS</p>
        <ul>
          <li>NEW HOUSE RECORDS</li>
          <li>CLUB DISPATCH</li>
          <li>INSTRUCTIONAL 4 DISCO</li>
          <li>UNRELEASED EDITS</li>
        </ul>
      </div>
    </StationPage>
  );
}
