import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptBR from './locales/pt-BR.json';
import en from './locales/en.json';

const resources = {
  'pt-BR': {
    translation: ptBR,
  },
  en: {
    translation: en,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt-BR', // default language
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false, // react already escapes values
    },
    
    // Enable namespace support
    defaultNS: 'translation',
    ns: ['translation'],
  });

export default i18n;
