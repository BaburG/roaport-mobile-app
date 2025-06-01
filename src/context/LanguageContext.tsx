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
            notifications: 'Notifications',
            map: 'Map',
            myReports: 'My Reports',
            settings: 'Settings'
        },
        notifications: {
            title: 'Notification Mode',
            subtitle: 'Get alerted when approaching road issues',
            toggle: {
                active: 'ACTIVE',
                inactive: 'INACTIVE',
                monitoring: 'Monitoring {count} nearby issues'
            },
            settings: {
                detectionRange: {
                    title: 'Detection Range',
                    description: 'How far to search for road issues',
                    unit: 'km'
                },
                alertDistance: {
                    title: 'Alert Distance',
                    description: 'When to trigger the alert',
                    unit: 'm'
                },
                notificationTone: {
                    title: 'Notification Tone',
                    description: 'Sound to play when issue detected'
                },
                volume: 'Volume',
                verifiedOnly: {
                    title: 'Verified Issues Only',
                    description: 'Only alert for verified reports'
                }
            },
            tones: {
                default: 'Default Beep',
                alert: 'Alert Chime',
                bell: 'Bell Ring',
                warning: 'Warning Buzzer',
                ping: 'Gentle Ping'
            },
            nearestHazard: {
                title: 'Nearest Hazard',
                away: 'away',
                reportedBy: 'Reported by {username}',
                verified: 'Verified',
                noHazards: 'No hazards detected in your area'
            },
            status: {
                title: 'Current Status',
                location: 'Location:',
                locationActive: 'Active',
                locationGetting: 'Getting location...',
                nearbyIssues: 'Nearby Issues:',
                issuesFound: '{count} found',
                alertsTriggered: 'Alerts Triggered:',
                testNotification: 'Test Notification'
            },
            alert: {
                title: '🚨 Road Issue Alert',
                subtitle: '{type} detected {distance}m ahead',
                reportedBy: 'Reported by: {username}'
            },
            types: {
                pothole: 'Pothole',
                sign: 'Sign',
                sidewalk: 'Sidewalk'
            }
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
            notifications: 'Bildirimler',
            map: 'Harita',
            myReports: 'Raporlarım',
            settings: 'Ayarlar'
        },
        notifications: {
            title: 'Bildirim Modu',
            subtitle: 'Yol sorunlarına yaklaştığınızda uyarı alın',
            toggle: {
                active: 'AKTİF',
                inactive: 'PASİF',
                monitoring: '{count} yakın sorun izleniyor'
            },
            settings: {
                detectionRange: {
                    title: 'Algılama Mesafesi',
                    description: 'Yol sorunlarını ne kadar uzaktan arayacak',
                    unit: 'km'
                },
                alertDistance: {
                    title: 'Uyarı Mesafesi',
                    description: 'Uyarının ne zaman tetikleneceği',
                    unit: 'm'
                },
                notificationTone: {
                    title: 'Bildirim Sesi',
                    description: 'Sorun tespit edildiğinde çalacak ses'
                },
                volume: 'Ses Seviyesi',
                verifiedOnly: {
                    title: 'Sadece Doğrulanmış Sorunlar',
                    description: 'Sadece doğrulanmış raporlar için uyarı'
                }
            },
            tones: {
                default: 'Varsayılan Bip',
                alert: 'Uyarı Sesi',
                bell: 'Zil Sesi',
                warning: 'Tehlike Sesi',
                ping: 'Yumuşak Ping'
            },
            nearestHazard: {
                title: 'En Yakın Tehlike',
                away: 'uzakta',
                reportedBy: '{username} tarafından raporlandı',
                verified: 'Doğrulandı',
                noHazards: 'Bölgenizde herhangi bir tehlike tespit edilmedi'
            },
            status: {
                title: 'Mevcut Durum',
                location: 'Konum:',
                locationActive: 'Aktif',
                locationGetting: 'Konum alınıyor...',
                nearbyIssues: 'Yakın Sorunlar:',
                issuesFound: '{count} bulundu',
                alertsTriggered: 'Tetiklenen Uyarılar:',
                testNotification: 'Test Bildirimi'
            },
            alert: {
                title: '🚨 Yol Sorunu Uyarısı',
                subtitle: '{distance}m ileride {type} tespit edildi',
                reportedBy: 'Rapor eden: {username}'
            },
            types: {
                pothole: 'Çukur',
                sign: 'Tabela',
                sidewalk: 'Kaldırım'
            }
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
    interpolate: (key: string, variables: Record<string, string | number>) => string;
    isReady: boolean;
}

const defaultContext: ILanguageContext = {
    locale: 'en',
    setLocale: () => { },
    t: (key: string) => key,
    interpolate: (key: string, variables: Record<string, string | number>) => key,
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
        interpolate: (key: string, variables: Record<string, string | number>) => {
            try {
                let text = i18n.t(key);
                Object.keys(variables).forEach(variable => {
                    text = text.replace(new RegExp(`{${variable}}`, 'g'), String(variables[variable]));
                });
                return text;
            } catch (error) {
                console.error('Interpolation error:', error);
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

