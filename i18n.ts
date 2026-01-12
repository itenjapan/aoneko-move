import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationJA from './locales/ja/translation.json';
import translationEN from './locales/en/translation.json';
import translationES from './locales/es/translation.json';

const resources = {
  ja: {
    translation: translationJA
  },
  en: {
    translation: translationEN
  },
  es: {
    translation: translationES
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ja',
    debug: false,
    interpolation: {
      escapeValue: false // react already safes from xss
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie']
    }
  });

export default i18n;
