import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't let Next.js auto-generate AGENTS.md/CLAUDE.md on dev start —
  // this repo's CLAUDE.md (if any) is authored deliberately.
  agentRules: false,
};

export default nextConfig;
