"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export type SignalTrack = {
  id: string;
  title: string;
  subtitle: string;
  kind: "audio" | "youtube";
  src?: string;
  href?: string;
  access: "PUBLIC" | "WEB EXCLUSIVE";
};

type SignalPlayerProps = {
  tracks: SignalTrack[];
};

function formatTime(value: number) {
  if (!Number.isFinite(value)) return "00:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function SignalPlayer({ tracks }: SignalPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [selectedId, setSelectedId] = useState(tracks[0]?.id ?? "");
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const selected = tracks.find((track) => track.id === selectedId) ?? tracks[0];
  const canPlayAudio = selected?.kind === "audio" && Boolean(selected.src);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [selectedId]);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !canPlayAudio) return;
    if (audio.paused) {
      await audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function activatePrimary() {
    if (!selected) return;
    if (selected.kind === "youtube" && selected.href) {
      window.open(selected.href, "_blank", "noopener,noreferrer");
      return;
    }
    void togglePlayback();
  }

  function seek(value: number[]) {
    const audio = audioRef.current;
    if (!audio || !canPlayAudio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  }

  if (!selected) return null;

  return (
    <div className="signal-player">
      <audio
        ref={audioRef}
        src={selected.kind === "audio" ? selected.src : undefined}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={() => setPlaying(false)}
      />

      <div className="player-display">
        <div className="player-readout">
          <span>{selected.access}</span>
          <strong>{selected.title}</strong>
          <small>{selected.subtitle}</small>
        </div>
        <div className={`pixel-wave ${playing ? "is-playing" : ""}`} aria-hidden="true">
          {Array.from({ length: 32 }, (_, index) => (
            <i
              key={index}
              style={{
                "--wave-index": index,
                "--wave-height": `${10 + (index % 7) * 6}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        <div className="player-controls">
          <Button
            type="button"
            onClick={activatePrimary}
            disabled={selected.kind === "audio" && !canPlayAudio}
            aria-label={
              selected.kind === "youtube"
                ? `Open ${selected.title} on YouTube`
                : playing
                  ? `Pause ${selected.title}`
                  : `Play ${selected.title}`
            }
          >
            {selected.kind === "youtube" ? "PLAY DISPATCH ↗" : canPlayAudio ? (playing ? "PAUSE" : "PLAY") : "AUDIO FILE PENDING"}
          </Button>
          <div className="player-timeline">
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={0.1}
              disabled={!canPlayAudio}
              onValueChange={seek}
              aria-label="Track position"
            />
            <div><span>{formatTime(currentTime)}</span><span>{duration ? formatTime(duration) : "--:--"}</span></div>
          </div>
        </div>
      </div>

      <ol className="signal-playlist" aria-label="Club Dispatch episodes">
        {tracks.map((track, index) => (
          <li key={track.id}>
            <button
              type="button"
              className={track.id === selected.id ? "is-selected" : ""}
              onClick={() => setSelectedId(track.id)}
              aria-pressed={track.id === selected.id}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{track.title}</strong>
              <small>{track.kind === "youtube" ? "YOUTUBE" : track.src ? "READY" : "SLOT READY"}</small>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
