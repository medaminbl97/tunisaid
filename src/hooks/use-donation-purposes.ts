import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { donationPurposesQueryOptions } from '#/api/collections/donation-purposes/queries'
import { donationPurposeLanguageSchema } from '#/api/collections/donation-purposes/schemas'

export function useDonationPurposes() {
  const { i18n } = useTranslation()
  const language = donationPurposeLanguageSchema
    .catch('en')
    .parse(i18n.resolvedLanguage)
  return useQuery(donationPurposesQueryOptions(language))
}
