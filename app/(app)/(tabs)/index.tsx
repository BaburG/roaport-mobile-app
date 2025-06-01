import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Switch,
  Animated,
  AppState,
  Vibration,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { LanguageContext } from '@/src/context/LanguageContext';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DropDownPicker from 'react-native-dropdown-picker';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://roaport-website.vercel.app';

interface Post {
  id: string;
  name: string;
  imageUrl: string;
  longitude: number;
  latitude: number;
  dateCreated: string;
  type: string;
  description: string;
  username: string;
  verified: string;
}

interface NotificationSettings {
  isActive: boolean;
  range: number;
  proximity: number;
  tone: string;
  verified: boolean;
  volume: number;
}

interface AlertNotification {
  id: string;
  post: Post;
  distance: number;
  timestamp: number;
}

const MOCK_DATA: Post[] = [
  {
    "id": "29",
    "name": "Babur",
    "imageUrl": "https://img.roaport.com/5618a02e-91c8-409a-abc7-327fc2ed23d2.jpg",
    "longitude": 27.20123058373531,
    "latitude": 38.45462444410858,
    "dateCreated": "2025-01-29T08:35:56.345Z",
    "type": "sidewalk",
    "description": "No description provided",
    "username": "Babur",
    "verified": ""
  },
  {
    "id": "30",
    "name": "ataaaksoy",
    "imageUrl": "https://img.roaport.com/d9e4b66d-f588-441f-bf13-d42373baa3b1.jpg",
    "longitude": 27.2031045,
    "latitude": 38.4555039,
    "dateCreated": "2025-01-29T08:36:24.929Z",
    "type": "sign",
    "description": "Damaged traffic sign",
    "username": "ataaaksoy",
    "verified": ""
  },
  {
    "id": "31",
    "name": "Babur",
    "imageUrl": "https://img.roaport.com/015ea7be-7c01-496c-8135-5da6fab94fd6.jpg",
    "longitude": 27.20199165542966,
    "latitude": 38.45260599755289,
    "dateCreated": "2025-01-29T08:38:22.307Z",
    "type": "pothole",
    "description": "No description provided",
    "username": "Babur",
    "verified": ""
  }
];

