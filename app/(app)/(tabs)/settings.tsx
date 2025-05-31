import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Clipboard,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { useLanguage } from '@/src/context/LanguageContext';
import DropDownPicker from 'react-native-dropdown-picker';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { logout, user } = useAuth();
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(locale);
  const [pushToken, setPushToken] = useState<string | undefined>();
  const [items] = useState([
    { label: 'English', value: 'en' },
    { label: 'Türkçe', value: 'tr' },
  ]);

  useEffect(() => {
    if (value !== locale) {
      setLocale(value);
    }
  }, [value]);

  useEffect(() => {
    async function registerForPushNotifications() {
      if (!Device.isDevice) {
        Alert.alert('Error', 'Push notifications are only supported on physical devices');
        return;
      }

      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          Alert.alert('Permission Required', 'Please enable push notifications in your device settings to receive notifications.');
          return;
        }

        const token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        setPushToken(token.data);

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }
      } catch (error) {
        console.error('Error registering for push notifications:', error);
        Alert.alert('Error', 'Failed to register for push notifications');
      }
    }

    registerForPushNotifications();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const handleCopyToken = () => {
    if (pushToken) {
      Clipboard.setString(pushToken);
      Alert.alert('Success', 'Token copied to clipboard');
    }
  };

  const handleRequestPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        setPushToken(token.data);
      } else {
        Alert.alert('Permission Denied', 'Please enable push notifications in your device settings to receive notifications.');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert('Error', 'Failed to request notification permission');
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#000' : '#f3f4f6' },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.languageContainer}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Language / Dil
          </Text>
          <DropDownPicker
            open={open}
            value={value}
            items={items}
            setOpen={setOpen}
            setValue={setValue}
            style={[
              styles.dropdown,
              { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff' }
            ]}
            textStyle={{
              color: colorScheme === 'dark' ? '#fff' : '#000',
              fontSize: 16,
            }}
            dropDownContainerStyle={{
              backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff',
              borderColor: '#D1D5DB',
            }}
            listItemLabelStyle={{
              color: colorScheme === 'dark' ? '#fff' : '#000',
            }}
            placeholder="Select Language"
            zIndex={1000}
          />
        </View>

        <View style={styles.tokenContainer}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Push Notification Token
          </Text>
          {pushToken ? (
            <View style={[
              styles.tokenBox,
              { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff' }
            ]}>
              <Text style={[
                styles.tokenText,
                { color: colorScheme === 'dark' ? '#fff' : '#000' }
              ]}>
                {pushToken}
              </Text>
              <TouchableOpacity
                style={[
                  styles.copyButton,
                  { backgroundColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB' }
                ]}
                onPress={handleCopyToken}
              >
                <Text style={[
                  styles.copyButtonText,
                  { color: colorScheme === 'dark' ? '#fff' : '#000' }
                ]}>
                  Copy
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.permissionButton,
                { backgroundColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB' }
              ]}
              onPress={handleRequestPermission}
            >
              <Text style={[
                styles.permissionButtonText,
                { color: colorScheme === 'dark' ? '#fff' : '#000' }
              ]}>
                Enable Push Notifications
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {user && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.logoutButton]}
              onPress={handleLogout}
            >
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  languageContainer: {
    marginBottom: 24,
    zIndex: 1000,
  },
  dropdown: {
    borderColor: '#D1D5DB',
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 52,
  },
  tokenContainer: {
    marginBottom: 24,
  },
  tokenBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenText: {
    fontSize: 14,
    fontFamily: 'monospace',
    flex: 1,
    marginRight: 12,
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  permissionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: { marginTop: 24, gap: 12 },
  button: { padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutButton: { backgroundColor: '#DC2626' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
