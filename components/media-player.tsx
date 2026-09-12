"use client";

/**
 * ISH D Signal Deck — the chrome, drawn in code.
 *
 * No raster anywhere. The panel is gradients and inset shadows; the meters and the spectrum
 * are <canvas>, drawn per frame from the engine's live analyser tap; the playlist, the seek
 * bar and the volume fader are real DOM, because text that can't be selected and a fader that
 * can't be dragged on a phone are not a player.
 *
 * The meters are the only part that CANNOT be faked into working: they read
 * getByteTimeDomainData / getByteFrequencyData off the shared engine, so if there is no audio
 * there is no meter. A dead meter here means a dead tap, not a decoration at rest.
 */

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { formatClock, useSignalDeck, type MeterTap } from "@/components/signal-deck";

const SEG = 16;          // LED segments per meter column
const BARS = 26;         // spectrum columns
const SPEC_SEG = 12;     // LED segments per spectrum column
const RED_FROM = 0.82;   // top of the ladder goes red

/* ------------------------------- LED drawing ------------------------------- */

function segColor(frac: number): [number, number, number] {
  // amber body, hot orange shoulder, red only at the very top
  if (frac > RED_FROM) return [214, 58, 28];
  if (frac > 0.68) return [242, 123, 1];
  return [224, 102, 5];
}

function drawLed(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  on: boolean, frac: number, radius: number,
) {
  if (on) {
    const [r, g, b] = segColor(frac);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.shadowColor = `rgba(${r},${g},${b},0.85)`;
    ctx.shadowBlur = Math.max(3, h * 0.5);
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.045)";
    ctx.shadowBlur = 0;
  }
  const rr = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
}

