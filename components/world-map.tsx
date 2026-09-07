"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import { PixelDancefloor } from "@/components/pixel-dancefloor";
import { StationIcon } from "@/components/station-icons";

const stations = [
  { id: "news", code: "01", title: "Transmissions", note: "Current signals + releases", activity: "3 CURRENT SIGNALS", x: "43%", y: "69%", ping: ".4s" },
  { id: "projects", code: "02", title: "The Room", note: "Studio work + private demos", activity: "3 ROOM FILES", x: "14%", y: "24%", ping: "1.9s" },
  { id: "about", code: "03", title: "Who is Ish D", note: "Artist coordinates", activity: "EPK ONLINE", x: "69%", y: "29%", ping: "3.25s" },
  { id: "info", code: "04", title: "Contact Points", note: "Listen · watch · follow", activity: "LINKS ACTIVE", x: "83%", y: "73%", ping: "4.65s" },
  { id: "media", code: "05", title: "Club Dispatch", note: "Mix series + dispatches", activity: "MIX CHANNEL READY", x: "91%", y: "45%", ping: "5.8s" },
] as const;

type TravelStyle = CSSProperties & Record<`--${string}`, string>;

export function WorldMap() {
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);
  const [booted, setBooted] = useState(false);
  const [travelling, setTravelling] = useState<string | null>(null);
  const [travelStyle, setTravelStyle] = useState<TravelStyle>({});

  useEffect(() => {
    const hasBooted = window.sessionStorage.getItem("ishd-world-booted") === "true";
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem("ishd-world-booted", "true");
      setBooted(true);
    }, hasBooted ? 0 : 1450);
    const move = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      document.documentElement.style.setProperty("--pointer-x", x.toFixed(3));
      document.documentElement.style.setProperty("--pointer-y", y.toFixed(3));
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  function travelToStation(event: MouseEvent<HTMLAnchorElement>, stationId: string) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    event.preventDefault();
    if (travelling) return;

    const stationRect = event.currentTarget.getBoundingClientRect();
    const stageRect = event.currentTarget.closest(".world-stage")?.getBoundingClientRect();
    if (!stageRect) {
      router.push(`/${stationId}`);
      return;
    }

    const centerX = stationRect.left + stationRect.width / 2;
    const centerY = stationRect.top + stationRect.height / 2;
    setTravelStyle({
      "--travel-dx": `${window.innerWidth / 2 - centerX}px`,
      "--travel-dy": `${window.innerHeight / 2 - centerY}px`,
      "--travel-origin-x": `${centerX - stageRect.left}px`,
      "--travel-origin-y": `${centerY - stageRect.top}px`,
      "--travel-screen-x": `${centerX}px`,
      "--travel-screen-y": `${centerY}px`,
    });
    setTravelling(stationId);
    window.sessionStorage.setItem("ishd-world-booted", "true");
    window.setTimeout(() => router.push(`/${stationId}`), 470);
  }

  return (
    <main
      className={`world-shell ${booted ? "is-booted" : ""} ${travelling ? `is-travelling travel-${travelling}` : ""}`}
      style={travelStyle}
    >
      <a className="skip-link" href="#stations">Skip to stations</a>

      <div className="boot-screen" aria-hidden={booted}>
        <p>COMPOSITION ROOM / LOS ANGELES</p>
        <div className="boot-mark">ISH D</div>
        <div className="boot-track"><span /></div>
        <p className="boot-small">SIGNAL MAP · REV.02</p>
      </div>

      <header className="world-header">
        <div>
          <span className="eyebrow">BLACK HOUSE MUSIC</span>
          <span className="coordinates">34.0522° N · 118.2437° W</span>
        </div>
        <div className="system-state"><i /> SIGNAL ACTIVE</div>
      </header>

      <section className="world-stage" aria-labelledby="world-title">
        <svg className="map-layer map-layer-back" viewBox="0 0 1600 930" aria-hidden="true">
          <defs>
            <pattern id="smallGrid" width="38" height="38" patternUnits="userSpaceOnUse">
              <path d="M38 0H0V38" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
            <pattern id="dotField" width="16" height="16" patternUnits="userSpaceOnUse">
              <rect x="2" y="2" width="4" height="4" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="1600" height="930" fill="url(#smallGrid)" opacity=".13" />
          <rect x="1180" y="78" width="310" height="170" fill="url(#dotField)" opacity=".2" />
          <g className="map-fine" fill="none" stroke="currentColor">
            <path d="M45 95h90M45 95v90M1508 780h48M1532 756v48" />
            <path d="M105 770h240M105 760v20M345 760v20" />
            <circle cx="1320" cy="650" r="88" />
            <path d="M1232 650h176M1320 562v176" strokeDasharray="7 8" />
            <path d="m1030 705 76 37-76 37-76-37zM954 742v66l76 38 76-38v-66M1030 779v67" />
          </g>
        </svg>

        <svg className="map-layer map-routes" viewBox="0 0 1600 930" aria-hidden="true">
          <g fill="none" stroke="var(--signal)" strokeLinecap="square" strokeLinejoin="miter">
            <path className="route-shadow route-primary" d="M60 223H224L344 343H530L688 642H850L1000 492L1104 270H1220L1328 679H1456V419H1540" />
          </g>
          <path
            className="signal-trunk"
            d="M60 223H224L344 343H530L688 642H850L1000 492L1104 270H1220L1328 679H1456V419H1540"
            fill="none"
            stroke="var(--paper)"
            strokeWidth="7"
          />
          <g className="packet-lines" fill="none" stroke="var(--paper)" strokeWidth="3" strokeDasharray="4 33">
            <path d="M60 223H224L344 343H530L688 642H850L1000 492L1104 270H1220L1328 679H1456V419H1540" />
          </g>
          <g fill="var(--signal)">
            <rect x="337" y="317" width="16" height="16" />
            <rect x="742" y="182" width="16" height="16" />
            <rect x="1022" y="597" width="16" height="16" />
            <rect x="1402" y="717" width="16" height="16" />
          </g>
        </svg>

        <svg className="mobile-map-layer" viewBox="0 0 400 1580" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <pattern id="mobileGrid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M32 0H0V32" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="400" height="1580" fill="url(#mobileGrid)" opacity=".12" />
          <path className="mobile-route-shadow" d="M198 300H82V520H288V760H104V1000H276V1240H120V1480" />
          <path className="mobile-signal-trunk" d="M198 300H82V520H288V760H104V1000H276V1240H120V1480" />
          <g className="mobile-route-ticks">
            <path d="M54 520h56M260 760h56M76 1000h56M248 1240h56M92 1480h56" />
          </g>
        </svg>

        <div className="wordmark-object">
          <span className="wordmark-kicker">LOS ANGELES / 2026</span>
          <h1 id="world-title">ISH D</h1>
          <p>HOUSE · DISCO · GARAGE</p>
        </div>

        <div className="signal-tower" aria-hidden="true">
          <i className="tower-pulse pulse-one" />
          <i className="tower-pulse pulse-two" />
          <div className="tower-head" />
          <div className="tower-mast" />
          <div className="tower-base" />
        </div>

        <PixelDancefloor />

        <nav id="stations" className="stations" aria-label="Explore the Ish D world">
          {stations.map((station) => (
            <Link
              key={station.id}
              href={`/${station.id}`}
              className={`station station-${station.id} ${active && active !== station.id ? "is-dimmed" : ""}`}
              style={{ left: station.x, top: station.y }}
              onMouseEnter={() => setActive(station.id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(station.id)}
              onBlur={() => setActive(null)}
              onClick={(event) => travelToStation(event, station.id)}
              aria-label={`${station.title}: ${station.note}. ${station.activity}`}
            >
              <span
                className="station-ping"
                style={{ "--ping-delay": station.ping } as CSSProperties}
                aria-hidden="true"
              />
              <span className="station-code">STN.{station.code}</span>
              <span className="station-icon"><StationIcon kind={station.id} /></span>
              <span className="station-activity" aria-hidden="true"><i />{station.activity}</span>
              <span className="station-card">
                <strong>{station.title}</strong>
                <small>{station.note}</small>
                <b>ENTER ↗</b>
              </span>
            </Link>
          ))}
        </nav>

        <div className="map-legend" aria-hidden="true">
          <span>TRANSMISSION ROUTE</span>
          <span>5 ACTIVE STATIONS</span>
          <span>COMPOSITION ROOM</span>
        </div>
      </section>

      <div className="travel-aperture" aria-hidden="true" />

      <footer className="world-footer">
        <span>© 2026 ISH D</span>
        <Link className="footer-signals" href="/media">ENTER CLUB DISPATCH →</Link>
        <span>REV.WM2</span>
      </footer>
    </main>
  );
}
