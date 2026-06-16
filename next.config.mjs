/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // fluent-ffmpeg, pino and Prisma are server-only native/heavy deps;
    // keep them external to the server bundle (Next 14 API).
    serverComponentsExternalPackages: ["fluent-ffmpeg", "pino", "@prisma/client"],
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
