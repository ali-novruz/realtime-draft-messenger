import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Needed in a monorepo so file tracing for the standalone build reaches
  // into ../../packages/* rather than stopping at this app's own directory.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@repo/shared", "@repo/database"],
};

export default nextConfig;
