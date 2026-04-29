import { createImageUrlBuilder } from '@sanity/image-url'
import { sanityClient } from './sanity'

const builder = createImageUrlBuilder(sanityClient)

export function urlFor(source: Parameters<typeof builder.image>[0]) {
  return builder.image(source)
}

export type ImageWithAlt = {
  asset?: { _ref?: string; _type?: string }
  alt?: string
  hotspot?: { x: number; y: number; height: number; width: number }
  crop?: { top: number; bottom: number; left: number; right: number }
}
