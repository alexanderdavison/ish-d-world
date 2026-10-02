import type { Metadata } from "next";
import Link from "next/link";
import { StationPage } from "@/components/station-page";

export const metadata: Metadata = {
  title: "Under Construction",
  robots: { index: false, follow: false },
};

export default function UnderConstructionPage() {
  return (
    <StationPage code="00" eyebrow="ROUTE IN PROGRESS" title="Under Construction" kind="projects">
      <div className="utility-layout">
        <section className="utility-copy">
          <p className="panel-meta">NODE STATUS / INCOMPLETE</p>
          <h2>This route is still being wired.</h2>
          <p>Something is forming behind this terminal. The signal will open when the room is ready.</p>
          <Link className="utility-action" href="/transmission-list">JOIN TRANSMISSION LIST →</Link>
        </section>
        <div className="utility-diagram" aria-hidden="true">
          <span>00</span>
          <i /><i /><i />
          <small>CONNECTION PENDING</small>
        </div>
      </div>
    </StationPage>
  );
}
