import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLanguage } from '../../../src/context/LanguageContext';
import { useAuth } from '@/src/context/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t, isReady } = useLanguage();
  const { isAuthenticated } = useAuth();
  
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280',
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff',
            borderTopColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB',
            height: 88,
            paddingBottom: 20,
          },
          default: {
            backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff',
            borderTopColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB',
            height: 60,
          },
        }),
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff',
        },
        headerTintColor: colorScheme === 'dark' ? '#fff' : '#1F2937',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff',
            borderTopColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB',
          },
          default: {
            backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff',
            borderTopColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB',
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.notifications'),
          tabBarIcon: ({ color }) => <Ionicons size={28} name="notifications-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: t('navigation.report'),
          tabBarIcon: ({ color }) => <Ionicons size={24} name="camera" color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t('navigation.map'),
          tabBarIcon: ({ color }) => <Ionicons size={24} name="map-outline" color={color} />,
          tabBarStyle: {
            display: isAuthenticated ? 'flex' : 'none',
          },
        }}
      />
      <Tabs.Screen
        name="my-reports"
        options={{
          title: t('navigation.myReports'),
          tabBarIcon: ({ color }) => <Ionicons size={24} name="document-text-outline" color={color} />,
          tabBarStyle: {
            display: isAuthenticated ? 'flex' : 'none',
          },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('navigation.settings'),
          tabBarIcon: ({ color }) => <Ionicons size={24} name="settings-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
