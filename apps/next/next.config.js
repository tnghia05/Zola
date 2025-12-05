/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@zola/app"],
  experimental: {
    optimizePackageImports: ["@zola/app"]
  }
};

module.exports = nextConfig;

