import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'lodash', 'recharts', '@radix-ui/react-icons'],
  },
};

export default withPWA(nextConfig);
