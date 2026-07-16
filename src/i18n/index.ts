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



const fallbackLng = 'en';

const normalizeLang = (lang: string) => {
  if (lang === 'zh-tw') return 'tw';
  if (lang === 'zh-hk') return 'hk';
  return lang;
};

export const resolvePreferredLanguage = () => {
  if (typeof window === 'undefined') {
    return fallbackLng;
  }
  const storedLang = localStorage.getItem('lang');
  const browserLang =
    typeof navigator !== 'undefined'
      ? (navigator.language || 'en').split('-')[0]
      : 'en';
  return normalizeLang(storedLang || browserLang || fallbackLng);
};

const lng = fallbackLng;


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
    ns: ['common'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  });

export const setLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
  if (typeof window !== 'undefined') {
    localStorage.setItem('lang', lang);
  }
};

export default i18n;
