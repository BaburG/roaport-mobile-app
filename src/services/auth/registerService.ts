import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/src/context/AuthContext';
import { API_URL } from '@/src/config/constants';

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
    console.log('🚀 Registration started');
    console.log('📋 Form data:', { firstName, lastName, email, phoneNumber, hasPassword: !!password });
    
    if (!firstName || !lastName || !email || !phoneNumber || !password) {
      console.log('❌ Validation failed: Missing fields');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all fields.',
        position: 'top',
      });
      return;
    }
    
    setLoading(true);
    console.log('⏳ Loading state set to true');
    
    const apiUrl = API_URL;
    console.log('🌐 API URL:', apiUrl);

    if (!apiUrl) {
      console.log('❌ API URL not configured');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'API URL not configured.',
        position: 'top',
      });
      setLoading(false);
      return;
    }

    const fullUrl = `${apiUrl}/mobile/auth/register`;
    console.log('📍 Full API endpoint:', fullUrl);

    try {
      console.log('📤 Sending registration request...');
      const requestBody = { firstName, lastName, email, phoneNumber, password };
      console.log('📦 Request body:', { ...requestBody, password: '[HIDDEN]' });
      
      // Add timeout and additional error handling for network issues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch(fullUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'RoaportMobileApp/1.0.3'
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
          redirect: 'follow'
        });
        
        clearTimeout(timeoutId);
        
        console.log('📨 Response received');
        console.log('📊 Response status:', response.status);
        console.log('📊 Response ok:', response.ok);
        console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Get the response text first for better debugging
        const responseText = await response.text();
        console.log('📄 Raw response text:', responseText);
        
        if (!response.ok) {
          console.log('❌ Response not ok, status:', response.status);
          let errorMessage = 'Registration failed';
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
            console.log('📄 Parsed error data:', errorData);
          } catch (parseError) {
            console.log('❌ Failed to parse error response:', parseError);
          }
          throw new Error(errorMessage);
        }
        
        // Try to parse the response
        let result: RegisterResponse;
        try {
          result = JSON.parse(responseText);
          console.log('✅ Successfully parsed response:', result);
        } catch (parseError) {
          console.error('❌ JSON Parse Error:', parseError);
          console.error('📄 Response text that failed to parse:', responseText);
          throw new Error('Server response was invalid. Please try again later.');
        }

        console.log('🔍 Checking result status:', result.status);
        console.log('🔍 Has result.data:', !!result.data);

        if (result.status && result.data) {
          const { user, access_token, refresh_token } = result.data;
          console.log('👤 User data received:', user);
          console.log('🔑 Tokens received:', { hasAccessToken: !!access_token, hasRefreshToken: !!refresh_token });
          
          console.log('🔐 Calling AuthContext login function...');
          try {
            await login(access_token, refresh_token, user);
            console.log('✅ AuthContext login successful');
          } catch (loginError) {
            console.error('❌ AuthContext login failed:', loginError);
            throw new Error('Failed to save authentication data');
          }

          console.log('🎉 Showing success toast');
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: result.message || `Welcome ${user.firstName}!`,
            position: 'top',
          });
          
          console.log('🧭 Navigating to app tabs');
          router.replace('/(app)/(tabs)');
          console.log('✅ Registration process completed successfully');
        } else {
          console.log('❌ Registration failed - status or data missing');
          console.log('📊 Result status:', result.status);
          console.log('📊 Result data:', result.data);
          
          Toast.show({
            type: 'error',
            text1: 'Registration Failed',
            text2: result.message || 'Registration failed.',
            position: 'top',
          });
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timed out. Please check your internet connection.');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('💥 Registration Error:', error);
      console.error('🔍 Error type:', typeof error);
      console.error('🔍 Error constructor:', error?.constructor?.name);
      
      if (error instanceof Error) {
        console.error('📝 Error message:', error.message);
        console.error('📜 Error stack:', error.stack);
      }
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Failed to connect to the server. Please try again.',
        position: 'top',
      });
    } finally {
      console.log('🔄 Setting loading to false');
      setLoading(false);
      console.log('✅ Registration process ended');
    }
  };

  return { handleRegister };
};
