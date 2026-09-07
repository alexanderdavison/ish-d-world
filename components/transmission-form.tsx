"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TransmissionForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "error" | "loading" | "success">("idle");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setState("error");
      return;
    }
    setState("loading");
    window.setTimeout(() => setState("success"), 700);
  }

  if (state === "success") {
    return (
      <div className="transmission-success" role="status">
        <p className="panel-meta">TRANSMISSION LIST</p>
        <h2>Address ready.</h2>
        <p><span>{email}</span> is ready for the backend connection.</p>
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
        <Button type="submit" disabled={state === "loading"}>
          {state === "loading" ? "SENDING" : "JOIN ↗"}
        </Button>
      </div>
      <p id="transmission-note">No noise. Unsubscribe anytime.</p>
      <p id="transmission-error" className="form-error" role="alert">
        {state === "error" ? "Enter a valid email address." : ""}
      </p>
    </form>
  );
}
