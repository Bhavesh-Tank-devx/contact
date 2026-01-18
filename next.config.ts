import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // Configure external packages for server components (both Webpack and Turbopack)
  serverExternalPackages: ['mongoose', 'mongodb', '@mongodb-js/zstd', '@napi-rs/snappy', 'mongodb-client-encryption', 'kerberos', 'gcp-metadata', 'snappy', 'socks', 'aws4'],
  
  // Empty turbopack config to acknowledge we're using Turbopack
  turbopack: {},
};

export default nextConfig;
