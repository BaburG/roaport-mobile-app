import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

const i18n = new I18n({
    en: {
        welcomeBack: 'Welcome back',
        changeLangButton: 'Change Language',
        topPlayers: 'Top Players',
        navigation: {
            home: 'Home',
            report: 'Report',
            settings: 'Settings'
        },
        report: {
            reportQuestion: 'What do you want to report?',
            additionalDetails: {
                title: 'Additional Details (Optional)',
                placeholder: 'Describe the issue in more detail...'
            },
            buttons: {
                retake: 'Retake',
                submit: 'Submit Report'
            },
            pothole: {
                title: 'Pothole',
                description: 'Report damaged road surface'
            },
            trafficSign: {
                title: 'Traffic Sign',
                description: 'Report issues with traffic signs',
            },
            sidewalk: {
                title: 'Sidewalk',
                description: 'Report sidewalk problems'
            },
            other: {
                title: 'Other',
                description: 'Report other road issues'
            }
        }
    },
    tr: {
        welcomeBack: 'Hoş geldin',
        changeLangButton: 'Dil Değiştir',
        topPlayers: 'En İyiler',
        navigation: {
            home: 'Anasayfa',
            report: 'Raporla',
            settings: 'Ayarlar'
        },
        report: {
            reportQuestion: 'Neyi raporlamak istiyorsun?',
            additionalDetails: {
                title: 'Ek Detaylar (İsteğe Bağlı)',
                placeholder: 'Sorunu daha fazla açıklayın...'
            },
            buttons: {
                retake: 'Tekrarla',
                submit: 'Raporu Gönder'
            },
            pothole: {
                title: 'Çukur',
                description: 'Hasarlı yolu raporla'
            },
            trafficSign: {
                title: 'Trafik Tabelası',
                description: 'Tabelalarla ilgili sorunu raporla',
            },
            sidewalk: {
                title: 'Kaldırım',
                description: 'Kaldırım sorunlarını raporla'
            },
            other: {
                title: 'Diğer',
                description: 'Diğer yol sorunlarını raporla'
            }
        }
    },
});

i18n.fallbacks = true;
const deviceLang = Localization.locale.split('-')[0];
i18n.locale = deviceLang;

interface ILanguageContext {
    locale: string;
    setLocale: React.Dispatch<React.SetStateAction<string>>;
    t: (key: string) => string;
}

export const LanguageContext = createContext<ILanguageContext>({
    locale: deviceLang,
    setLocale: () => { },
    t: (key: string) => key,
});

interface LanguageProviderProps {
    children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
    const [locale, setLocale] = useState<string>(deviceLang);

    useEffect(() => {
        i18n.locale = locale;
    }, [locale]);

    const value: ILanguageContext = {
        locale,
        setLocale,
        t: (key: string) => i18n.t(key),
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

