import type { NextConfig } from "next";
import path from "node:path";

const isProd = process.env.NODE_ENV === "production";

/**
 * Deployed as a fully static site to GitHub Pages at
 * https://lucckozak.github.io/salonapp/ — hence `output: "export"` and the
 * `/salonapp` base path (only applied for production builds so `npm run dev`
 * still serves from `/`).
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isProd ? "/salonapp" : undefined,
  assetPrefix: isProd ? "/salonapp/" : undefined,
  turbopack: {
    root: path.resolve(__dirname),
  },
  devIndicators: false,
};

export default nextConfig;
