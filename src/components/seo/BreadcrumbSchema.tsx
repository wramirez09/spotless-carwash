import JsonLd from './JsonLd'

const SITE_URL = 'https://spotlesscarwash.com'

export type BreadcrumbItem = {
  name: string
  /** Path relative to site root, e.g. "/faq". Omit on the final crumb. */
  path?: string
}

export default function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      ...(item.path ? { item: `${SITE_URL}${item.path}` } : {}),
    })),
  }
  return <JsonLd data={data} />
}
