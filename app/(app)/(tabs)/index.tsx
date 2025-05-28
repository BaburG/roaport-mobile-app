import React, { useContext, useEffect, useState } from 'react';
import { Image, StyleSheet, FlatList, Text, View, Alert, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BlurView } from 'expo-blur';
import { LanguageContext } from '@/src/context/LanguageContext';
import { useAuth } from '@/src/context/AuthContext';


type Score = {
  username: string;
  total: number;
};

const HEADER_HEIGHT = 250;
const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { isAuthenticated, user, logout } = useAuth();
  const colorScheme = useColorScheme();
  const [scores, setScores] = useState<Score[]>([]);
  const [username, setUsername] = useState<string>('');
  const { t } = useContext(LanguageContext);
  

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

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Image
        source={require('@/assets/images/partial-react-logo.png')}
        style={styles.reactLogo}
      />
      <BlurView intensity={80} style={styles.welcomeOverlay}>
        <Text style={styles.welcomeText}>{t('welcomeBack')}</Text>
        <Text style={styles.usernameText}>{username}!</Text>
      </BlurView>
    </View>
  );

  const renderItem = ({ item, index }: { item: Score; index: number }) => (
    <View style={[
      styles.listItem,
      { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff' }
    ]}>
      {/* Medal for top 3 */}
      <View style={[styles.rankContainer, index < 3 && styles.topThree]}>
        {index < 3 ? (
          <Text style={styles.medalEmoji}>
            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
          </Text>
        ) : (
          <Text style={[
            styles.rankText,
            { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
          ]}>
            #{index + 1}
          </Text>
        )}
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
          {item.total.toLocaleString()} pts
        </Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={scores}
      keyExtractor={(item, index) => `${item.username}-${index}`}
      renderItem={renderItem}
      ListHeaderComponent={
        <>
          {renderHeader()}
          <View style={styles.scoreboardTitleContainer}>
            <Text style={[
              styles.scoreboardTitle,
              { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
            ]}>
              {t('topPlayers')}
            </Text>
          </View>
        </>
      }
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      style={styles.flatList}
    />
  );
}

const styles = StyleSheet.create({
  flatList: {
    flex: 1,
    width: '100%',
  },
  headerContainer: {
    height: HEADER_HEIGHT,
    backgroundColor: '#2563EB',
    position: 'relative',
    width: '100%',
  },
  reactLogo: {
    height: 300,
    width: 500,
    bottom: 0,
    left: 0,
    position: 'absolute',
    opacity: 0.9,
  },
  welcomeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#fff',
    opacity: 0.9,
  },
  usernameText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  scoreboardTitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    width: '100%',
  },
  scoreboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 24,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 16,
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
    width: 32,
    alignItems: 'center',
  },
  topThree: {
    width: 36,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medalEmoji: {
    fontSize: 20,
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
