import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "react-dom",
    "puppeteer-core",
    "@sparticuz/chromium",
    "pdf-parse",
    "pdfjs-dist",
  ],
  allowedDevOrigins: [
    "*.railway.app",
    "*.up.railway.app",
    "seo-audit-app-production-578b.up.railway.app",
  ],
};

export default nextConfig;
