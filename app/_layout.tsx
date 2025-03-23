import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useCallback } from 'react';
import 'react-native-reanimated';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/useColorScheme';
import Toast from 'react-native-toast-message';

// Create a context to share the auth state
import { createContext } from 'react';
import { LanguageProvider } from './languageContext';
export const AuthContext = createContext<{
  hasUsername: boolean | null;
  isLoading: boolean;
  updateUsername: (hasUsername: boolean) => void;
}>({
  hasUsername: null,
  isLoading: true,
  updateUsername: () => { },
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function LoadingScreen() {
  const colorScheme = useColorScheme();

  return (
    <View style={[
      styles.loadingContainer,
      { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }
    ]}>
      <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#fff' : '#000'} />
      <Text style={[
        styles.loadingText,
        { color: colorScheme === 'dark' ? '#fff' : '#000' }
      ]}>
        Loading...
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasUsername, setHasUsername] = useState<boolean | null>(null);

  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const updateUsername = useCallback((value: boolean) => {
    setHasUsername(value);
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        const username = await AsyncStorage.getItem('username');
        setHasUsername(!!username);
      } catch (e) {
        console.warn(e);
        setHasUsername(false);
      } finally {
        setIsLoading(false);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  // Show loading screen while determining initial route and loading fonts
  if (!fontsLoaded || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <LanguageProvider>
        <AuthContext.Provider value={{ hasUsername, isLoading, updateUsername }}>
          <Slot />
          <StatusBar style="auto" />
          <Toast />
        </AuthContext.Provider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
