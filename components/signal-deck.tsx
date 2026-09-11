"use client";

// ISH D Signal Deck — the site's single audio engine.
//
// One <audio> element is mounted in the app shell (app/layout.tsx) so that playback
// survives client-side navigation: page changes never unmount the element, and every
// play control on the site routes through this provider instead of creating its own.
//
// Three presentation states, per the design brief:
//   dormant  — the small AUDIO NODE indicator that sits in the world when nothing plays
//   compact  — the persistent dock that follows the visitor between pages
//   expanded — the sculpted console: visualizer pod + recessed track display + transport
//
// Contract with the backend (see homelab-configs services/ishd):
//   GET https://api.ishdonline.com/catalog[?key=…] -> { items, gated, unlocked }
//   Public items stream from /stream/<file>; the Unrouted exclusive from /audio?key=…
//   Durations may arrive null on the first call (they are measured server-side once)
//   and fill in on a later refresh.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const API_BASE = "https://api.ishdonline.com";
const KEY_STORAGE = "ishd-unrouted-key";
const OPEN_STORAGE = "ishd-unrouted-open";
const RESUME_STORAGE = "ishd-deck-resume";
export const DECK_REFRESH_EVENT = "ishd-deck-refresh";

export type DeckItem = {
  id: string;
  systemCode: string;
  title: string;
  artist: string;
  series: string;
  access: "PUBLIC" | "WEB EXCLUSIVE";
  gated: boolean;
  src: string;
  path: string;
  duration: number | null;
  chapters: { title: string; startTime: number }[];
  artwork: string;
  links: { label: string; url: string }[];
  allowDownload: boolean;
  bytes: number;
  modified: string;
};

type Status = "empty" | "loading" | "playing" | "paused" | "error";
type View = "dormant" | "compact" | "expanded";

