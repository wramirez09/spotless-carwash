// Shipping-address shape and formatting, shared by the server-side fulfillment
// queries and the client-side admin table.
//
// Deliberately NOT marked `server-only`: lib/fulfillments.ts is, because it
// holds the service-role Supabase queries, and a client component importing a
// runtime value from it would pull that whole module into the browser bundle
// (and fail the build). Keeping the pure helper here lets both sides use it.

/** Subscriber shipping fields, as selected from `subscriptions`. */
export type ShipTo = {
  ship_line1: string | null
  ship_line2: string | null
  ship_city: string | null
  ship_state: string | null
  ship_postal_code: string | null
  ship_country: string | null
}

/** Format an address as display lines, dropping any that are blank. */
export function addressLines(sub: ShipTo | null | undefined): string[] {
  if (!sub) return []
  const cityLine = [sub.ship_city, sub.ship_state].filter(Boolean).join(', ')
  const cityState = [cityLine, sub.ship_postal_code].filter(Boolean).join(' ')
  return [sub.ship_line1, sub.ship_line2, cityState]
    .map((l) => (l || '').trim())
    .filter(Boolean)
}
