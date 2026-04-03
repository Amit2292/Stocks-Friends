/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "assets.parqet.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    // Prevent webpack from bundling Node.js native modules used by pg (node-postgres).
    // Without this, build fails with: Module not found: Can't resolve 'net'
    serverComponentsExternalPackages: ["pg", "pg-native"],
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
