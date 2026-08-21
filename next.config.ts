import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  images: {
    remotePatterns: [new URL("https://readymadeui.com/**")],
  },
};

export default nextConfig;
