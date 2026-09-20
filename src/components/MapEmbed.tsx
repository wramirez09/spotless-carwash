'use client'

import { useState } from 'react'

/**
 * Google Maps embed, loaded only when asked for.
 *
 * The iframe pulls ~445 KiB of Google Maps JavaScript — 41% of a location
 * page's total weight, and more than every image on the page combined. It
 * carried `loading="lazy"`, but the map sits close enough to the viewport that
 * the browser fetches it during the initial load anyway, so the attribute
 * bought nothing.
 *
 * This renders a lightweight placeholder instead and swaps in the real iframe
 * on click. Visitors who never scroll to the map — most of them — never pay
 * for it, and the ones who want it are one tap away.
 *
 * The placeholder deliberately shows the real address rather than a fake map
 * picture: a decorative image of a map that isn't the map is worse than an
 * honest control, and it would need its own (paid, keyed) Static Maps request.
 * "Get directions" stays a plain link, so the common intent — open this in my
 * phone's maps app — never needs the embed at all.
 */
export default function MapEmbed({
  address,
  locationName,
  directionsUrl,
  className = '',
}: {
  address: string
  locationName: string
  directionsUrl: string
  className?: string
}) {
  const [showMap, setShowMap] = useState(false)

  const src = `https://maps.google.com/maps?q=${encodeURIComponent(
    address,
  )}&t=&z=16&ie=UTF8&iwloc=&output=embed`

  if (showMap) {
    return (
      <iframe
        title={`Map of Spotless Carwash on ${locationName}`}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className={className}
        allowFullScreen
      />
    )
  }

  return (
    <div
      className={`${className} flex flex-col items-center justify-center gap-4 bg-paper px-6 text-center`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-10 w-10 text-blue-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M12 21s7-5.686 7-11a7 7 0 1 0-14 0c0 5.314 7 11 7 11z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="10" r="2.5" />
      </svg>

      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-blue-500">
          {locationName}
        </p>
        <p className="mt-1 text-[15px] font-extrabold leading-tight text-ink">{address}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setShowMap(true)}
          className="rounded-full bg-blue-700 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-blue-500"
        >
          Show interactive map
        </button>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-bold text-blue-700 transition hover:border-blue-500"
        >
          Get directions
        </a>
      </div>

      {/* slate-600, not slate-500: on the paper background slate-500 lands at
          4.43:1, just under the 4.5:1 WCAG AA floor for this text size. */}
      <p className="text-xs text-slate-600">
        The map loads from Google only when you open it.
      </p>
    </div>
  )
}
