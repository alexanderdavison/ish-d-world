import type { Metadata } from "next";
import Link from "next/link";
import { StationPage } from "@/components/station-page";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How the ISH D Transmission List handles your email address — what we collect, how it's used, where it's stored, and how to leave the list.",
  alternates: { canonical: "/privacy" },
};

/**
 * /privacy — the Transmission List privacy policy.
 *
 * Why this route exists: /privacy.html 404'd, and the only privacy copy that
 * existed was in the retired DORFIC static build (different palette/system).
 * The list collects an email address, so the signup surface needs a reachable
 * policy. Copy is carried over from that draft and corrected where it was
 * inaccurate or unresolved:
 *   - storage: states the real arrangement (self-hosted Listmonk, infra we run)
 *     instead of the old "[Provider name ... to be finalized]" placeholder
 *   - leaving the list: every send carries a one-click unsubscribe link —
 *     campaigns through Listmonk's own footer, the transactional welcome
 *     through the public /unsubscribe endpoint wired into template 5
 *     (live 2026-09-09)
 * Uses only existing StationPage primitives + classes already in globals.css.
 */
export default function PrivacyPage() {
  return (
    <StationPage code="08" eyebrow="DATA / LIST / RIGHTS" title="Privacy" kind="info">
      <p className="panel-meta">POLICY</p>
      <p>The short version: we only collect your email, and we only use it to send you the Transmission List.</p>
      <div className="contact-switchboard">
        <section>
          <h2>WHAT WE COLLECT</h2>
          <p>Your email address, when you join the Transmission List. That&apos;s it — no name, no address, no payment details.</p>
        </section>
        <section>
          <h2>HOW WE USE IT</h2>
          <p>To send list updates: new releases, set drops, demos, and occasional artist news. We don&apos;t sell, rent, or share your email.</p>
        </section>
        <section>
          <h2>WHERE IT LIVES</h2>
          <p>Your address is held in our own self-hosted list system, running on infrastructure we control. It isn&apos;t handed to a third-party marketing platform.</p>
        </section>
        <section>
          <h2>LEAVING THE LIST</h2>
          <p>Every email we send carries a one-click unsubscribe link — including the welcome. One click takes your address off the list.</p>
        </section>
      </div>
      <div className="contact-bottom">
        <section className="transmission-invite">
          <p className="panel-meta">QUESTIONS</p>
          <p>Ask anything about this — how your address is stored, or to remove it by hand.</p>
          <Link href="/info">CONTACT POINTS →</Link>
        </section>
        <p className="location-note">LAST UPDATED 2026-09-23</p>
      </div>
    </StationPage>
  );
}