// Sound mappings - you can replace these with actual sound files
// For built-in sounds, you have several options:
// 1. Use system sounds (vibration + haptics) - Already implemented
// 2. Add custom .mp3/.wav files to assets/sounds/ directory
// 3. Use online sound libraries like freesound.org or zapsplat.com
// 4. Generate simple tones programmatically
// 
// Example: Create assets/sounds/alert.mp3, then update:
// alert: require('../../../assets/sounds/alert.mp3')
const SOUND_MAP = {
  default: require('../../../assets/sounds/default.wav'),
  alert: require('../../../assets/sounds/alert.wav'),
  bell: require('../../../assets/sounds/bell.wav'),
  warning: require('../../../assets/sounds/warning.wav'),
  ping: require('../../../assets/sounds/ping.wav'),
};

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const { t, interpolate } = useContext(LanguageContext);
  
  const [settings, setSettings] = useState<NotificationSettings>({
    isActive: false,
    range: 3,
    proximity: 10,
    tone: 'default',
    verified: false,
    volume: 0.2,
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [lastFetchLocation, setLastFetchLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [notifiedPosts, setNotifiedPosts] = useState<Set<string>>(new Set());
  
  const [isTonePickerOpen, setIsTonePickerOpen] = useState(false);
  const [tempTone, setTempTone] = useState<string>(settings.tone);
  const [isTestingSound, setIsTestingSound] = useState(false);

  // Notification system
  const [currentNotification, setCurrentNotification] = useState<AlertNotification | null>(null);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const notificationOpacity = useRef(new Animated.Value(0)).current;
  const notificationTranslateY = useRef(new Animated.Value(-100)).current;

  // Nearest hazard tracking
  const [nearestHazard, setNearestHazard] = useState<{ post: Post; distance: number } | null>(null);

  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);
  const animatedScale = useRef(new Animated.Value(1)).current;

  const NOTIFICATION_TONES = [
    { label: t('notifications.tones.default'), value: 'default' },
    { label: t('notifications.tones.alert'), value: 'alert' },
    { label: t('notifications.tones.bell'), value: 'bell' },
    { label: t('notifications.tones.warning'), value: 'warning' },
    { label: t('notifications.tones.ping'), value: 'ping' },
  ];

  useEffect(() => {
    loadSettings();
    return () => {
      if (locationWatchRef.current) {
        locationWatchRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (settings.isActive) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
  }, [settings.isActive]);

  useEffect(() => {
    if (userLocation && settings.isActive) {
      checkProximityAlerts();
      checkForLocationUpdate();
      updateNearestHazard();
    }
  }, [userLocation, posts, settings]);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        // Ensure volume has a valid default value
        if (typeof parsedSettings.volume !== 'number' || isNaN(parsedSettings.volume)) {
          parsedSettings.volume = 0.2; // Default to 20%
        }
        setSettings(parsedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for notifications.');
        return;
      }

      // Get initial location and fetch posts
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
      await fetchNearbyPosts(location.coords.latitude, location.coords.longitude);

      // Start watching location
      locationWatchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 5, // Update when moved 5 meters
        },
        (location) => {
          setUserLocation(location);
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Error', 'Failed to start location tracking.');
    }
  };

  const stopLocationTracking = () => {
    if (locationWatchRef.current) {
      locationWatchRef.current.remove();
      locationWatchRef.current = null;
    }
    setUserLocation(null);
    setLastFetchLocation(null);
    setPosts([]);
    setNotifiedPosts(new Set());
  };

  const fetchNearbyPosts = async (latitude: number, longitude: number) => {
    try {
      //console.log(`Making API call to: ${API_URL}/api/posts?lat=${latitude}&lon=${longitude}&verified=${settings.verified}&maxDistance=${settings.range}`);
      
      const response = await fetch(`${API_URL}/api/posts?lat=${latitude}&lon=${longitude}&verified=${settings.verified}&maxDistance=${settings.range}`);
      
      //console.log('Response status:', response.status);
      //console.log('Response headers:', response.headers);
      
      // Get the raw response text first
      const responseText = await response.text();
      //console.log('Raw response:', responseText);
      
      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
      }
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        //console.log('Parsed JSON data:', data);
      } catch (parseError) {
        //console.error('Failed to parse JSON:', parseError);
        //console.log('Response was not valid JSON, using mock data');
        setPosts(MOCK_DATA);
        setLastFetchLocation({ latitude, longitude });
        return;
      }
      
      // Use the data
      setPosts(data.data || data); // Handle both data.data and direct data structures
      setLastFetchLocation({ latitude, longitude });
      
    } catch (error) {
      //console.error('Error fetching posts:', error);
      //console.log('Falling back to mock data');
      // Fallback to mock data
      setPosts(MOCK_DATA);
      setLastFetchLocation({ latitude, longitude });
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const checkProximityAlerts = () => {
    if (!userLocation) return;

    posts.forEach((post) => {
      if (notifiedPosts.has(post.id)) return;

      const distance = calculateDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        post.latitude,
        post.longitude
      );

      if (distance <= settings.proximity) {
        triggerAlert(post, distance);
        setNotifiedPosts(prev => new Set([...prev, post.id]));
      }
    });
  };

  const checkForLocationUpdate = () => {
    if (!userLocation || !lastFetchLocation) return;

    const distanceFromLastFetch = calculateDistance(
      userLocation.coords.latitude,
      userLocation.coords.longitude,
      lastFetchLocation.latitude,
      lastFetchLocation.longitude
    );

    // If moved more than half the range, fetch new data
    if (distanceFromLastFetch >= (settings.range * 1000) / 2) {
      fetchNearbyPosts(userLocation.coords.latitude, userLocation.coords.longitude);
      // Reset notified posts when getting new data
      setNotifiedPosts(new Set());
    }
  };

  const testSound = async () => {
    setIsTestingSound(true);
    await playNotificationSound(settings.tone);
    setTimeout(() => setIsTestingSound(false), 500);
  };

  const testNotification = async () => {
    // Create a mock notification
    const mockPost: Post = {
      id: 'test',
      name: 'Test User',
      imageUrl: '',
      longitude: 0,
      latitude: 0,
      dateCreated: new Date().toISOString(),
      type: 'pothole',
      description: 'This is a test notification',
      username: 'TestUser',
      verified: 'true',
    };

    await triggerAlert(mockPost, 15);
  };

  const playNotificationSound = async (tone: string) => {
    try {
      // Always provide haptic feedback first for immediate response
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Set audio mode to allow playback even in silent mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
      });

      const soundFile = SOUND_MAP[tone as keyof typeof SOUND_MAP];
      
      if (soundFile) {
        // If we have a custom sound file, play it
        const { sound } = await Audio.Sound.createAsync(soundFile);
        
        // Set the volume based on user setting (ensure it's a valid number)
        const volume = isNaN(settings.volume) ? 0.2 : settings.volume;
        await sound.setVolumeAsync(volume);
        
        await sound.playAsync();
        
        // Cleanup
        setTimeout(async () => {
          await sound.unloadAsync();
        }, 3000);
      } else {
        // For now, provide different haptic patterns for different tones
        switch (tone) {
          case 'alert':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Vibration.vibrate([0, 100, 50, 100]);
            break;
          case 'bell':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Vibration.vibrate([0, 150]);
            break;
          case 'warning':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Vibration.vibrate([0, 200, 100, 200, 100, 200]);
            break;
          case 'ping':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Vibration.vibrate([0, 50]);
            break;
          default:
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Vibration.vibrate([0, 100]);
        }
        console.log(`Playing ${tone} notification sound (haptic feedback)`);
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
      // Fallback to basic haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const triggerAlert = async (post: Post, distance: number) => {
    // Trigger haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    // Trigger vibration pattern based on issue type
    const vibrationPattern = post.type === 'pothole' ? [0, 250, 100, 250] : [0, 150, 150, 150];
    Vibration.vibrate(vibrationPattern);

    // Play notification sound
    await playNotificationSound(settings.tone);

    // Show custom notification instead of alert
    const notification: AlertNotification = {
      id: Date.now().toString(),
      post,
      distance,
      timestamp: Date.now(),
    };

    setCurrentNotification(notification);
    showNotification();
  };

  const showNotification = () => {
    setIsNotificationVisible(true);
    
    // Animate in
    Animated.parallel([
      Animated.timing(notificationOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(notificationTranslateY, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after 4 seconds
    setTimeout(() => {
      hideNotification();
    }, 4000);
  };

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(notificationOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(notificationTranslateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsNotificationVisible(false);
      setCurrentNotification(null);
    });
  };

  const toggleNotificationMode = () => {
    const newSettings = { ...settings, isActive: !settings.isActive };
    saveSettings(newSettings);
    
    // Animate button
    Animated.sequence([
      Animated.timing(animatedScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const updateRange = (value: number) => {
    const newSettings = { ...settings, range: value };
    saveSettings(newSettings);
  };

  const updateProximity = (value: number) => {
    const newSettings = { ...settings, proximity: value };
    saveSettings(newSettings);
  };

  const updateVerified = (value: boolean) => {
    const newSettings = { ...settings, verified: value };
    saveSettings(newSettings);
  };

  const updateTone = (value: string) => {
    const newSettings = { ...settings, tone: value };
    saveSettings(newSettings);
  };

  const updateVolume = (value: number) => {
    // Ensure value is a valid number between 0 and 1
    const validValue = isNaN(value) ? 0.2 : Math.max(0, Math.min(1, value));
    const newSettings = { ...settings, volume: validValue };
    saveSettings(newSettings);
  };

  const updateNearestHazard = () => {
    if (!userLocation || posts.length === 0) {
      setNearestHazard(null);
      return;
    }

    let nearest: { post: Post; distance: number } | null = null;
    let minDistance = Infinity;

    posts.forEach((post) => {
      const distance = calculateDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        post.latitude,
        post.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = { post, distance };
      }
    });

    setNearestHazard(nearest);
  };

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: colorScheme === 'dark' ? '#000' : '#f3f4f6' }
    ]}>
      {/* Custom Notification */}
      {isNotificationVisible && currentNotification && (
        <Animated.View
          style={[
            styles.notificationOverlay,
            {
              opacity: notificationOpacity,
              transform: [{ translateY: notificationTranslateY }],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.notificationBox,
              { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff' }
            ]}
            onPress={hideNotification}
            activeOpacity={0.9}
          >
            <View style={styles.notificationHeader}>
              <View style={styles.notificationIcon}>
                <Ionicons name="warning" size={24} color="#EF4444" />
              </View>
              <View style={styles.notificationContent}>
                <Text style={[
                  styles.notificationTitle,
                  { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                ]}>
                  {t('notifications.alert.title')}
                </Text>
                <Text style={[
                  styles.notificationSubtitle,
                  { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
                ]}>
                  {interpolate('notifications.alert.subtitle', { 
                    type: t(`notifications.types.${currentNotification.post.type}`), 
                    distance: Math.round(currentNotification.distance) 
                  })}
                </Text>
                <Text style={[
                  styles.notificationDetails,
                  { color: colorScheme === 'dark' ? '#D1D5DB' : '#374151' }
                ]}>
                  {interpolate('notifications.alert.reportedBy', { username: currentNotification.post.username })}
                </Text>
                {currentNotification.post.description && currentNotification.post.description !== 'No description provided' && (
                  <Text style={[
                    styles.notificationDescription,
                    { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
                  ]}>
                    {currentNotification.post.description}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={hideNotification}
              >
                <Ionicons name="close" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      <FlatList 
        style={styles.content} 
        data={[1]} 
        keyExtractor={(item) => item.toString()} 
        showsVerticalScrollIndicator={false}
        renderItem={() => (
          <View>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[
                styles.title,
                { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
              ]}>
                {t('notifications.title')}
              </Text>
              <Text style={[
                styles.subtitle,
                { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
              ]}>
                {t('notifications.subtitle')}
              </Text>
            </View>

            {/* Main Toggle */}
            <Animated.View style={[
              styles.toggleContainer,
              {
                backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff',
                transform: [{ scale: animatedScale }]
              }
            ]}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: settings.isActive ? '#22C55E' : (colorScheme === 'dark' ? '#374151' : '#E5E7EB')
                  }
                ]}
                onPress={toggleNotificationMode}
                activeOpacity={0.8}
              >
                <View style={styles.toggleContent}>
                  <Ionicons
                    name={settings.isActive ? 'notifications' : 'notifications-off'}
                    size={32}
                    color={settings.isActive ? '#fff' : (colorScheme === 'dark' ? '#9CA3AF' : '#6B7280')}
                  />
                  <Text style={[
                    styles.toggleText,
                    {
                      color: settings.isActive ? '#fff' : (colorScheme === 'dark' ? '#9CA3AF' : '#6B7280')
                    }
                  ]}>
                    {settings.isActive ? t('notifications.toggle.active') : t('notifications.toggle.inactive')}
                  </Text>
                </View>
              </TouchableOpacity>
              
              {settings.isActive && (
                <View style={styles.statusIndicator}>
                  <View style={styles.statusDot} />
                  <Text style={[
                    styles.statusText,
                    { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
                  ]}>
                    {interpolate('notifications.toggle.monitoring', { count: posts.length })}
                  </Text>
                </View>
              )}
            </Animated.View>

            {/* Nearest Hazard Section */}
            {settings.isActive && (
              <View style={[
                styles.nearestHazardContainer,
                { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff' }
              ]}>
                <View style={styles.nearestHazardHeader}>
                  <Ionicons name="location" size={20} color="#F59E0B" />
                  <Text style={[
                    styles.nearestHazardTitle,
                    { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                  ]}>
                    {t('notifications.nearestHazard.title')}
                  </Text>
                </View>
                
                {nearestHazard ? (
                  <View style={styles.hazardInfo}>
                    <View style={styles.hazardDistance}>
                      <Text style={[
                        styles.distanceValue,
                        { 
                          color: nearestHazard.distance <= settings.proximity 
                            ? '#EF4444' 
                            : nearestHazard.distance <= 100 
                              ? '#F59E0B' 
                              : '#10B981' 
                        }
                      ]}>
                        {nearestHazard.distance < 1000 
                          ? `${Math.round(nearestHazard.distance)}m` 
                          : `${(nearestHazard.distance / 1000).toFixed(1)}km`}
                      </Text>
                      <Text style={[
                        styles.distanceLabel,
                        { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
                      ]}>
                        {t('notifications.nearestHazard.away')}
                      </Text>
                    </View>
                    
                    <View style={styles.hazardDetails}>
                      <View style={styles.hazardType}>
                        <View style={[
                          styles.hazardTypeIcon,
                          { 
                            backgroundColor: nearestHazard.post.type === 'pothole' 
                              ? '#EF4444' 
                              : nearestHazard.post.type === 'sign' 
                                ? '#F59E0B' 
                                : '#8B5CF6' 
                          }
                        ]}>
                          <Ionicons 
                            name={
                              nearestHazard.post.type === 'pothole' 
                                ? 'warning' 
                                : nearestHazard.post.type === 'sign' 
                                  ? 'stop' 
                                  : 'construct'
                            } 
                            size={16} 
                            color="#fff" 
                          />
                        </View>
                        <Text style={[
                          styles.hazardTypeName,
                          { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                        ]}>
                          {t(`notifications.types.${nearestHazard.post.type}`)}
                        </Text>
                      </View>
                      
                      <Text style={[
                        styles.hazardReporter,
                        { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
                      ]}>
                        {interpolate('notifications.nearestHazard.reportedBy', { username: nearestHazard.post.username })}
                      </Text>
                      
                      {nearestHazard.post.verified && (
                        <View style={styles.verifiedBadge}>
                          <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                          <Text style={styles.verifiedText}>{t('notifications.nearestHazard.verified')}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ) : (
                  <View style={styles.noHazardInfo}>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={24} 
                      color="#10B981" 
                    />
                    <Text style={[
                      styles.noHazardText,
                      { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
                    ]}>
                      {t('notifications.nearestHazard.noHazards')}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Settings */}
            <View style={styles.settingsContainer}>
              {/* Range Setting */}
              <View style={[
                styles.settingCard,
                { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff' }
              ]}>
                <View style={styles.settingHeader}>
                  <Ionicons name="location" size={24} color="#3B82F6" />
                  <Text style={[
                    styles.settingTitle,
                    { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                  ]}>
                    {t('notifications.settings.detectionRange.title')}
                  </Text>
                </View>
                <Text style={[
                  styles.settingDescription,
                  { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
                ]}>
                  {t('notifications.settings.detectionRange.description')}
                </Text>
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={10}
                    value={settings.range}
                    onValueChange={updateRange}
                    step={0.5}
                    minimumTrackTintColor="#3B82F6"
                    maximumTrackTintColor={colorScheme === 'dark' ? '#374151' : '#E5E7EB'}
                  />
                  <Text style={[
                    styles.sliderValue,
                    { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                  ]}>
                    {settings.range} {t('notifications.settings.detectionRange.unit')}
                  </Text>
                </View>
              </View>

              {/* Proximity Setting */}
              <View style={[
                styles.settingCard,
                { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff' }
              ]}>
                <View style={styles.settingHeader}>
                  <Ionicons name="radio" size={24} color="#F59E0B" />
                  <Text style={[
                    styles.settingTitle,
                    { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                  ]}>
                    {t('notifications.settings.alertDistance.title')}
                  </Text>
                </View>
                <Text style={[
                  styles.settingDescription,
                  { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
                ]}>
                  {t('notifications.settings.alertDistance.description')}
                </Text>
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={5}
                    maximumValue={50}
                    value={settings.proximity}
                    onValueChange={updateProximity}
                    step={5}
                    minimumTrackTintColor="#F59E0B"
                    maximumTrackTintColor={colorScheme === 'dark' ? '#374151' : '#E5E7EB'}
                  />
                  <Text style={[
                    styles.sliderValue,
                    { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                  ]}>
                    {settings.proximity} {t('notifications.settings.alertDistance.unit')}
                  </Text>
                </View>
              </View>

              {/* Tone Setting */}
              <View style={[
                styles.settingCard,
                { 
                  backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff',
                  zIndex: 2000, // Higher zIndex for this card when dropdown is open
                }
              ]}>
                <View style={styles.settingHeader}>
                  <Ionicons name="musical-notes" size={24} color="#8B5CF6" />
                  <Text style={[
                    styles.settingTitle,
                    { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                  ]}>
                    {t('notifications.settings.notificationTone.title')}
                  </Text>
                </View>
                <Text style={[
                  styles.settingDescription,
                  { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
                ]}>
                  {t('notifications.settings.notificationTone.description')}
                </Text>
                <View style={[
                  styles.dropdownContainer,
                  { zIndex: isTonePickerOpen ? 3000 : 1000 }
                ]}>
                  <View style={styles.dropdownRow}>
                    <DropDownPicker
                      open={isTonePickerOpen}
                      value={tempTone}
                      items={NOTIFICATION_TONES}
                      setOpen={setIsTonePickerOpen}
                      setValue={setTempTone}
                      onSelectItem={(item) => updateTone(item.value || 'default')}
                      style={[
                        styles.dropdown,
                        {
                          backgroundColor: colorScheme === 'dark' ? '#374151' : '#F3F4F6',
                          borderColor: colorScheme === 'dark' ? '#4B5563' : '#D1D5DB'
                        }
                      ]}
                      textStyle={{
                        color: colorScheme === 'dark' ? '#fff' : '#1F2937',
                        fontSize: 16,
                      }}
                      dropDownContainerStyle={{
                        backgroundColor: colorScheme === 'dark' ? '#374151' : '#F3F4F6',
                        borderColor: colorScheme === 'dark' ? '#4B5563' : '#D1D5DB',
                        zIndex: 4000,
                      }}
                      listItemLabelStyle={{
                        color: colorScheme === 'dark' ? '#fff' : '#1F2937',
                      }}
                      zIndex={3000}
                      zIndexInverse={1000}
                    />
                    <TouchableOpacity
                      style={[
                        styles.testSoundButton,
                        { 
                          backgroundColor: isTestingSound 
                            ? '#3B82F6' 
                            : (colorScheme === 'dark' ? '#4B5563' : '#E5E7EB'),
                          opacity: isTestingSound ? 0.8 : 1,
                        }
                      ]}
                      onPress={testSound}
                      disabled={isTestingSound}
                    >
                      <Ionicons 
                        name="volume-high" 
                        size={18} 
                        color={isTestingSound ? '#fff' : '#3B82F6'} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Volume Slider - moved inside the tone card */}
                <View style={styles.volumeContainer}>
                  <View style={styles.volumeHeader}>
                    <Ionicons name="volume-low" size={16} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                    <Text style={[
                      styles.volumeLabel,
                      { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
                    ]}>
                      {t('notifications.settings.volume')}
                    </Text>
                    <Ionicons name="volume-high" size={16} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                  </View>
                  <Slider
                    style={styles.volumeSlider}
                    minimumValue={0}
                    maximumValue={1}
                    value={settings.volume}
                    onValueChange={updateVolume}
                    step={0.1}
                    minimumTrackTintColor="#8B5CF6"
                    maximumTrackTintColor={colorScheme === 'dark' ? '#374151' : '#E5E7EB'}
                  />
                  <Text style={[
                    styles.volumeValue,
                    { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                  ]}>
                    {Math.round(settings.volume * 100)}%
                  </Text>
                </View>
              </View>

              {/* Verified Only Setting */}
              <View style={[
                styles.settingCard,
                { 
                  backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff',
                  zIndex: 1, // Lower zIndex to avoid conflicts
                }
              ]}>
                <View style={styles.settingRow}>
                  <View style={styles.settingHeaderRow}>
                    <Ionicons name="shield-checkmark" size={24} color="#10B981" />
                    <View style={styles.settingTextContainer}>
                      <Text style={[
                        styles.settingTitle,
                        { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                      ]}>
                        {t('notifications.settings.verifiedOnly.title')}
                      </Text>
                      <Text style={[
                        styles.settingDescription,
                        { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
                      ]}>
                        {t('notifications.settings.verifiedOnly.description')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.switchContainer}>
                    <Switch
                      value={settings.verified}
                      onValueChange={updateVerified}
                      trackColor={{ false: colorScheme === 'dark' ? '#374151' : '#E5E7EB', true: '#10B981' }}
                      thumbColor={settings.verified ? '#fff' : '#f4f3f4'}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Status Information */}
            {settings.isActive && (
              <View style={[
                styles.statusCard,
                { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff' }
              ]}>
                <Text style={[
                  styles.statusTitle,
                  { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                ]}>
                  {t('notifications.status.title')}
                </Text>
                <View style={styles.statusItem}>
                  <Text style={[
                    styles.statusLabel,
                    { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
                  ]}>
                    {t('notifications.status.location')}
                  </Text>
                  <Text style={[
                    styles.statusValue,
                    { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                  ]}>
                    {userLocation ? t('notifications.status.locationActive') : t('notifications.status.locationGetting')}
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  <Text style={[
                    styles.statusLabel,
                    { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
                  ]}>
                    {t('notifications.status.nearbyIssues')}
                  </Text>
                  <Text style={[
                    styles.statusValue,
                    { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                  ]}>
                    {interpolate('notifications.status.issuesFound', { count: posts.length })}
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  <Text style={[
                    styles.statusLabel,
                    { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
                  ]}>
                    {t('notifications.status.alertsTriggered')}
                  </Text>
                  <Text style={[
                    styles.statusValue,
                    { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                  ]}>
                    {notifiedPosts.size}
                  </Text>
                </View>
                
                {/* Test Notification Button */}
                <TouchableOpacity
                  style={[
                    styles.testNotificationButton,
                    { backgroundColor: colorScheme === 'dark' ? '#3B82F6' : '#2563EB' }
                  ]}
                  onPress={testNotification}
                  activeOpacity={0.8}
                >
                  <Ionicons name="notifications" size={20} color="#fff" />
                  <Text style={styles.testNotificationText}>
                    {t('notifications.status.testNotification')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  toggleContainer: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleButton: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  toggleContent: {
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingsContainer: {
    gap: 16,
    marginBottom: 24,
    zIndex: 1,
  },
  settingCard: {
    borderRadius: 16,
    padding: 20,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  settingDescription: {
    fontSize: 14,
    marginBottom: 16,
    marginLeft: 36,
  },
  sliderContainer: {
    marginLeft: 36,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  dropdownContainer: {
    marginLeft: 36,
    marginRight: 24,
    marginBottom: 10,
    zIndex: 1000,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dropdown: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 50,
    maxHeight: 50,
    minWidth: 0,
    marginRight: 2,
  },
  testSoundButton: {
    width: 40,
    height: 40,
    padding: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 16,
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  volumeContainer: {
    marginLeft: 36,
    marginRight: 24,
    marginTop: 16,
    marginBottom: 10,
  },
  volumeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  volumeLabel: {
    fontSize: 16,
  },
  volumeSlider: {
    width: '100%',
    height: 40,
  },
  volumeValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  notificationOverlay: {
    position: 'absolute',
    top: 60, // Position below status bar
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  notificationBox: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  notificationSubtitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  notificationDetails: {
    fontSize: 14,
    marginBottom: 8,
  },
  notificationDescription: {
    fontSize: 14,
  },
  closeButton: {
    padding: 16,
  },
  testNotificationButton: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  testNotificationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  nearestHazardContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nearestHazardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  nearestHazardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  hazardInfo: {
    flexDirection: 'column',
    gap: 12,
  },
  hazardDistance: {
    alignItems: 'center',
  },
  distanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  distanceLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  hazardDetails: {
    gap: 8,
  },
  hazardType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  hazardTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hazardTypeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  hazardReporter: {
    fontSize: 14,
    marginLeft: 44, // Align with type name
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 44, // Align with type name
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  noHazardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  noHazardText: {
    fontSize: 16,
    fontWeight: '500',
  },
});