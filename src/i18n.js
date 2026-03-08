import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import httpBackend from 'i18next-http-backend'

i18n
  .use(httpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'de'],
    load: 'languageOnly', // Eliminate region-specific loads (e.g. de-DE -> de) to reduce requests
    ns: ['ui', 'items', 'venues', 'events', 'economy', 'chatter', 'minigame', 'unlocks'], // Pre-load namespaces used across scenes/modal overlays
    defaultNS: 'ui',
    keySeparator: false,
    interpolation: { escapeValue: false },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    },
    // Suspense config
    react: {
      useSuspense: true
    }
  })

export default i18n