function fitCanvas(canvas: HTMLCanvasElement): { ctx: CanvasRenderingContext2D; w: number; h: number } | null {
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

/** The tap only exists after the first play, so it has to be polled rather than read once. */
function useMeterTap(): React.MutableRefObject<MeterTap | null> {
  const deck = useSignalDeck();
  const tap = useRef<MeterTap | null>(null);
  useEffect(() => {
    let raf = 0;
    const poll = () => { tap.current = deck.getMeterTap(); raf = requestAnimationFrame(poll); };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [deck]);
  return tap;
}

/** Stereo LED ladder: peak level per channel, live. */
function LedMeter({ tap }: { tap: React.MutableRefObject<MeterTap | null> }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const smooth = useRef<[number, number]>([0, 0]);
  const hold = useRef<[number, number]>([0, 0]);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const buf = new Uint8Array(1024);

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const canvas = ref.current;
      if (!canvas) return;
      // ~50fps is plenty for a meter ballistics look and leaves the main thread alone
      if (t - last < 20) return;
      last = t;

      const fitted = fitCanvas(canvas);
      if (!fitted) return;
      const { ctx, w, h } = fitted;

      const tapNow = tap.current;
      const raw: [number, number] = [0, 0];
      if (tapNow) {
        for (let ch = 0; ch < 2; ch++) {
          const node = ch === 0 ? tapNow.left : tapNow.right;
          node.getByteTimeDomainData(buf as Uint8Array<ArrayBuffer>);
          let peak = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = Math.abs(buf[i] - 128);
            if (v > peak) peak = v;
          }
          const lin = Math.min(1, peak / 127);
          // -48..0 dB reads like a real meter rather than a linear bar
          const db = lin > 0 ? 20 * Math.log10(lin) : -80;
          raw[ch] = Math.max(0, Math.min(1, (db + 48) / 48));
        }
      }

      // meter ballistics: snap up, ease down
      for (let ch = 0; ch < 2; ch++) {
        const prev = smooth.current[ch];
        smooth.current[ch] = raw[ch] > prev ? raw[ch] : prev * 0.88 + raw[ch] * 0.12;
        hold.current[ch] = Math.max(hold.current[ch] - 0.006, smooth.current[ch]);
      }

      const colW = w * 0.17;
      const gap = Math.max(2, h * 0.011);
      const segH = (h - gap * (SEG - 1)) / SEG;
      const cols = [w * 0.31, w * 0.52]; // the pair sits centred in the well

      for (let ch = 0; ch < 2; ch++) {
        const level = smooth.current[ch] * SEG;
        const peakSeg = Math.floor(hold.current[ch] * SEG);
        for (let s = 0; s < SEG; s++) {
          const y = h - (s + 1) * segH - s * gap;
          const frac = s / SEG;
          // the peak segment must stay dark at silence, or a resting meter looks like it is
          // reading something when it is reading nothing
          const peakLit = s === peakSeg && hold.current[ch] > 0.02;
          drawLed(ctx, cols[ch], y, colW, segH, s < level || peakLit, frac, 1.5);
        }
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [tap]);

  return <canvas ref={ref} className="dk-canvas" aria-hidden="true" />;
}

/** Spectrum bank: log-spaced buckets off the frequency data, each column an LED stack. */
function LedSpectrum({ tap }: { tap: React.MutableRefObject<MeterTap | null> }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const peaks = useRef<number[]>(new Array(BARS).fill(0));

  useEffect(() => {
    let raf = 0;
    let last = 0;
    let buf = new Uint8Array(1024);

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const canvas = ref.current;
      if (!canvas) return;
      if (t - last < 22) return;
      last = t;

      const fitted = fitCanvas(canvas);
      if (!fitted) return;
      const { ctx, w, h } = fitted;

      const tapNow = tap.current;
      const cols = new Array(BARS).fill(0);
      if (tapNow) {
        if (buf.length !== tapNow.spectrum.frequencyBinCount) {
          buf = new Uint8Array(tapNow.spectrum.frequencyBinCount);
        }
        tapNow.spectrum.getByteFrequencyData(buf as Uint8Array<ArrayBuffer>);
        const bins = buf.length;
        for (let c = 0; c < BARS; c++) {
          // log spacing: low frequencies get as much room as high ones
          const lo = Math.floor(Math.pow(c / BARS, 1.9) * bins);
          const hi = Math.max(lo + 1, Math.floor(Math.pow((c + 1) / BARS, 1.9) * bins));
          let sum = 0;
          for (let i = lo; i < hi && i < bins; i++) sum += buf[i];
          cols[c] = Math.min(1, sum / (hi - lo) / 235);
        }
      }

      const gapX = Math.max(2, w * 0.008);
      const colW = (w - gapX * (BARS - 1)) / BARS;
      const gapY = Math.max(1.5, h * 0.014);
      const segH = (h - gapY * (SPEC_SEG - 1)) / SPEC_SEG;

      for (let c = 0; c < BARS; c++) {
        const lit = cols[c] * SPEC_SEG;
        peaks.current[c] = Math.max(peaks.current[c] - 0.10, cols[c] * SPEC_SEG);
        const peakSeg = Math.floor(peaks.current[c]);
        for (let s = 0; s < SPEC_SEG; s++) {
          const y = h - (s + 1) * segH - s * gapY;
          const frac = s / SPEC_SEG;
          const peakLit = s === peakSeg && peaks.current[c] > 0.25;
          drawLed(ctx, c * (colW + gapX), y, colW, segH,
                  s < lit || peakLit, frac, Math.min(1.2, colW / 3));
        }
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [tap]);

  return <canvas ref={ref} className="dk-canvas" aria-hidden="true" />;
}

/* ------------------------------- chrome ------------------------------- */

const Play = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>);
const Pause = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="4.5" height="16" /><rect x="13.5" y="4" width="4.5" height="16" /></svg>);
const Stop = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" /></svg>);
const Prev = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h3v16H5zM19 4v16l-11-8z" /></svg>);
const Next = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 4h3v16h-3zM5 4v16l11-8z" /></svg>);
const Loop = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h9V4l5 4.5-5 4.5V10H8v3l-4-3.5z" /></svg>);
const Open = () => (<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3h8v8h-2V6.4l-6.3 6.3-1.4-1.4L9.6 5H5z" /></svg>);
const Less = () => (<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 7h10v2H3z" /></svg>);
const HideIco = () => (<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 11.5L3.5 5h9z" /></svg>);
const Mute = () => (<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6h3l4-3v10L6 10H3z" /><path d="M11.5 5.5a3.5 3.5 0 010 5" stroke="currentColor" strokeWidth="1.4" fill="none" /></svg>);

/* ------------------------------- the console ------------------------------- */

export function DeckConsole() {
  const deck = useSignalDeck();
  const tap = useMeterTap();

  const playing = deck.status === "playing";
  const item = deck.current;
  const queue = deck.gated ? [...deck.items, deck.gated] : deck.items;
  const first = queue[0] ?? null;
  const canStart = Boolean(item || first);
  const start = () => { if (item) deck.toggle(); else if (first) deck.load(first); };
  const pct = deck.duration > 0 ? Math.min(100, (deck.time / deck.duration) * 100) : 0;

  const state =
    deck.catalogState === "error" ? "NO SIGNAL"
    : deck.status === "error" ? "SIGNAL LOST"
    : playing ? "PLAYING"
    : deck.status === "paused" ? "PAUSED"
    : item ? "READY" : "STANDBY";

  const format = item ? (item.src.split(".").pop() || "").toUpperCase() : "";

  return (
    <section className="dk" aria-label="Audio player">
      {/* ---- the disc ---- */}
      <div className="dk-disc">
        <div className="dk-lens">
          <span className="dk-mark">ISH D</span>
          <span className="dk-lens-title">{item ? item.title : "No transmission loaded"}</span>
          <span className="dk-lens-sub">
            {item ? [item.systemCode, item.gated ? "UNROUTED" : "PUBLIC", format].filter(Boolean).join(" · ") : "SELECT A TRANSMISSION"}
          </span>
          <span className="dk-lens-time">
            <b>{formatClock(deck.time)}</b>
            <i>{playing ? <Play /> : <Pause />}</i>
            <b>{formatClock(deck.duration)}</b>
          </span>
        </div>

        <div className="dk-ring">
          <button type="button" className="dk-rb" onClick={deck.previous} aria-label="Previous track"><Prev /></button>
          <button
            type="button"
            className="dk-rb is-main"
            onClick={start}
            disabled={!canStart}
            aria-label={playing ? "Pause" : item ? "Play" : first ? `Play ${first.title}` : "Nothing to play"}
          >{playing ? <Pause /> : <Play />}</button>
          <button type="button" className="dk-rb" onClick={deck.stop} aria-label="Stop"><Stop /></button>
          <button type="button" className="dk-rb" onClick={deck.next} aria-label="Next track"><Next /></button>
          <button
            type="button"
            className={`dk-rb${deck.loop ? " is-on" : ""}`}
            onClick={deck.toggleLoop}
            aria-pressed={deck.loop}
            aria-label={deck.loop ? "Loop on" : "Loop off"}
          ><Loop /></button>
        </div>

        <span className={`dk-state dk-state--${state.toLowerCase().replace(/\s+/g, "-")}`}>
          <i className={`dk-dot${playing ? " is-live" : ""}`} />{state}
        </span>
      </div>

      {/* ---- the wing ---- */}
      <div className="dk-wing">
        <div className="dk-panel dk-panel--meter">
          <span className="dk-label">Output level</span>
          <div className="dk-scale"><span>0</span><span>-12</span><span>-24</span><span>-48</span></div>
          <div className="dk-vu"><LedMeter tap={tap} /></div>
        </div>

        <div className="dk-panel dk-panel--spec">
          <span className="dk-label">Spectrum analyser</span>
          <div className="dk-spec"><LedSpectrum tap={tap} /></div>
          <div className="dk-axis"><span>31</span><span>125</span><span>500</span><span>2K</span><span>8K</span><span>16K</span></div>
        </div>

        <div className="dk-panel dk-panel--list">
          <span className="dk-label">Playlist <i>{queue.length}</i></span>
          <ol className="dk-list">
            {queue.length === 0 && <li className="dk-empty">Nothing in the catalogue yet</li>}
            {queue.map((it, i) => {
              const isCurrent = item?.id === it.id;
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    className={`dk-row${isCurrent ? " is-current" : ""}`}
                    onClick={() => deck.load(it)}
                    aria-current={isCurrent ? "true" : undefined}
                  >
                    <span className="dk-n">{String(i + 1).padStart(2, "0")}</span>
                    <span className="dk-code">{it.systemCode}</span>
                    <span className="dk-name">{it.title}</span>
                    <span className="dk-dur">{formatClock(it.duration ?? 0)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="dk-panel dk-panel--seek">
          <span className="dk-label">Position</span>
          <div className="dk-channel">
            <input
              className="dk-range"
              type="range" min={0} max={Math.max(1, Math.round(deck.duration))} step={1}
              value={Math.min(Math.round(deck.time), Math.max(1, Math.round(deck.duration)))}
              onChange={(e) => deck.seek(Number(e.target.value))}
              aria-label="Playback position"
              style={{ ["--pct" as string]: `${pct}%` }}
            />
            <span className="dk-read">{formatClock(deck.time)} / {formatClock(deck.duration)}</span>
          </div>
        </div>

        <div className="dk-panel dk-panel--vol">
          <span className="dk-label">Volume</span>
          <div className="dk-channel">
            <button type="button" className="dk-mute" onClick={deck.toggleMute} aria-label={deck.muted ? "Unmute" : "Mute"}><Mute /></button>
            <input
              className="dk-range dk-range--vol"
              type="range" min={0} max={1} step={0.01}
              value={deck.muted ? 0 : deck.volume}
              onChange={(e) => {
                if (deck.muted && Number(e.target.value) > 0) deck.toggleMute();
                deck.setVolume(Number(e.target.value));
              }}
              aria-label="Volume"
              style={{ ["--pct" as string]: `${(deck.muted ? 0 : deck.volume) * 100}%` }}
            />
            <span className="dk-read">{Math.round((deck.muted ? 0 : deck.volume) * 100)}</span>
          </div>
        </div>
      </div>

      <span className="dk-live" role="status">
        {item ? `${item.title}. ${state}. ${formatClock(deck.time)} of ${formatClock(deck.duration)}.` : "No transmission loaded."}
      </span>
    </section>
  );
}

/* ------------------------------- mounts ------------------------------- */

export function MediaPlayerInline() {
  return <DeckConsole />;
}

export function MediaPlayerLayer() {
  const deck = useSignalDeck();
  const pathname = (usePathname() || "").replace(/\/+$/, "");

  const playing = deck.status === "playing";
  const item = deck.current;

  // /media carries the console in the page, so no floating copy over the playlist
  if (pathname === "/media") return null;

  if (deck.view === "dormant") {
    return (
      <button type="button" className="mp mp-hidden" onClick={() => deck.setView("compact")} aria-label="Open the deck">
        <span className={`mp-dot${playing ? " is-live" : ""}`} />
        <span className="mp-hidden-label">Open Deck</span>
        <span className="mp-hidden-title">{item ? item.title : playing ? "PLAYING" : "IDLE"}</span>
        <span className="mp-hidden-go" aria-hidden="true"><Open /></span>
      </button>
    );
  }

  if (deck.view === "compact") {
    const queue = deck.gated ? [...deck.items, deck.gated] : deck.items;
    const first = queue[0] ?? null;
    const canStart = Boolean(item || first);
    const pct = deck.duration > 0 ? Math.min(100, (deck.time / deck.duration) * 100) : 0;
    const state =
      deck.catalogState === "error" ? "NO SIGNAL"
      : deck.status === "error" ? "SIGNAL LOST"
      : playing ? "PLAYING"
      : deck.status === "paused" ? "PAUSED"
      : item ? "READY" : "IDLE";

    return (
      <section className="mp mp-mini" aria-label="Audio player">
        <button
          type="button"
          className="mp-mini-play"
          onClick={() => { if (item) deck.toggle(); else if (first) deck.load(first); }}
          disabled={!canStart}
          aria-label={playing ? "Pause" : item ? "Play" : first ? `Play ${first.title}` : "Nothing to play"}
        >
          {playing ? <Pause /> : <Play />}
        </button>

        <span className="mp-mini-meta">
          <b className="mp-mini-title">{item ? item.title : "No transmission loaded"}</b>
          <i className="mp-mini-sub">
            <span className={`mp-mini-dot${playing ? " is-live" : ""}`} />
            {item
              ? <><span>{formatClock(deck.time)} / {formatClock(deck.duration)}</span><span>{item.systemCode}</span></>
              : <span>{state}</span>}
          </i>
        </span>

        <span className="mp-mini-meter"><LedMeter tap={tap} /></span>

        <button type="button" className="mp-icon" onClick={() => deck.setView("expanded")} aria-label="Expand player"><Open /></button>
        <button type="button" className="mp-icon" onClick={() => deck.setView("dormant")} aria-label="Hide player"><HideIco /></button>

        <span className="mp-mini-seek" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>

        <span className="mp-live" role="status">
          {item ? `${item.title}. ${state}. ${formatClock(deck.time)} of ${formatClock(deck.duration)}.` : "No transmission loaded."}
        </span>
      </section>
    );
  }

  return (
    <div className="mp-wrap">
      <button type="button" className="mp-close" onClick={() => deck.setView("compact")} aria-label="Collapse player"><Less /></button>
      <DeckConsole />
    </div>
  );
}
