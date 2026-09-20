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
    // Serve AVIF where the browser accepts it, falling back to WebP. AVIF is
    // roughly 20-30% smaller than WebP at the same visual quality; the first
    // request for each size pays a slower transform, every one after is a
    // cache hit. Order matters — Next picks the first format the client
    // advertises support for.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
}

export default nextConfig
