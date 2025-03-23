import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

const i18n = new I18n();

i18n.translations = {
    en: {
        welcomeBack: 'Welcome back',
        changeLangButton: 'Change Language',
    },
  tr: {
        welcomeBack: 'Hoş geldin',
        changeLangButton: 'Dil Değiştir'
    },
};

i18n.fallbacks = true;

const deviceLanguage = Localization.locale.split('-')[0]; 
i18n.locale = deviceLanguage;


export function changeLanguage(lang) {
    i18n.locale = lang;
}

export default i18n;
