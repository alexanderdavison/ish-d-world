import Link from "next/link";
import { StationPage } from "@/components/station-page";

export default function NotFound() {
  return (
    <StationPage code="404" eyebrow="SIGNAL LOST" title="Route Not Found" kind="news">
      <div className="utility-layout">
        <section className="utility-copy">
          <p className="panel-meta">ERROR / 404</p>
          <h2>This route left the floor.</h2>
          <p>The address exists outside the current signal map. Return to the dance floor and choose another node.</p>
          <Link className="utility-action" href="/">RETURN TO DANCE FLOOR →</Link>
        </section>
        <div className="utility-error" aria-hidden="true">
          <span>4</span><i /><span>4</span>
          <small>NO SIGNAL BETWEEN NODES</small>
        </div>
      </div>
    </StationPage>
  );
}
