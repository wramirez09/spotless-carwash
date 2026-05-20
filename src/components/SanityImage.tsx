import Image from 'next/image'
import { urlFor, type ImageWithAlt } from '../../lib/sanityImage'

type Props = {
  image: ImageWithAlt | null | undefined
  width: number
  height: number
  className?: string
  sizes?: string
  priority?: boolean
  quality?: number
}

export default function SanityImage({
  image,
  width,
  height,
  className,
  sizes,
  priority,
  quality = 80,
}: Props) {
  if (!image?.asset?._ref) return null
  // fit('max') downscales to fit but never upscales — prevents pixelation when
  // the source (after schema crop) is smaller than the requested render size.
  const src = urlFor(image).width(width).fit('max').auto('format').url()
  return (
    <Image
      src={src}
      alt={image.alt ?? ''}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      priority={priority}
      quality={quality}
    />
  )
}
