import { Stack } from 'expo-router';
import TopBar from '@/components/TopBar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AppLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1F2937' }} edges={['top', 'bottom', 'left', 'right']}>
      <TopBar />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaView>
  );
}
