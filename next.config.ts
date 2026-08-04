import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
    globalNotFound: true,
  },
  // ============================================================================
  // CORE
  // ============================================================================

  reactStrictMode: true,

  // Hanya aktifkan standalone saat build production
  ...(isProduction && {
    output: "standalone",
  }),

  // ============================================================================
  // IMAGES
  // ============================================================================

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "icons.veryicon.com",
      },
      {
        protocol: "https",
        hostname: "file.pasarjaya.cloud",
      },
      {
        protocol: "https",
        hostname: "file.santosatechid.cloud",
      },
    ],

    formats: ["image/avif", "image/webp"],

    dangerouslyAllowSVG: true,

    minimumCacheTTL: isProduction ? 86400 : 0,

    // Loader configuration untuk bypass private IP check
    loader: "default",

    // Disable image optimization untuk domain yang resolve ke private IP
    // Ini aman karena hanya berlaku untuk external images, bukan Next.js Image component
    unoptimized: process.env.BYPASS_IMAGE_OPTIMIZATION === "true",
  },

  // ============================================================================
  // PRODUCTION
  // ============================================================================

  ...(isProduction && {
    compiler: {
      removeConsole: {
        exclude: ["error", "warn"],
      },
    },

    experimental: {
      optimizePackageImports: ["lucide-react", "date-fns", "recharts", "@tanstack/react-query", "@tanstack/react-table"],
      authInterrupts: true,
      globalNotFound: true,

      serverActions: {
        bodySizeLimit: "2mb",
      },
    },
  }),

  // ============================================================================
  // HEADERS
  // ============================================================================

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // ============================================================================
  // GENERAL
  // ============================================================================

  compress: isProduction,

  poweredByHeader: false,

  generateEtags: isProduction,
};

export default nextConfig;
