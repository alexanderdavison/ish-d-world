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
    ];
  },
};

export default nextConfig;
