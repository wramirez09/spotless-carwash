/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // SanityImage renders at quality 80; Next 16 requires every quality used
    // to be declared here or it throws instead of warning.
    qualities: [80],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
}

export default nextConfig