type DeckApi = {
  items: DeckItem[];
  gated: DeckItem | null;
  unlocked: boolean;
  catalogState: "loading" | "ready" | "error";
  refresh: () => void;
  current: DeckItem | null;
  status: Status;
  error: string;
  time: number;
  duration: number;
  volume: number;
  muted: boolean;
  loop: boolean;
  view: View;
  load: (item: DeckItem) => void;
  toggle: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  skip: (delta: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  toggleLoop: () => void;
  setView: (view: View) => void;
  jumpToChapter: (seconds: number) => void;
};

const DeckContext = createContext<DeckApi | null>(null);

export function readAccessKey(): string {
  try {
    return window.localStorage.getItem(KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

export function isUnlockedLocally(): boolean {
  try {
    return window.localStorage.getItem(OPEN_STORAGE) === "1";
  } catch {
    return false;
  }
}

/** mm:ss, minutes uncapped so a 61:04 mix reads correctly. */
export function formatClock(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "00:00";
  const total = Math.floor(value);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function resumeState(): { id: string; time: number } | null {
  try {
    const raw = window.sessionStorage.getItem(RESUME_STORAGE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === "string" && typeof parsed.time === "number") {
      return { id: parsed.id, time: parsed.time };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function SignalDeckProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPersist = useRef(0);
  const probedDurations = useRef(0);
  // The audio element is imperative, so the callbacks must read the loaded item from a
  // ref rather than from state: load() and play() would otherwise close over the
  // previous render's `current` (null on the very first click) and play nothing.
  const currentRef = useRef<DeckItem | null>(null);

  const [items, setItems] = useState<DeckItem[]>([]);
  const [gated, setGated] = useState<DeckItem | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [catalogState, setCatalogState] = useState<"loading" | "ready" | "error">("loading");

  const [current, setCurrent] = useState<DeckItem | null>(null);
  const [status, setStatus] = useState<Status>("empty");
  const [error, setError] = useState("");
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);
  const [loop, setLoop] = useState(false);
  const [view, setView] = useState<View>("dormant");

  const refresh = useCallback(async () => {
    setCatalogState("loading");
    const key = readAccessKey();
    try {
      const response = await fetch(
        `${API_BASE}/catalog${key ? `?key=${encodeURIComponent(key)}` : ""}`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error(`catalog ${response.status}`);
      const data = await response.json();
      setItems(Array.isArray(data?.items) ? (data.items as DeckItem[]) : []);
      setGated((data?.gated as DeckItem) ?? null);
      setUnlocked(Boolean(data?.unlocked));
      setCatalogState("ready");
    } catch {
      setCatalogState("error");
    }
  }, []);

  // Load the catalog once, then re-ask a couple of times while durations are still
  // being measured on the backend (they are filled in asynchronously).
  useEffect(() => {
    void refresh();
    const onRefresh = () => void refresh();
    window.addEventListener(DECK_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(DECK_REFRESH_EVENT, onRefresh);
  }, [refresh]);

  useEffect(() => {
    if (catalogState !== "ready") return;
    const all = gated ? [...items, gated] : items;
    if (!all.length || all.every((item) => typeof item.duration === "number")) return;
    if (probedDurations.current >= 2) return;
    probedDurations.current += 1;
    const timer = window.setTimeout(() => void refresh(), probedDurations.current === 1 ? 6000 : 20000);
    return () => window.clearTimeout(timer);
  }, [catalogState, items, gated, refresh]);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentRef.current) return;
    try {
      setError("");
      setStatus("loading");
      await audio.play();
      setStatus("playing");
      setView((value) => (value === "dormant" ? "compact" : value));
    } catch {
      setStatus("error");
      setError("SIGNAL LOST / SOURCE UNAVAILABLE");
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setStatus("paused");
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentRef.current) return;
    if (audio.paused) void play();
    else pause();
  }, [pause, play]);

  const load = useCallback(
    (item: DeckItem) => {
      const audio = audioRef.current;
      currentRef.current = item;
      setCurrent(item);
      setError("");
      setTime(0);
      setDuration(typeof item.duration === "number" ? item.duration : 0);
      if (audio) {
        audio.src = item.src;
        audio.currentTime = 0;
      }
      try {
        window.sessionStorage.setItem(RESUME_STORAGE, JSON.stringify({ id: item.id, time: 0 }));
      } catch {
        /* ignore */
      }
      setView((value) => (value === "dormant" ? "compact" : value));
      void play();
    },
    [play],
  );

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setTime(0);
    setStatus("paused");
  }, []);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(seconds)) return;
    const limit = audio.duration && Number.isFinite(audio.duration) ? audio.duration : seconds;
    const target = Math.min(Math.max(0, seconds), limit);
    audio.currentTime = target;
    setTime(target);
  }, []);

  const skip = useCallback((delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    seek((audio.currentTime || 0) + delta);
  }, [seek]);

  const currentList = useMemo(() => {
    const all = gated ? [...items, gated] : items;
    return all;
  }, [items, gated]);

  const step = useCallback(
    (delta: number) => {
      const active = currentRef.current;
      if (!active || currentList.length === 0) return;
      const index = currentList.findIndex((item) => item.id === active.id);
      if (index === -1) return;
      const nextIndex = (index + delta + currentList.length) % currentList.length;
      load(currentList[nextIndex]);
    },
    [currentList, load],
  );

  const setVolume = useCallback((value: number) => {
    const audio = audioRef.current;
    const clamped = Math.min(1, Math.max(0, value));
    setVolumeState(clamped);
    setMuted(clamped === 0);
    if (audio) {
      audio.volume = clamped;
      audio.muted = clamped === 0;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (audio) audio.muted = nextMuted;
  }, [muted]);

  const toggleLoop = useCallback(() => {
    const audio = audioRef.current;
    const next = !loop;
    setLoop(next);
    if (audio) audio.loop = next;
  }, [loop]);

  // Restore position after a hard page load (full reload kills the element, not the intent).
  useEffect(() => {
    const saved = resumeState();
    if (!saved) return;
    const match = currentList.find((item) => item.id === saved.id);
    if (!match || current) return;
    const audio = audioRef.current;
    currentRef.current = match;
    setCurrent(match);
    setStatus("paused");
    setView("compact");
    setDuration(typeof match.duration === "number" ? match.duration : 0);
    setTime(saved.time);
    if (audio) {
      audio.src = match.src;
      audio.currentTime = saved.time;
    }
  }, [currentList, current]);

  // OS / lock-screen controls.
  useEffect(() => {
    const media = typeof navigator !== "undefined" ? navigator.mediaSession : undefined;
    if (!media || !current) return;
    try {
      media.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artist || "ISH D",
        album: current.series === "club-dispatch" ? "Club Dispatch" : "Transmissions",
        artwork: current.artwork ? [{ src: current.artwork }] : [],
      });
      media.playbackState = status === "playing" ? "playing" : "paused";
      media.setActionHandler("play", () => void play());
      media.setActionHandler("pause", () => pause());
      media.setActionHandler("stop", () => stop());
      media.setActionHandler("seekbackward", () => skip(-15));
      media.setActionHandler("seekforward", () => skip(15));
      media.setActionHandler("nexttrack", () => step(1));
      media.setActionHandler("previoustrack", () => step(-1));
    } catch {
      /* unsupported action names vary by browser */
    }
  }, [current, status, play, pause, stop, skip, step]);

  // Keyboard: space toggles, arrows seek, up/down volume, escape collapses.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) {
        return;
      }
      if (!current) return;
      switch (event.key) {
        case " ":
          event.preventDefault();
          toggle();
          break;
        case "ArrowRight":
          event.preventDefault();
          skip(event.shiftKey ? 60 : 5);
          break;
        case "ArrowLeft":
          event.preventDefault();
          skip(event.shiftKey ? -60 : -5);
          break;
        case "ArrowUp":
          event.preventDefault();
          setVolume(volume + 0.05);
          break;
        case "ArrowDown":
          event.preventDefault();
          setVolume(volume - 0.05);
          break;
        case "Escape":
          setView((value) => (value === "expanded" ? "compact" : value));
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, toggle, skip, setVolume, volume]);

  const api: DeckApi = {
    items,
    gated,
    unlocked,
    catalogState,
    refresh,
    current,
    status,
    error,
    time,
    duration,
    volume,
    muted,
    loop,
    view,
    load,
    toggle,
    stop,
    next: () => step(1),
    previous: () => step(-1),
    seek,
    skip,
    setVolume,
    toggleMute,
    toggleLoop,
    setView,
    jumpToChapter: (seconds: number) => seek(seconds),
  };

  return (
    <DeckContext.Provider value={api}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        loop={loop}
        onLoadedMetadata={(event) => {
          const value = event.currentTarget.duration;
          if (Number.isFinite(value) && value > 0) setDuration(value);
        }}
        onTimeUpdate={(event) => {
          const value = event.currentTarget.currentTime;
          setTime(value);
          const now = Date.now();
          if (currentRef.current && now - lastPersist.current > 4000) {
            lastPersist.current = now;
            try {
              window.sessionStorage.setItem(
                RESUME_STORAGE,
                JSON.stringify({ id: currentRef.current.id, time: value }),
              );
            } catch {
              /* ignore */
            }
          }
        }}
        onPlay={() => setStatus("playing")}
        onPause={() => setStatus("paused")}
        onWaiting={() => setStatus("loading")}
        onEnded={() => setStatus("paused")}
        onError={() => {
          if (!currentRef.current) return;
          setStatus("error");
          setError("SIGNAL LOST / SOURCE UNAVAILABLE");
        }}
      />
    </DeckContext.Provider>
  );
}

export function useSignalDeck(): DeckApi {
  const context = useContext(DeckContext);
  if (!context) throw new Error("useSignalDeck must be used inside SignalDeckProvider");
  return context;
}
