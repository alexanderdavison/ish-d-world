"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Public subscribe bridge (LXC 211, Listmonk Transmission List).
// Contract + docs: homelab-configs/services/ishd/README.md
const SUBSCRIBE_ENDPOINT = "https://api.ishdonline.com/subscribe";

export function TransmissionForm() {
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<"idle" | "error" | "server-error" | "loading" | "success">(
    "idle",
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setState("error");
      return;
    }
    setState("loading");
    try {
      const response = await fetch(SUBSCRIBE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, hp: trap }),
      });
      if (!response.ok) {
        throw new Error(`subscribe failed: ${response.status}`);
      }
      setState("success");
    } catch {
      setState("server-error");
    }
  }

  if (state === "success") {
    return (
      <div className="transmission-success" role="status">
        <p className="panel-meta">TRANSMISSION LIST</p>
        <h2>Address ready.</h2>
        <p><span>{email}</span> is on the list. New music, private links, and notes from the room will land there.</p>
      </div>
    );
  }

  return (
    <form className="transmission-form" onSubmit={submit} noValidate>
      <label htmlFor="transmission-email">TRANSMISSION LIST</label>
      <p>New music, private links, and occasional notes from the room.</p>
      <div className="form-row">
        <Input
          id="transmission-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="ENTER ADDRESS"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={state === "error"}
          aria-describedby="transmission-note transmission-error"
          disabled={state === "loading"}
        />
        {/* honeypot: hidden from people, tempting to bots */}
        <input
          type="text"
          name="hp"
          value={trap}
          onChange={(event) => setTrap(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
        />
        <Button type="submit" disabled={state === "loading"}>
          {state === "loading" ? "SENDING" : "JOIN ↗"}
        </Button>
      </div>
      <p id="transmission-note">No noise. Unsubscribe anytime.</p>
      <p id="transmission-error" className="form-error" role="alert">
        {state === "error"
          ? "Enter a valid email address."
          : state === "server-error"
            ? "Couldn't reach the list just now — try again."
            : ""}
      </p>
    </form>
  );
}
