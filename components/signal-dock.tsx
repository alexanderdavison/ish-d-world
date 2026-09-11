"use client";

// The visible half of the Signal Deck: dormant node, compact dock, expanded console.
// Everything here talks to the single audio engine in signal-deck.tsx — no component
// in this file owns an <audio> element.

import { formatClock, useSignalDeck, type DeckItem } from "@/components/signal-deck";

const IconPlay = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5 19.5 12 7 19.5Z" /></svg>
);
const IconPause = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5h3.6v15H7zM13.4 4.5H17v15h-3.6z" /></svg>
);
const IconStop = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5h11v11h-11z" /></svg>
);
const IconPrev = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h2.2v14H8zm10 0v14l-9-7z" /></svg>
);
const IconNext = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.8 5H16v14h-2.2zM6 5l9 7-9 7z" /></svg>
);
const IconLoop = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8.5A3.5 3.5 0 0 1 9.5 5H18l-2.4-2.4L17 1.2 21.8 6 17 10.8l-1.4-1.4L18 7h-8.5A1.5 1.5 0 0 0 8 8.5v2H6zM18 15.5A3.5 3.5 0 0 1 14.5 19H6l2.4 2.4L7 22.8 2.2 18 7 13.2l1.4 1.4L6 17h8.5A1.5 1.5 0 0 0 16 15.5v-2h2z" /></svg>
);
const IconVolume = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4zM15.5 8.4a5 5 0 0 1 0 7.2l-1.3-1.4a3.2 3.2 0 0 0 0-4.4z" /></svg>
);
const IconMute = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4zM15.6 9.2l1.4-1.4 2.3 2.3 2.3-2.3 1.4 1.4-2.3 2.3 2.3 2.3-1.4 1.4-2.3-2.3-2.3 2.3-1.4-1.4 2.3-2.3z" /></svg>
);
const IconExpand = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h7v2.2H5.2V10H3zM14 3h7v7h-2.2V5.2H14zM3 14h2.2v4.8H10V21H3zm15.8 0H21v7h-7v-2.2h4.8z" /></svg>
);
const IconCollapse = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 3H7.8v4.8H3V10h7zm4 0h7v7h-2.2V5.2H14zM3 14h4.8v4.8H10V21H3zm11 0h7v7h-7v-2.2h4.8z" /></svg>
);

function statusLine(status: string, error: string, hasItem: boolean): string {
  if (error) return error;
  if (!hasItem) return "NO SIGNAL / STANDING BY";
  switch (status) {
    case "playing":
      return "CONNECTION ACTIVE / OUTPUT LIVE";
    case "loading":
      return "CONNECTING…";
    case "paused":
      return "SIGNAL HELD / STANDBY";
    default:
      return "NO SIGNAL / STANDING BY";
  }
}

function Visualizer({ playing }: { playing: boolean }) {
  return (
    <div className={`deck-visual ${playing ? "is-playing" : ""}`} aria-hidden="true">
      {Array.from({ length: 28 }, (_, index) => (
        <i key={index} style={{ "--bar": index } as React.CSSProperties} />
      ))}
    </div>
  );
}

function TargetRow({ item }: { item: DeckItem }) {
  const deck = useSignalDeck();
  const isCurrent = deck.current?.id === item.id;
  return (
    <li>
      <button
        type="button"
        className={isCurrent ? "is-current" : ""}
        onClick={() => (isCurrent ? deck.toggle() : deck.load(item))}
        aria-current={isCurrent ? "true" : undefined}
      >
        <span className="deck-row-code">{item.systemCode}</span>
        <strong>{item.title}</strong>
        <small>{typeof item.duration === "number" ? formatClock(item.duration) : "--:--"}</small>
      </button>
    </li>
  );
}

