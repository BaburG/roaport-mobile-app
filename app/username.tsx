import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function UsernamePage() {
    const [username, setUsername] = useState('');
    const router = useRouter();

    const handleSave = async () => {
        if (username.trim().length === 0) {
            Alert.alert('Error', 'Username cannot be empty.');
            return;
        }

        try {
            await AsyncStorage.setItem('username', username);
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Error saving username:', error);
            Alert.alert('Error', 'Failed to save username.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to the Roaport alpha</Text>
            <Text style={styles.subtitle}>Please enter a username to continue</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter username"
                value={username}
                onChangeText={setUsername}
            />
            <Button title="Save Username" onPress={handleSave} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f9f9f9',
    },
    title: {
        fontSize: 24,
        marginBottom: 8,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 16,
        color: '#555',
    },
    input: {
        width: '100%',
        padding: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
});
