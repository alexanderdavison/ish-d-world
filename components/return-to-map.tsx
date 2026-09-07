"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

export function ReturnToMap() {
  const router = useRouter();

  function returnToMap(event: MouseEvent<HTMLAnchorElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    event.preventDefault();
    window.sessionStorage.setItem("ishd-world-booted", "true");
    document.querySelector(".interior")?.classList.add("is-returning");
    window.setTimeout(() => router.push("/"), 390);
  }

  return (
    <Link
      href="/"
      className="return-link"
      aria-label="Return to the dance floor"
      onClick={returnToMap}
    >
      <span aria-hidden="true">←</span> RETURN TO DANCE FLOOR
    </Link>
  );
}
