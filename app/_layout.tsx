import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments, Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Toast from 'react-native-toast-message';

import { LanguageProvider } from '../src/context/LanguageContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

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

function AuthGate() {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const [hasMounted, setHasMounted] = useState(false);

  const inAuthGroup = segments[0] === '(auth)';

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted || isAuthenticated === null) {
    return <LoadingScreen />;
  }

  return <Slot />;
}


export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <LanguageProvider>
        <AuthProvider>
          <AuthGate />
          <StatusBar style="auto" />
          <Toast />
        </AuthProvider>
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
