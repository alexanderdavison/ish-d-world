"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DECK_REFRESH_EVENT } from "@/components/signal-deck";

// Unrouted Node gate — validates the personal access key against ishd-api.
// Mechanic (decided 2026-09-09): per-person keys, no expiry.
// Contract + docs: homelab-configs/services/ishd/README.md
const ACCESS_ENDPOINT = "https://api.ishdonline.com/access";
const UNLOCK_STORAGE_KEY = "ishd-unrouted-open";
// The key itself stays on this device so the shared player can fetch gated audio later
// without asking again. "CLOSE THE TERMINAL" clears both values.
const ACCESS_KEY_STORAGE = "ishd-unrouted-key";

type State = "idle" | "loading" | "refused" | "ratelimited" | "offline";

export function AccessTerminal() {
  const [key, setKey] = useState("");
  const [state, setState] = useState<State>("idle");
  const [open, setOpen] = useState(false);

  // stay open for a returning visitor (a threshold, not DRM)
  useEffect(() => {
    try {
      if (window.localStorage.getItem(UNLOCK_STORAGE_KEY) === "1") setOpen(true);
    } catch {
      /* private mode — ignore */
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!key.trim()) {
      setState("refused");
      return;
    }
    setState("loading");
    try {
      const response = await fetch(ACCESS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data?.ok) {
          try {
            window.localStorage.setItem(UNLOCK_STORAGE_KEY, "1");
            window.localStorage.setItem(ACCESS_KEY_STORAGE, key.trim().toUpperCase());
          } catch {
            /* ignore */
          }
          window.dispatchEvent(new Event(DECK_REFRESH_EVENT));
          setState("idle");
          setOpen(true);
          return;
        }
        setState("refused");
        return;
      }
      if (response.status === 429) {
        setState("ratelimited");
        return;
      }
      setState("refused");
    } catch {
      setState("offline");
    }
  }

  function lock() {
    try {
      window.localStorage.removeItem(UNLOCK_STORAGE_KEY);
      window.localStorage.removeItem(ACCESS_KEY_STORAGE);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(DECK_REFRESH_EVENT));
    setKey("");
    setState("idle");
    setOpen(false);
  }

  if (open) {
    return (
      <div className="access-terminal" role="status">
        <p className="panel-meta">UNROUTED NODE / SIGNAL OPEN</p>
        <h2 className="panel-lead">You&rsquo;re through.</h2>
        <p>
          This terminal stays open on this device. Unlisted and website-only dispatches land
          here &mdash; the ones that never reach YouTube or Spotify.
        </p>
        <p className="access-status" role="status">NO DISPATCH ACTIVE / STANDING BY</p>
        <button type="button" className="utility-action" onClick={lock}>
          CLOSE THE TERMINAL
        </button>
      </div>
    );
  }

  const statusLine =
    state === "loading"
      ? "CHECKING KEY…"
      : state === "refused"
        ? "KEY REFUSED / NO ROUTE"
        : state === "ratelimited"
          ? "TOO MANY ATTEMPTS / WAIT"
          : state === "offline"
            ? "SIGNAL LOST / TRY AGAIN"
            : "NO PUBLIC ROUTE AVAILABLE";

  return (
    <form className="access-terminal" onSubmit={submit}>
      <p className="panel-meta">UNROUTED NODE / RESTRICTED</p>
      <h2 className="panel-lead">Access key required.</h2>
      <p>This terminal is reserved for unlisted and website-only dispatches.</p>
      <div className="form-row">
        <Input
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="ENTER ACCESS KEY"
          aria-label="Access key"
          value={key}
          onChange={(event) => setKey(event.target.value)}
          disabled={state === "loading"}
          aria-invalid={state === "refused"}
        />
        <Button type="submit" disabled={state === "loading"}>
          {state === "loading" ? "VERIFYING" : "VERIFY"}
        </Button>
      </div>
      <p className="access-status" role="status">{statusLine}</p>
    </form>
  );
}
