/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  trailingSlash: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
