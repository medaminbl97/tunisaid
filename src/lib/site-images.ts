import courtyard from '#/assets/images/optimized/courtyard-support.webp'
import courtyardSmall from '#/assets/images/optimized/courtyard-support-small.webp'
import craft from '#/assets/images/optimized/craft-workshop.webp'
import craftSmall from '#/assets/images/optimized/craft-workshop-small.webp'
import equipment from '#/assets/images/optimized/equipment-storage.webp'
import equipmentSmall from '#/assets/images/optimized/equipment-storage-small.webp'
import hearing from '#/assets/images/optimized/hearing-test.webp'
import hearingSmall from '#/assets/images/optimized/hearing-test-small.webp'
import sewing from '#/assets/images/optimized/sewing-training.webp'
import sewingSmall from '#/assets/images/optimized/sewing-training-small.webp'
import transport from '#/assets/images/optimized/accessible-transport.webp'
import transportSmall from '#/assets/images/optimized/accessible-transport-small.webp'
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

// Photographs of the work (not generated images), exported at their real
// dimensions and never upscaled.
export const editorialImages = {
  courtyard: {
    src: courtyard,
    srcSet: `${courtyardSmall} 720w, ${courtyard} 1271w`,
    width: 1271,
    height: 1237,
  },
  sewing: {
    src: sewing,
    srcSet: `${sewingSmall} 720w, ${sewing} 1280w`,
    width: 1280,
    height: 853,
  },
  craft: {
    src: craft,
    srcSet: `${craftSmall} 720w, ${craft} 1269w`,
    width: 1269,
    height: 1239,
  },
  equipment: {
    src: equipment,
    srcSet: `${equipmentSmall} 720w, ${equipment} 1271w`,
    width: 1271,
    height: 1237,
  },
  hearing: {
    src: hearing,
    srcSet: `${hearingSmall} 720w, ${hearing} 1280w`,
    width: 1280,
    height: 960,
  },
  transport: {
    src: transport,
    srcSet: `${transportSmall} 720w, ${transport} 1270w`,
    width: 1270,
    height: 1239,
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
