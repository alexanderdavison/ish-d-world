import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Legacy static paths. These files existed in the retired DORFIC build
      // and 404 on the Signal Network app; keep old links working.
      { source: "/privacy.html", destination: "/privacy", permanent: true },
      { source: "/signup.html", destination: "/transmission-list", permanent: true },
      { source: "/signup", destination: "/transmission-list", permanent: true },
      { source: "/epk.html", destination: "/epk", permanent: true },
      // The press kit PDF was renamed 2024 -> 2026; keep the old URL working
      // for anyone who already has it (the carousel linked it until now).
      { source: "/epk/IshD_EPK_2024.pdf", destination: "/epk/IshD_EPK_2026.pdf", permanent: true },
      // Legacy paths from the pre-Signal site, still reported as 404 by Search
      // Console. Each one goes to the page that replaced it, so old links and any
      // already-indexed URL resolve instead of dead-ending.
      { source: "/transmissions", destination: "/transmission-list", permanent: true },
      { source: "/music", destination: "/media", permanent: true },
      { source: "/console", destination: "/media", permanent: true },
      { source: "/deck", destination: "/media", permanent: true },
      { source: "/radio", destination: "/media", permanent: true },
      { source: "/dj", destination: "/links", permanent: true },
      { source: "/blog", destination: "/news", permanent: true },
      { source: "/press", destination: "/epk", permanent: true },
      { source: "/contact", destination: "/info", permanent: true },
      { source: "/events", destination: "/news", permanent: true },
      { source: "/shows", destination: "/news", permanent: true },
      { source: "/shop", destination: "/links", permanent: true },
      { source: "/store", destination: "/links", permanent: true },
      { source: "/merch", destination: "/links", permanent: true },
      { source: "/login", destination: "/", permanent: true },
      // The static era served .html files; keep those URLs pointing at their pages
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/about.html", destination: "/about", permanent: true },
      { source: "/contact.html", destination: "/info", permanent: true },
      { source: "/projects.html", destination: "/projects", permanent: true },
      { source: "/links.html", destination: "/links", permanent: true },
      { source: "/media.html", destination: "/media", permanent: true },
      { source: "/news.html", destination: "/news", permanent: true },
      { source: "/info.html", destination: "/info", permanent: true },
      // Browsers and crawlers ask for the icon at the conventional path
      { source: "/favicon.ico", destination: "/favicon.svg", permanent: true },
      { source: "/apple-touch-icon.png", destination: "/favicon.svg", permanent: true },
    ];
  },
};

export default nextConfig;
