import { sanityFetch } from './sanityFetch'

export type SiteSettings = {
  hoursLine: string
  hoursShort: string
}

const SITE_SETTINGS_FALLBACK: SiteSettings = {
  hoursLine: 'Open 7am–10pm, every day',
  hoursShort: '7–10',
}

const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{ hoursLine, hoursShort }`

export async function getSiteSettings(): Promise<SiteSettings> {
  const data = await sanityFetch<Partial<SiteSettings>>(SITE_SETTINGS_QUERY)
  return {
    hoursLine: data?.hoursLine || SITE_SETTINGS_FALLBACK.hoursLine,
    hoursShort: data?.hoursShort || SITE_SETTINGS_FALLBACK.hoursShort,
  }
}
