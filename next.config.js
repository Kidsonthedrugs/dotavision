/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: { root: __dirname },
  output: "standalone",
  images: {
    remotePatterns: [
      {protocol: "https",hostname: "**"}
    ]
  }
};
module.exports = nextConfig;