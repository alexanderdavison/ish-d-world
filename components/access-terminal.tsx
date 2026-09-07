"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AccessTerminal() {
  const [pending, setPending] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
  }

  return (
    <form className="access-terminal" onSubmit={submit}>
      <p className="panel-meta">UNROUTED NODE / RESTRICTED</p>
      <h2 className="panel-lead">Access key required.</h2>
      <p>This terminal is reserved for unlisted and website-only dispatches.</p>
      <div className="form-row">
        <Input type="password" autoComplete="off" placeholder="ENTER ACCESS KEY" aria-label="Access key" />
        <Button type="submit">VERIFY</Button>
      </div>
      <p className="access-status" role="status">
        {pending ? "AUTHORIZATION SERVICE PENDING / BACKEND NOT CONNECTED" : "NO PUBLIC ROUTE AVAILABLE"}
      </p>
    </form>
  );
}
