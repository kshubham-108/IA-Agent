import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ia-agent/engine", "@ia-agent/extraction-schemas"],
};

export default nextConfig;
