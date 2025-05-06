import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRegister } from '@/src/services/auth/registerService';

export default function RegisterScreen() {
    const colorScheme = useColorScheme();
    const router = useRouter();
    const { handleRegister } = useRegister();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const onRegisterPress = async () => {
        if (!firstName || !lastName || !email || !phoneNumber || !password) {
            alert('Please fill in all fields.');
            return;
        }

        setLoading(true);
        await handleRegister(firstName, lastName, email, phoneNumber, password);
        setLoading(false);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.replace('/')}>
                        <Feather name="x" size={28} color="#1F2937" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.title}>Register</Text>

                <TextInput
                    style={styles.input}
                    placeholder="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity
                    style={[styles.button, loading && { backgroundColor: '#9CA3AF' }]}
                    onPress={onRegisterPress}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>{loading ? 'Registering...' : 'Register'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.replace('/login')}>
                    <Text style={styles.switchText}>Already have an account? Login</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9fafb' },
    container: { flex: 1, padding: 20, justifyContent: 'center' },
    header: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
    },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    button: {
        backgroundColor: '#2563EB',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    switchText: { textAlign: 'center', color: '#2563EB', marginTop: 12 },
});
