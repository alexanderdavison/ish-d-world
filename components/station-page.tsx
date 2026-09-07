import { ReturnToMap } from "@/components/return-to-map";
import { StationIcon } from "@/components/station-icons";

type StationPageProps = {
  code: string;
  eyebrow: string;
  title: string;
  kind: "news" | "projects" | "about" | "info" | "media";
  children: React.ReactNode;
  secondary?: React.ReactNode;
};

export function StationPage({ code, eyebrow, title, kind, children, secondary }: StationPageProps) {
  return (
    <main className={`interior interior-${kind}`}>
      <a className="skip-link" href="#station-content">Skip to content</a>
      <div className="return-aperture" aria-hidden="true" />
      <div className="interior-grid" aria-hidden="true" />
      <svg className="interior-route" viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-80 170h430l170 150h480l180-150h520" />
        <path d="M520 320v520l180 160" />
        <path className="fine-route" d="M980 320v230l-120 105v345" />
      </svg>

      <header className="interior-header">
        <div><span>BLACK HOUSE MUSIC</span><small> / STN.{code}</small></div>
        <div className="system-state"><i /> SIGNAL ACTIVE</div>
      </header>

      <section className="interior-stage" id="station-content">
        <header className="station-heading">
          <p>STN.{code} · {eyebrow}</p>
          <h1>{title}</h1>
        </header>

        <div className="interior-art" aria-hidden="true">
          <StationIcon kind={kind} />
          <span>OBJECT / {code}</span>
        </div>

        <div className="station-panel">{children}</div>
        {secondary ? <div className="station-panel station-panel-secondary">{secondary}</div> : null}
      </section>

      <footer className="interior-footer">
        <ReturnToMap />
        <p>© 2026 ISH D · COMPOSITION ROOM · LOS ANGELES</p>
      </footer>
    </main>
  );
}
