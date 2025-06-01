import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/src/context/AuthContext';

interface LoginResponse {
  status: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    refreshExpiresIn: number;
    tokenType: string;
    scope: string;
    user: {
      id: string;
      username: string;
      email: string;
      firstName: string;
      lastName: string;
      phoneNumber: string;
    };
  };
}

export const useLogin = () => {
  const router = useRouter();
  const { login } = useAuth();

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 50,
      text1Style: {
        fontSize: 18,
        fontWeight: '600',
      },
      text2Style: {
        fontSize: 16,
      },
    });
  };

  const handleLogin = async (email: string, password: string, setLoading: (loading: boolean) => void) => {
    if (!email || !password) {
      showToast('error', 'Missing Information', 'Please fill in all fields to continue.');
      return;
    }

    setLoading(true);
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    
    if (!apiUrl) {
      showToast('error', 'Configuration Error', 'API URL is not configured. Please contact support.');
      setLoading(false);
      return;
    }

    try {
      console.log('Sending login request to:', `${apiUrl}/mobile/auth/login`);
      console.log('Request body:', { email, password });

      const response = await fetch(`${apiUrl}/mobile/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });

      // Get the response text first
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      // Check if response is ok
      if (!response.ok) {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.message || 'Login failed. Please check your credentials and try again.');
      }

      // Try to parse the response text as JSON
      let result: LoginResponse;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response text:', responseText);
        throw new Error('Server response was invalid. Please try again later.');
      }

      console.log('Login Response:', result);

      if (result.status && result.data) {
        const { user, accessToken, refreshToken } = result.data;
        
        // Use the login function from AuthContext
        await login(accessToken, refreshToken, user);

        showToast('success', 'Welcome Back!', 'You have successfully logged in.');
        router.replace('/(app)/(tabs)');
      } else {
        showToast('error', 'Login Failed', 'Please check your credentials and try again.');
      }
    } catch (error) {
      console.error('Login Error:', error);
      showToast(
        'error',
        'Login Failed',
        error instanceof Error ? error.message : 'Unable to connect to the server. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin };
};
