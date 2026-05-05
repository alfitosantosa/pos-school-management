import type { NextConfig } from "next";

// Determine environment: development or production
const isDev = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // ============================================================================
  // CORE CONFIGURATION
  // ============================================================================

  // Enable standalone output for Docker deployments (smaller, faster)
  output: "standalone",

  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Enable Turbopack (Next.js 16 default, config required if webpack present)
  turbopack: {},

  // ============================================================================
  // IMAGE OPTIMIZATION
  // ============================================================================
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "icons.veryicon.com" },
      { protocol: "https", hostname: "file.pasarjaya.cloud" },
      { protocol: "https", hostname: "file.santosatechid.cloud" },
    ],
    // Use modern image formats for better compression
    formats: ["image/avif", "image/webp"],
    // Image caching strategy
    minimumCacheTTL: isDev ? 0 : 86400, // 24 hours in production
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // SVG handling with security
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: isDev ? undefined : "default-src 'self'; script-src 'none'; sandbox;",
    // Production optimizations
    ...(isDev ?
      {}
    : {
        disableStaticImages: false,
      }),
    // Add timeout configuration for external images
    ...(isDev ?
      {}
      // Increase timeout for external images in production
      // timeout: 10000, // 10 seconds// Increase timeout for external images in production
      // timeout: 10000, // 10 seconds// Increase timeout for external images in production
      // timeout: 10000, // 10 seconds// Increase timeout for external images in production
      // timeout: 10000, // 10 seconds// Increase timeout for external images in production
      // timeout: 10000, // 10 seconds// Increase timeout for external images in production
      // timeout: 10000, // 10 seconds// Increase timeout for external images in production
      // timeout: 10000, // 10 seconds// Increase timeout for external images in production
      // timeout: 10000, // 10 seconds// Increase timeout for external images in production
      // timeout: 10000, // 10 seconds// Increase timeout for external images in production
      // timeout: 10000, // 10 seconds// Increase timeout for external images in production
      // timeout: 10000, // 10 seconds// Increase timeout for external images in production
      // timeout: 10000, // 10 seconds// Increase timeout for external images in production
      // timeout: 10000, // 10 seconds// Increase timeout for external images in production
      // timeout: 10000, // 10 seconds// Increase timeout for external images in production
      // timeout: 10000, // 10 seconds
    : {
        // Increase timeout for external images in production
        // timeout: 10000, // 10 seconds
      }),
  },

  // ============================================================================
  // PRODUCTION OPTIMIZATIONS
  // ============================================================================
  ...(isProduction ?
    {
      // Remove console.log in production for cleaner bundles
      compiler: {
        removeConsole: {
          exclude: ["error", "warn"], // Keep errors and warnings
        },
      },

      // Optimize package imports for tree-shaking
      experimental: {
        optimizePackageImports: [
          "lucide-react",
          "recharts",
          "date-fns",
          "@radix-ui/react-alert-dialog",
          "@radix-ui/react-avatar",
          "@radix-ui/react-checkbox",
          "@radix-ui/react-dialog",
          "@radix-ui/react-dropdown-menu",
          "@radix-ui/react-label",
          "@radix-ui/react-popover",
          "@radix-ui/react-progress",
          "@radix-ui/react-select",
          "@radix-ui/react-separator",
          "@radix-ui/react-slot",
          "@radix-ui/react-switch",
          "@radix-ui/react-tabs",
          "@tanstack/react-query",
          "@tanstack/react-table",
        ],
        // Enable server actions for better performance
        serverActions: {
          bodySizeLimit: "2mb",
        },
        authInterrupts: true,
        serverComponentsHmrCache: true,
      },
    }
  : {}),

  // ============================================================================
  // SECURITY HEADERS
  // ============================================================================
  async headers() {
    const securityHeaders = [
      {
        key: "X-DNS-Prefetch-Control",
        value: "on",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      {
        key: "X-Frame-Options",
        value: "SAMEORIGIN",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-XSS-Protection",
        value: "1; mode=block",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];

    if (isDev) {
      // Development: no caching, always fresh
      return [
        {
          source: "/:path*",
          headers: [...securityHeaders, { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" }, { key: "Pragma", value: "no-cache" }, { key: "Expires", value: "0" }],
        },
      ];
    }

    // Production: aggressive caching with security headers
    return [
      // Static assets: 1 year immutable
      {
        source: "/:all*(svg|jpg|jpeg|png|gif|webp|avif|woff|woff2|ttf|eot|ico)",
        headers: [...securityHeaders, { key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Next.js static files: 1 year immutable
      {
        source: "/_next/static/:path*",
        headers: [...securityHeaders, { key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // API routes: no cache + security
      {
        source: "/api/:path*",
        headers: [...securityHeaders, { key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
      // HTML pages: 1 hour with revalidation
      {
        source: "/:path*.html",
        headers: [...securityHeaders, { key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400" }],
      },
      // All other routes: security headers
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },

  // ============================================================================
  // PERFORMANCE & SIZE
  // ============================================================================
  // Production: compress responses
  compress: isProduction,

  // Remove "X-Powered-By" header for security
  poweredByHeader: false,

  // Generate ETags for cache validation (disable in dev for faster builds)
  generateEtags: isProduction,

  // ============================================================================
  // REDIRECTS & REWRITES (if needed)
  // ============================================================================
  // async redirects() {
  //   return [
  //     {
  //       source: "/api/:path*",
  //       destination: "/",
  //       permanent: false,
  //     },
  //   ];
  // },

  // ============================================================================
  // DEVELOPMENT-SPECIFIC
  // ============================================================================
  ...(isDev && {
    // Enable Fast Refresh for Hot Module Replacement (HMR)
    experimental: {
      // Disable Server Components HMR cache in development for instant updates
      serverComponentsHmrCache: false,
      authInterrupts: true,
    },
    // Reduce build time in development
    onDemandEntries: {
      maxInactiveAge: 15000, // 15 seconds
      pagesBufferLength: 5,
    },
  }),

  // ============================================================================
  // WEBPACK CONFIGURATION (if needed)
  // ============================================================================
  webpack: (config, { isServer, webpack }) => {
    // Fix for "self is not defined" error
    // Prevent client-only code from being bundled in server
    if (isServer) {
      // Exclude client-only packages from server bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };

      // Ignore client-only modules that use browser globals (self, window)
      // These packages should only be used in client components
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(xlsx|read-excel-file)$/,
        }),
      );
    }

    // Production optimizations
    if (isProduction && !isServer) {
      // Optimize bundle size (client-side only)
      config.optimization = {
        ...config.optimization,
        moduleIds: "deterministic",
        runtimeChunk: "single",
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: "vendor",
              chunks: "all",
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk for shared code
            common: {
              name: "common",
              minChunks: 2,
              chunks: "all",
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;
