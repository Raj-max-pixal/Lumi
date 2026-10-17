import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{
      source: "/:path*",
      has: [{ type: "host", value: "lumi-maxmax.vercel.app" }],
      destination: "https://lumi-max.vercel.app/:path*",
      permanent: true
    }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "randomuser.me"
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com"
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com"
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com"
      }
    ]
  }
};

export default nextConfig;
