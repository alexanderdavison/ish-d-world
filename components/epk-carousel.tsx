"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const pages = Array.from({ length: 8 }, (_, index) => `/epk/page-${index + 1}.jpg`);

export function EpkCarousel() {
  const [page, setPage] = useState(0);
  const frameRef = useRef<HTMLElement>(null);

  function changePage(direction: number) {
    setPage((current) => (current + direction + pages.length) % pages.length);
  }

  function viewFullscreen() {
    void frameRef.current?.requestFullscreen?.();
  }

  return (
    <div className="epk-carousel">
      <div className="epk-heading">
        <div>
          <p className="panel-meta">EPK / ARTIST FILE</p>
          <strong>ORIGINAL PRESS KIT</strong>
        </div>
        <a href="/epk/IshD_EPK_2026.pdf" download>DOWNLOAD PDF ↓</a>
      </div>

      <figure className="epk-frame" ref={frameRef}>
        <Image
          src={pages[page]}
          alt={`Ish D electronic press kit page ${page + 1} of ${pages.length}`}
          width={1210}
          height={935}
          unoptimized
          priority={page === 0}
        />
      </figure>

      <div className="epk-controls">
        <Button type="button" variant="outline" onClick={() => changePage(-1)}>← PREVIOUS</Button>
        <span>PAGE {String(page + 1).padStart(2, "0")} / {String(pages.length).padStart(2, "0")}</span>
        <Button type="button" variant="outline" onClick={() => changePage(1)}>NEXT →</Button>
        <Button type="button" variant="outline" onClick={viewFullscreen}>VIEW FULLSCREEN</Button>
      </div>
    </div>
  );
}