export function SignalDock() {
  const deck = useSignalDeck();
  const { current, items, gated, status, error, view } = deck;
  const playing = status === "playing";
  const playlist = gated ? [...items, gated] : items;
  const cueMarks = current?.chapters ?? [];

  if (view === "dormant" && !current) {
    return (
      <div className="deck-node-wrap">
        <button
          type="button"
          className="deck-node"
          onClick={() => deck.setView("compact")}
          aria-label="Open the audio player"
        >
          <i className={playlist.length ? "is-live" : ""} />
          <span>
            <small>AUDIO NODE 01</small>
            <strong>{playlist.length ? "OPEN DECK" : "NO SIGNAL"}</strong>
          </span>
        </button>
      </div>
    );
  }

  if (view === "compact") {
    return (
      <div className="deck-dock">
        <div className="deck-dock-body">
          <button
            type="button"
            className="deck-dock-play"
            onClick={deck.toggle}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <IconPause /> : <IconPlay />}
          </button>
          <div className="deck-dock-readout">
            <span className="deck-code">
              {current ? `${current.systemCode} · ${current.access}` : "AUDIO NODE 01 · IDLE"}
            </span>
            <strong>{current ? current.title : "NOTHING LOADED"}</strong>
            <div className="deck-timeline">
              <input
                type="range"
                min={0}
                max={Math.max(deck.duration || current?.duration || 0, 1)}
                step={0.5}
                value={Math.min(deck.time, Math.max(deck.duration || current?.duration || 0, 1))}
                onChange={(event) => deck.seek(Number(event.target.value))}
                aria-label="Track position"
                disabled={!current}
              />
              <div>
                <span>{formatClock(deck.time)}</span>
                <span>
                  {deck.duration
                    ? formatClock(deck.duration)
                    : current && typeof current.duration === "number"
                      ? formatClock(current.duration)
                      : "--:--"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="deck-dock-pod">
          <button
            type="button"
            className="deck-util"
            onClick={deck.toggleMute}
            aria-label={deck.muted ? "Unmute" : "Mute"}
            aria-pressed={deck.muted}
          >
            {deck.muted ? <IconMute /> : <IconVolume />}
          </button>
          <input
            className="deck-vol"
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={deck.volume}
            onChange={(event) => deck.setVolume(Number(event.target.value))}
            aria-label="Volume"
          />
          <button
            type="button"
            className="deck-util"
            onClick={() => deck.setView("expanded")}
            aria-label="Expand the player console"
          >
            <IconExpand />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="deck-console" role="dialog" aria-label="Signal Deck playback terminal">
      <div className="deck-shell">
        <header className="deck-shell-top">
          <span>PLAYBACK TERMINAL / NODE 04</span>
          <span className="deck-shell-status">{statusLine(status, error, Boolean(current))}</span>
          <button
            type="button"
            className="deck-util"
            onClick={() => deck.setView("compact")}
            aria-label="Collapse the console"
          >
            <IconCollapse />
          </button>
        </header>

        <div className="deck-shell-grid">
          <div className="deck-pod">
            <div className={`deck-disc ${playing ? "is-playing" : ""}`}>
              {current?.artwork ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={current.artwork} alt="" />
              ) : (
                <Visualizer playing={playing} />
              )}
            </div>
            <span className="deck-pod-clock">{formatClock(deck.time)}</span>
            <span className="deck-pod-label">ELAPSED</span>
          </div>

          <div className="deck-screen">
            <p className="deck-screen-code">
              {current
                ? `${current.systemCode} · ${current.series.toUpperCase()} · ${current.access}`
                : "AUDIO NODE 01 · SLOT READY"}
            </p>
            <h3>{current ? current.title : "NOTHING LOADED"}</h3>
            <p className="deck-screen-artist">{current ? current.artist : "ISH D"}</p>

            {cueMarks.length > 0 ? (
              <ol className="deck-tracklist" aria-label="Cue marks">
                {cueMarks.map((mark, index) => (
                  <li key={`${mark.startTime}-${mark.title}`}>
                    <button type="button" onClick={() => deck.jumpToChapter(mark.startTime)}>
                      <span className="deck-row-code">{String(index + 1).padStart(2, "0")}</span>
                      <strong>{mark.title}</strong>
                      <small>{formatClock(mark.startTime)}</small>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <ol className="deck-tracklist" aria-label="Available transmissions">
                {playlist.length === 0 && <li className="deck-row-empty">NO TRANSMISSIONS UPLOADED YET</li>}
                {playlist.map((item) => (
                  <TargetRow key={item.id} item={item} />
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="deck-transport">
          <button type="button" className="deck-tbtn" onClick={deck.previous} aria-label="Previous track">
            <IconPrev />
          </button>
          <button
            type="button"
            className="deck-tbtn is-primary"
            onClick={deck.toggle}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <IconPause /> : <IconPlay />}
          </button>
          <button type="button" className="deck-tbtn" onClick={deck.stop} aria-label="Stop">
            <IconStop />
          </button>
          <button type="button" className="deck-tbtn" onClick={deck.next} aria-label="Next track">
            <IconNext />
          </button>
          <button
            type="button"
            className="deck-tbtn"
            onClick={deck.toggleLoop}
            aria-label="Loop"
            aria-pressed={deck.loop}
          >
            <IconLoop />
          </button>
          <span className="deck-transport-vol">
            <IconVolume />
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={deck.volume}
              onChange={(event) => deck.setVolume(Number(event.target.value))}
              aria-label="Volume"
            />
          </span>
          <span className="deck-transport-tag">VOL</span>
        </div>

        {current?.links && current.links.length > 0 && (
          <div className="deck-shell-links">
            {current.links.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label} ↗
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
