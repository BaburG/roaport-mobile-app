import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/src/context/AuthContext';

interface RegisterResponse {
  status: boolean;
  message: string;
  data?: {
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
    };
  };
}

export const useRegister = () => {
  const router = useRouter();
  const { login } = useAuth();

  const handleRegister = async (
    firstName: string,
    lastName: string,
    email: string,
    phoneNumber: string,
    password: string,
    setLoading: (loading: boolean) => void
  ) => {
    if (!firstName || !lastName || !email || !phoneNumber || !password) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all fields.',
        position: 'top',
      });
      return;
    }
    setLoading(true);
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;

    if (!apiUrl) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'API URL not configured.',
        position: 'top',
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, phoneNumber, password }),
      });
      const result: RegisterResponse = await response.json();
      
      console.log('Register Response:', result);

      if (result.status && result.data) {
        const { user, access_token, refresh_token } = result.data;
        
        // Use the login function from AuthContext
        await login(access_token, refresh_token, user);

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: result.message || `Welcome ${user.firstName}!`,
          position: 'top',
        });
        router.replace('/(app)/(tabs)');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Registration Failed',
          text2: result.message || 'Registration failed.',
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Registration Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to connect to the server. Please try again.',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  return { handleRegister };
};
