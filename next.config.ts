import type { NextConfig } from "next";
import "./src/env";
import { securityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,

  // pino resolves its own transports at runtime, so bundling it breaks them.
  serverExternalPackages: ["pino", "pino-pretty"],

  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com", pathname: "/**" }],
  },

  async headers() {
    return [{ source: "/:path*", headers: [...securityHeaders] }];
  },
};

export default nextConfig;
