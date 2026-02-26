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
    ns: ['ui', 'events', 'venues', 'items', 'unlocks'], // Namespaces for game areas
    defaultNS: 'ui',
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
