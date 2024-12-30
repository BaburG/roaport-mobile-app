import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, FlatList, Text, TextInput, Button, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { useColorScheme } from '@/hooks/useColorScheme';

type Score = {
  username: string;
  total: number;
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [scores, setScores] = useState<Score[]>([]);
  const [username, setUsername] = useState<string>('');

  // Load username on mount
  useEffect(() => {
    const loadUsername = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        if (storedUsername) {
          setUsername(storedUsername);
        }
      } catch (error) {
        console.error('Error loading username:', error);
      }
    };
    loadUsername();
  }, []);

  // API'den veriyi çeker
  useEffect(() => {
    const fetchScores = async () => {
      try {
        const response = await fetch('https://roaport-website.vercel.app/api/scoreboard');
        const data = await response.json();
        setScores(data);
      } catch (error) {
        console.error('Veri çekilirken hata oluştu:', error);
        Alert.alert('Hata', 'Skor tablosu yüklenirken bir hata oluştu.');
      }
    };
    fetchScores();
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#2563EB', dark: '#1E40AF' }}
      headerImage={
        <View style={styles.headerContainer}>
          <Image
            source={require('@/assets/images/partial-react-logo.png')}
            style={styles.reactLogo}
          />
          <View style={styles.welcomeOverlay}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.usernameText}>{username}!</Text>
          </View>
        </View>
      }
    >
      <View style={styles.scoreboardContainer}>
        <Text style={[styles.scoreboardTitle, { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }]}>
          Leaderboard
        </Text>
        <FlatList
          data={scores}
          keyExtractor={(item, index) => `${item.username}-${index}`}
          renderItem={({ item, index }) => (
            <View style={[
              styles.listItem,
              { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff' }
            ]}>
              <View style={styles.rankContainer}>
                <Text style={[
                  styles.rankText,
                  { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
                ]}>
                  #{index + 1}
                </Text>
              </View>
              <View style={styles.userInfoContainer}>
                <Text style={[
                  styles.username,
                  { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                ]}>
                  {item.username}
                </Text>
              </View>
              <View style={styles.scoreContainer}>
                <Text style={[
                  styles.score,
                  { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
                ]}>
                  {item.total} points
                </Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
    opacity: 0.9,
  },
  welcomeOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'left',
    color: '#fff',
    opacity: 0.9,
  },
  usernameText: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'left',
    color: '#fff',
    marginTop: 4,
  },
  scoreboardContainer: {
    flex: 1,
    paddingTop: 24,
  },
  scoreboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  rankContainer: {
    width: 40,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
  },
  userInfoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  scoreContainer: {
    marginLeft: 'auto',
    paddingLeft: 12,
  },
  score: {
    fontSize: 16,
    fontWeight: '500',
  },
});
