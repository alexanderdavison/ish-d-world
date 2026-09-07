type IconProps = {
  kind: "news" | "projects" | "about" | "info" | "media";
};

export function StationIcon({ kind }: IconProps) {
  if (kind === "news") {
    return (
      <svg viewBox="0 0 120 120" role="img" aria-label="Transmission tower">
        <g className="icon-ink" fill="none" stroke="currentColor" strokeWidth="5">
          <path d="M60 18 34 104M60 18l26 86M42 76h36M48 57h24M54 38h12M27 104h66" />
          <path d="M36 29a34 34 0 0 0 0 48M84 29a34 34 0 0 1 0 48" opacity=".58" />
        </g>
        <rect className="beacon" x="54" y="9" width="12" height="12" fill="var(--signal)" />
      </svg>
    );
  }

  if (kind === "projects") {
    return (
      <svg viewBox="0 0 120 120" role="img" aria-label="Studio machine and network patchbay">
        <g fill="none" stroke="currentColor" strokeWidth="5">
          <rect x="15" y="23" width="90" height="74" rx="2" />
          <path d="M15 50h90M15 73h90" />
          <circle cx="29" cy="37" r="5" />
          <circle cx="46" cy="37" r="5" />
          <path d="M66 37h25M27 61h11M47 61h11M67 61h11M87 61h5" />
        </g>
        <g className="meter-bars" fill="var(--signal)">
          <rect x="27" y="82" width="7" height="7" />
          <rect x="41" y="82" width="7" height="7" />
          <rect x="55" y="82" width="7" height="7" />
          <rect x="69" y="82" width="7" height="7" />
          <rect x="83" y="82" width="7" height="7" />
        </g>
      </svg>
    );
  }

  if (kind === "about") {
    return (
      <svg viewBox="0 0 120 120" role="img" aria-label="Vinyl record and profile marker">
        <g className="record" transform="translate(10 10)">
          <circle cx="50" cy="50" r="39" fill="none" stroke="currentColor" strokeWidth="5" />
          <circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" strokeWidth="2" opacity=".55" />
          <circle cx="50" cy="50" r="8" fill="var(--signal)" />
          <rect x="47" y="6" width="6" height="16" fill="var(--paper)" />
        </g>
        <path d="m84 18 15 7-9 18" fill="none" stroke="currentColor" strokeWidth="5" />
      </svg>
    );
  }

  if (kind === "info") return (
    <svg viewBox="0 0 120 120" role="img" aria-label="Information terminal">
      <g fill="none" stroke="currentColor" strokeWidth="5">
        <path d="M25 18h70v66H25zM36 29h48v31H36zM48 84v18M72 84v18M36 102h48" />
      </g>
      <circle className="terminal-dot" cx="60" cy="44" r="7" fill="var(--signal)" />
      <path d="M46 70h28" stroke="currentColor" strokeWidth="5" />
    </svg>
  );

  return (
    <svg viewBox="0 0 120 120" role="img" aria-label="Media archive player">
      <g fill="none" stroke="currentColor" strokeWidth="5">
        <rect x="14" y="20" width="92" height="78" />
        <path d="M14 72h92M30 86h44M84 84h8" />
        <circle cx="38" cy="46" r="14" />
        <path d="m35 38 12 8-12 8z" fill="var(--signal)" stroke="none" />
        <path d="M64 38h28M64 47h20M64 56h25" />
      </g>
      <rect className="media-led" x="84" y="82" width="8" height="8" fill="var(--signal)" />
    </svg>
  );
}
