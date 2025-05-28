import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useLanguage } from '../../src/context/LanguageContext';

export default function AuthLayout() {
  const { isReady } = useLanguage();

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
