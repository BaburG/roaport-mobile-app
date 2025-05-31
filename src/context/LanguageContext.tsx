import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import { View, ActivityIndicator } from 'react-native';

const i18n = new I18n({
    en: {
        welcomeBack: 'Welcome back',
        changeLangButton: 'Change Language',
        topPlayers: 'Top Players',
        navigation: {
            home: 'Home',
            report: 'Report',
            map: 'Map',
            myReports: 'My Reports',
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
            map: 'Harita',
            myReports: 'Raporlarım',
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

// Initialize with English as fallback
i18n.enableFallback = true;

interface ILanguageContext {
    locale: string;
    setLocale: (locale: string) => void;
    t: (key: string) => string;
    isReady: boolean;
}

const defaultContext: ILanguageContext = {
    locale: 'en',
    setLocale: () => { },
    t: (key: string) => key,
    isReady: true,
};

export const LanguageContext = createContext<ILanguageContext>(defaultContext);

export function useLanguage() {
    const context = React.useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

interface LanguageProviderProps {
    children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
    const [locale, setLocaleState] = useState<string>('en');

    // Initialize with device language
    useEffect(() => {
        const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'en';
        if (deviceLang !== locale) {
            setLocaleState(deviceLang);
            i18n.locale = deviceLang;
        }
    }, []);

    const setLocale = (newLocale: string) => {
        if (newLocale !== locale) {
            setLocaleState(newLocale);
            i18n.locale = newLocale;
        }
    };

    const value: ILanguageContext = {
        locale,
        setLocale,
        t: (key: string) => {
            try {
                return i18n.t(key);
            } catch (error) {
                console.error('Translation error:', error);
                return key;
            }
        },
        isReady: true,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

