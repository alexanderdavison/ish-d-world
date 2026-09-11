"use client";

// The LOAD control list. One component, two scopes:
//   scope="PUBLIC"        — Transmissions / Club Dispatch releases
//   scope="WEB EXCLUSIVE" — the Unrouted Node drop (only listed once the gate is open)
// Selecting a row loads it into the single shared engine; nothing here plays on its own.

import { useMemo } from "react";
import { formatClock, useSignalDeck } from "@/components/signal-deck";

export function TransmissionList({ scope = "PUBLIC" }: { scope?: "PUBLIC" | "WEB EXCLUSIVE" }) {
  const deck = useSignalDeck();
  const gatedScope = scope === "WEB EXCLUSIVE";

  const list = useMemo(() => {
    if (gatedScope) return deck.gated ? [deck.gated] : [];
    return deck.items;
  }, [deck.gated, deck.items, gatedScope]);

  if (deck.catalogState === "loading" && list.length === 0) {
    return <p className="deck-liststatus">READING TRANSMISSIONS…</p>;
  }
  if (deck.catalogState === "error" && list.length === 0) {
    return <p className="deck-liststatus">SOURCE UNAVAILABLE / TRY AGAIN SHORTLY</p>;
  }
  if (gatedScope && !deck.unlocked) {
    return <p className="deck-liststatus">NO DISPATCH ACTIVE / STANDING BY</p>;
  }
  if (list.length === 0) {
    return <p className="deck-liststatus">SLOT READY / NO TRANSMISSIONS UPLOADED YET</p>;
  }

  return (
    <ul className="deck-list" aria-label={gatedScope ? "Unrouted dispatch" : "Transmissions"}>
      {list.map((item) => {
        const isCurrent = deck.current?.id === item.id;
        const isPlaying = isCurrent && deck.status === "playing";
        return (
          <li key={item.id}>
            <div className="deck-list-row">
              <span className="deck-row-code">{item.systemCode}</span>
              <span className="deck-list-title">
                <strong>{item.title}</strong>
                <small>
                  {item.artist}
                  {" · "}
                  {typeof item.duration === "number" ? formatClock(item.duration) : "MEASURING"}
                </small>
              </span>
              <button
                type="button"
                className={isCurrent ? "is-current" : ""}
                onClick={() => (isCurrent ? deck.toggle() : deck.load(item))}
                aria-label={isPlaying ? `Pause ${item.title}` : `Load ${item.title}`}
              >
                {isPlaying ? "PAUSE" : isCurrent ? "RESUME" : "LOAD"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
