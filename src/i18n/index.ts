import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en/common.json';
import tr from '../locales/tr/common.json';
import de from '../locales/de/common.json';
import zh from '../locales/zh/common.json';
import he from '../locales/he/common.json';
import ar from '../locales/ar/common.json';
import fa from '../locales/fa/common.json';
import es from '../locales/es/common.json';
import hk from '../locales/hk/common.json';
import tw from '../locales/tw/common.json';
import ja from '../locales/ja/common.json';
import hi from '../locales/hi/common.json';
import th from '../locales/th/common.json';
import ru from '../locales/ru/common.json';
import fr from '../locales/fr/common.json';
import bn from '../locales/bn/common.json';
import pt from '../locales/pt/common.json';
import id from '../locales/id/common.json';
import pl from '../locales/pl/common.json';
import kp from '../locales/kp/common.json';
import kr from '../locales/kr/common.json';
import { normalizeLanguage } from './language';



const fallbackLng = 'en';

const landingResources = import.meta.glob<Record<string, string>>('../locales/*/{landing,legal}.json', { eager: true, import: 'default' });

export const resolvePreferredLanguage = () => {
  if (typeof window === 'undefined') {
    return fallbackLng;
  }
  const storedLang = localStorage.getItem('lang');
  const browserLang =
    typeof navigator !== 'undefined'
      ? (navigator.language || 'en')
      : 'en';
  return normalizeLanguage(storedLang || browserLang || fallbackLng);
};

const lng = resolvePreferredLanguage();


i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      tr: { common: tr },
      fa: { common: fa },
      he: { common: he },
      de: { common: de },
      es: { common: es },
      ja: { common: ja },
      ar: { common: ar },
      zh: { common: zh },
      hk: { common: hk },
      tw: { common: tw },
      hi: { common: hi },
      th: { common: th },
      ru: { common: ru },
      fr: { common: fr },
      bn: { common: bn },
      pt: { common: pt },
      id: { common: id },
      pl: { common: pl },
      kp: { common: kp },
      kr: { common: kr },
    },
    lng,
    fallbackLng,
    ns: ['common', 'landing', 'legal'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  });

for (const [path, translations] of Object.entries(landingResources)) {
  const language = path.split('/')[2];
  const namespace = path.split('/')[3].replace('.json', '');
  i18n.addResourceBundle(language, namespace, translations, true, false);
}

export const setLanguage = (lang: string) => {
  const language = normalizeLanguage(lang);
  i18n.changeLanguage(language);
  if (typeof window !== 'undefined') {
    localStorage.setItem('lang', language);
  }
};

export default i18n;
