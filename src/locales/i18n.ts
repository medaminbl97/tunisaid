import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import commonDe from './de/common.json'
import commonEn from './en/common.json'
import donationDe from './de/donation.json'
import donationEn from './en/donation.json'

export const defaultNS = 'common'

export const resources = {
  en: {
    common: commonEn,
    donation: donationEn,
  },
  de: {
    common: commonDe,
    donation: donationDe,
  },
} as const

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  defaultNS,
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
