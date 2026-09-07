import type { Metadata } from "next";
import { StationPage } from "@/components/station-page";
import { TransmissionForm } from "@/components/transmission-form";

export const metadata: Metadata = { title: "Transmission List" };

export default function TransmissionListPage() {
  return (
    <StationPage code="06" eyebrow="OPEN CHANNEL" title="Transmission List" kind="info">
      <div className="utility-layout transmission-page-layout">
        <section className="utility-copy">
          <p className="panel-meta">DIRECT SIGNAL / ISH D</p>
          <h2>Stay close to the room.</h2>
          <p>New music, private links, website-only drops, and occasional notes from Ish D and Composition Room.</p>
          <p className="utility-status"><i /> DELIVERY ROUTE IN DEVELOPMENT</p>
        </section>
        <section className="utility-terminal">
          <TransmissionForm />
          <p className="construction-note">SIGNUP INTERFACE ACTIVE · MAIL DELIVERY BACKEND PENDING</p>
        </section>
      </div>
    </StationPage>
  );
}
