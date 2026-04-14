import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "react-dom",
    "puppeteer-core",
    "@sparticuz/chromium",
    "pdf-parse",
    "pdfjs-dist",
  ],
};

export default nextConfig;
