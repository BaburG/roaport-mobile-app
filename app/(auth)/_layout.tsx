import { Stack } from 'expo-router';
import { useContext } from 'react';
import { AuthContext } from '../_layout';
import { Redirect } from 'expo-router';

export default function AuthLayout() {
  const { hasUsername, isLoading } = useContext(AuthContext);

  if (!isLoading && hasUsername) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="username" />
    </Stack>
  );
} 