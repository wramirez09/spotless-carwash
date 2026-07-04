// Who may reach /admin — an email allowlist from the ADMIN_EMAILS env var
// (comma- or whitespace-separated). Pure + dependency-free so it runs in the
// Edge middleware, server components, and tests alike.
//
// Fail-closed: an empty/unset ADMIN_EMAILS means NOBODY is an admin, so the
// dashboard stays locked until the list is configured.

export function parseAdminEmails(raw: string | undefined | null): string[] {
  if (!raw) return []
  return raw
    .split(/[,\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(
  email: string | null | undefined,
  raw: string | undefined | null = process.env.ADMIN_EMAILS,
): boolean {
  if (!email) return false
  const allow = parseAdminEmails(raw)
  return allow.includes(email.trim().toLowerCase())
}
