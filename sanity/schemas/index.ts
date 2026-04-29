import type { SchemaTypeDefinition } from 'sanity'

// Reusable objects
import ctaLink from './objects/ctaLink'
import imageWithAlt from './objects/imageWithAlt'

// Singletons (one document per type)
import siteSettings from './singletons/siteSettings'
import navbar from './singletons/navbar'
import footer from './singletons/footer'
import hero from './singletons/hero'
import heroLights from './singletons/heroLights'
import washesSection from './singletons/washesSection'
import howSection from './singletons/howSection'
import locationsSection from './singletons/locationsSection'
import bays from './singletons/bays'
import testimonialSection from './singletons/testimonialSection'
import instructions from './singletons/instructions'
import otherServices from './singletons/otherServices'
import tokens from './singletons/tokens'
import email from './singletons/email'
import faqPage from './singletons/faqPage'

// Documents (multiple per type)
import location from './documents/location'
import washPackage from './documents/washPackage'
import dialStep from './documents/dialStep'
import faqEntry from './documents/faqEntry'

export const SINGLETON_TYPES = [
  'siteSettings',
  'navbar',
  'footer',
  'hero',
  'heroLights',
  'washesSection',
  'howSection',
  'locationsSection',
  'bays',
  'testimonialSection',
  'instructions',
  'otherServices',
  'tokens',
  'emailSection',
  'faqPage',
] as const

export const schemaTypes: SchemaTypeDefinition[] = [
  // objects
  ctaLink,
  imageWithAlt,
  // singletons
  siteSettings,
  navbar,
  footer,
  hero,
  heroLights,
  washesSection,
  howSection,
  locationsSection,
  bays,
  testimonialSection,
  instructions,
  otherServices,
  tokens,
  email,
  faqPage,
  // documents
  location,
  washPackage,
  dialStep,
  faqEntry,
]
