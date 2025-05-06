import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

interface LoginResponse {
  status: boolean;
  message: string;
  data?: {
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      username: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  };
}

export const useLogin = () => {
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;

    if (!apiUrl) {
      Alert.alert('Error', 'API URL not configured.');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result: LoginResponse = await response.json();

      if (result.status && result.data) {
        const { user, access_token, refresh_token } = result.data;
        await SecureStore.setItemAsync('accessToken', access_token);
        await SecureStore.setItemAsync('refreshToken', refresh_token);
        await SecureStore.setItemAsync('user', JSON.stringify(user));

        Alert.alert('Welcome back, ' + user.username + '!');
        router.replace('/(app)/(tabs)/');
      } else {
        Alert.alert('Login Failed', result.message || 'Invalid credentials.');
      }
    } catch (error) {
      console.error('Login Error:', error);
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  return { handleLogin };
};
