import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@repo/db"],
};

export default config;
