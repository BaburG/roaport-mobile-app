import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, FlatList, Text, TextInput, Button, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ParallaxScrollView from "@/components/ParallaxScrollView";

type Score = {
  username: string;
  total: number;
};

export default function HomeScreen() {
  const [scores, setScores] = useState<Score[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [isPromptVisible, setIsPromptVisible] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');

  // Kullanıcı adını kontrol edip, prompt gösterir.
  useEffect(() => {
    const checkUsername = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      if (!storedUsername) {
        setIsPromptVisible(true);
      } else {
        setUsername(storedUsername);
      }
    };
    checkUsername();
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

  // Yeni kullanıcı adını kaydeder
  const handleSaveUsername = async () => {
    if (newUsername.trim().length > 0) {
      await AsyncStorage.setItem('username', newUsername);
      setUsername(newUsername);
      setIsPromptVisible(false);
    } else {
      Alert.alert('Uyarı', 'Lütfen geçerli bir kullanıcı adı girin.');
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }
    >
      {/* Kullanıcı adını girmek için prompt */}
      {isPromptVisible && (
        <View style={styles.promptContainer}>
          <Text style={styles.promptText}>Lütfen kullanıcı adınızı girin:</Text>
          <TextInput
            style={styles.input}
            placeholder="Kullanıcı Adı"
            value={newUsername}
            onChangeText={setNewUsername}
          />
          <Button title="Kaydet" onPress={handleSaveUsername} />
        </View>
      )}

      {/* Skor Listesi */}
      <FlatList
        data={scores}
        keyExtractor={(item, index) => `${item.username}-${index}`}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.score}>{item.total}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
      />
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  promptContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
  },
  promptText: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  score: {
    fontSize: 16,
    color: '#555',
  },
});
