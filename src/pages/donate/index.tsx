import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { campaignBySlugQueryOptions } from '#/api/collections/campaigns/queries'
import { campaignLanguageSchema } from '#/api/collections/campaigns/schemas'
import { DonateHero } from './components/donate-hero'
import { PurposeSelection } from './components/purpose-selection'
import { FlexibleGift } from './components/flexible-gift'
import { GiftJourney } from './components/gift-journey'

type DonatePageProps = {
  campaignSlug?: string
  projectSlug?: string
  generalPurpose?: boolean
}

export function DonatePage(props: DonatePageProps) {
  const { i18n } = useTranslation()
  const language = campaignLanguageSchema
    .catch('en')
    .parse(i18n.resolvedLanguage)
  const campaign = useQuery({
    ...campaignBySlugQueryOptions(props.campaignSlug ?? '', language),
    enabled: props.campaignSlug !== undefined,
  })

  return (
    <main className="-mt-[calc(var(--brand-header-height)+var(--brand-header-offset)+1rem)]">
      <DonateHero />
      <PurposeSelection
        campaign={
          campaign.data
            ? {
                slug: campaign.data.slug,
                title: campaign.data.translation.title,
                projectSlugs: campaign.data.projects.map(
                  (project) => project.slug,
                ),
              }
            : undefined
        }
        projectSlug={props.projectSlug}
        generalPurpose={props.generalPurpose}
      />
      <FlexibleGift />
      <GiftJourney />
    </main>
  )
}
