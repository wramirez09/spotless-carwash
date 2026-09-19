/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // A production build and a running `next dev` both write to `.next` by
  // default, and the build's manifests overwrite the ones the dev server is
  // serving from — which surfaces as "__webpack_modules__[moduleId] is not a
  // function" on the next render. Setting NEXT_DIST_DIR gives a verification
  // build its own directory so it can run while dev stays up. Unset (the
  // normal case, including on Vercel) behaves exactly as before.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
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
