import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { useLanguage } from '@/src/context/LanguageContext';
import DropDownPicker from 'react-native-dropdown-picker';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { logout, user } = useAuth();
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(locale);
  const [items] = useState([
    { label: 'English', value: 'en' },
    { label: 'Türkçe', value: 'tr' },
  ]);

  useEffect(() => {
    if (value !== locale) {
      setLocale(value);
    }
  }, [value]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to logout');
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
  buttonContainer: { marginTop: 24, gap: 12 },
  button: { padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutButton: { backgroundColor: '#DC2626' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
