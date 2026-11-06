import independence from '#/assets/images/optimized/everyday-independence.webp'
import independenceSmall from '#/assets/images/optimized/everyday-independence-small.webp'
import collaboration from '#/assets/images/optimized/shared-purpose.webp'
import collaborationSmall from '#/assets/images/optimized/shared-purpose-small.webp'
import learning from '#/assets/images/optimized/room-to-participate.webp'
import learningSmall from '#/assets/images/optimized/room-to-participate-small.webp'
import koffa from '#/assets/images/optimized/donate-koffa.webp'
import koffaSmall from '#/assets/images/optimized/donate-koffa-small.webp'
import mobility from '#/assets/images/optimized/donate-mobility.webp'
import mobilitySmall from '#/assets/images/optimized/donate-mobility-small.webp'
import school from '#/assets/images/optimized/donate-school.webp'
import schoolSmall from '#/assets/images/optimized/donate-school-small.webp'
import warmth from '#/assets/images/optimized/donate-warmth.webp'
import warmthSmall from '#/assets/images/optimized/donate-warmth-small.webp'

export type SiteImage = {
  src: string
  srcSet: string
  width: number
  height: number
}

export const editorialImages = {
  independence: {
    src: independence,
    srcSet: `${independenceSmall} 800w, ${independence} 1600w`,
    width: 1600,
    height: 894,
  },
  collaboration: {
    src: collaboration,
    srcSet: `${collaborationSmall} 800w, ${collaboration} 1600w`,
    width: 1600,
    height: 894,
  },
  learning: {
    src: learning,
    srcSet: `${learningSmall} 800w, ${learning} 1600w`,
    width: 1600,
    height: 894,
  },
} satisfies Record<string, SiteImage>

export const donationImages = {
  koffa: {
    src: koffa,
    srcSet: `${koffaSmall} 480w, ${koffa} 960w`,
    width: 960,
    height: 823,
  },
  wheelchair: {
    src: mobility,
    srcSet: `${mobilitySmall} 480w, ${mobility} 960w`,
    width: 960,
    height: 823,
  },
  school: {
    src: school,
    srcSet: `${schoolSmall} 480w, ${school} 960w`,
    width: 960,
    height: 823,
  },
  warmth: {
    src: warmth,
    srcSet: `${warmthSmall} 480w, ${warmth} 960w`,
    width: 960,
    height: 823,
  },
} satisfies Record<string, SiteImage>

export function donationImage(slug: string): SiteImage | undefined {
  return Object.hasOwn(donationImages, slug)
    ? donationImages[slug as keyof typeof donationImages]
    : undefined
}
