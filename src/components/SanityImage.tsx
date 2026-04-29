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
  const src = urlFor(image).width(width).height(height).fit('crop').auto('format').url()
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
