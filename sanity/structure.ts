import type { StructureBuilder, StructureResolver } from 'sanity/structure'
import { SINGLETON_TYPES } from './schemas'

const SINGLETON_LABELS: Record<string, string> = {
  siteSettings: 'Site settings',
  navbar: 'Nav bar',
  footer: 'Footer',
  hero: 'Hero',
  heroLights: 'Hero lights',
  washesSection: 'Washes — section',
  howSection: 'How it works',
  locationsSection: 'Locations — section',
  bays: 'Bays',
  testimonialSection: 'Testimonials',
  instructions: 'Self-serve dial',
  otherServices: 'Other services',
  tokens: 'Wash tokens',
  emailSection: 'Email signup',
  faqPage: 'FAQ page',
}

function singletonItem(S: StructureBuilder, type: string) {
  return S.listItem()
    .title(SINGLETON_LABELS[type] ?? type)
    .id(type)
    .child(S.document().schemaType(type).documentId(type))
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site sections')
        .child(
          S.list()
            .title('Site sections')
            .items(SINGLETON_TYPES.map((t) => singletonItem(S, t))),
        ),
      S.divider(),
      S.documentTypeListItem('location').title('Locations'),
      S.documentTypeListItem('washPackage').title('Wash packages'),
      S.documentTypeListItem('dialStep').title('Dial steps'),
      S.documentTypeListItem('faqEntry').title('FAQ entries'),
    ])
