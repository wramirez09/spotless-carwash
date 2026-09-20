// America/Chicago wall-clock <-> UTC conversion.
//
// Every sale window in this business is authored in Chicago wall time ("the
// sale ends Sunday at midnight"), but Postgres stores timestamptz and the app
// compares against Date.now(). The old hardcoded windows did this conversion
// by hand with a comment noting that CDT (UTC-5) covered every window — that
// shortcut stops being safe the moment an admin can schedule a sale in, say,
// January, when Chicago is CST (UTC-6). These helpers resolve the offset for
// the actual instant instead of assuming one.
//
// Pure + dependency-free (Intl is built in) so it runs in tests and on the
// server alike.

export const SITE_TIME_ZONE = 'America/Chicago'

const PARTS_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: SITE_TIME_ZONE,
  // `hourCycle: 'h23'` rather than `hour12: false` — the latter renders
  // midnight as "24" in some Node/ICU versions, which reads back as the wrong
  // day and would silently shift a sale boundary by 24 hours.
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

type Wall = {
  year: number
  month: number // 1-12
  day: number
  hour: number
  minute: number
  second: number
}

/** The Chicago wall-clock reading of a UTC instant. */
export function chicagoWallParts(utcMs: number): Wall {
  const parts = PARTS_FORMAT.formatToParts(new Date(utcMs))
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0')
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  }
}

/** Chicago's UTC offset, in ms, at a given instant (-5h CDT / -6h CST). */
function chicagoOffsetMs(utcMs: number): number {
  const w = chicagoWallParts(utcMs)
  const asIfUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second)
  return asIfUtc - utcMs
}

/**
 * Chicago wall time -> UTC ms.
 *
 * Two passes: the first offset is looked up using the wall time read as if it
 * were UTC, which lands within an hour of the true instant; the second pass
 * re-reads the offset at that instant, which is what makes DST-transition days
 * come out right.
 *
 * Wall times that don't exist (the 2am spring-forward gap) resolve to the
 * instant one hour earlier — 2:30am becomes 1:30am CST — and ambiguous
 * fall-back times resolve to the first (daylight) occurrence. Both are
 * arbitrary but deterministic, and a sale boundary landing an hour early on
 * one day a year is not worth more machinery than that.
 */
export function chicagoWallToUtcMs(
  year: number,
  month: number, // 1-12
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): number {
  const asIfUtc = Date.UTC(year, month - 1, day, hour, minute, second)
  const firstPass = asIfUtc - chicagoOffsetMs(asIfUtc)
  return asIfUtc - chicagoOffsetMs(firstPass)
}

/**
 * Parse an `<input type="datetime-local">` value ("2026-08-20T00:00") as
 * Chicago wall time. Returns null for anything malformed — the admin form
 * surfaces that as a validation error rather than scheduling a sale at NaN.
 */
export function parseChicagoLocalInput(value: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim())
  if (!m) return null
  const [, y, mo, d, h, mi, s] = m
  const year = Number(y)
  const month = Number(mo)
  const day = Number(d)
  const hour = Number(h)
  const minute = Number(mi)
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    return null
  }
  const ms = chicagoWallToUtcMs(year, month, day, hour, minute, Number(s ?? '0'))
  // Round-trip guard: catches impossible dates like 2026-02-31, which
  // Date.UTC happily rolls forward into March.
  const back = chicagoWallParts(ms)
  if (back.day !== day || back.month !== month) return null
  return ms
}

/** UTC ms -> the `<input type="datetime-local">` value for Chicago. */
export function toChicagoLocalInput(utcMs: number): string {
  const w = chicagoWallParts(utcMs)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${w.year}-${p(w.month)}-${p(w.day)}T${p(w.hour)}:${p(w.minute)}`
}

const END_LABEL_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: SITE_TIME_ZONE,
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

/**
 * Banner copy for a sale's last day — "Mon, Sep 7".
 *
 * Windows end at 23:59:59 on their final day, so the end instant already falls
 * on the day customers should see. Formatting the raw instant is therefore
 * correct; no off-by-one adjustment.
 */
export function formatSaleEndLabel(endMs: number): string {
  return END_LABEL_FORMAT.format(new Date(endMs))
}

/** Admin-facing "Aug 20, 2026, 12:00 AM CDT" for confirming a window. */
const ADMIN_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: SITE_TIME_ZONE,
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatChicagoAdmin(utcMs: number): string {
  return ADMIN_FORMAT.format(new Date(utcMs))
}
