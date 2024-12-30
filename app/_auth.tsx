import { Redirect, Stack } from 'expo-router';
import { useContext } from 'react';
import { AuthContext } from './_layout';

export default function AuthLayout() {
  const { hasUsername, isLoading } = useContext(AuthContext);

  // Handle the authentication
  if (!isLoading && !hasUsername) {
    return <Redirect href="/username" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="username" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
} 