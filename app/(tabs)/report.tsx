import { CameraView, CameraType, useCameraPermissions, Camera } from 'expo-camera';
import { useRef, useState } from 'react';
import { ActivityIndicator, Button, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
    const [facing, setFacing] = useState<CameraType>('back');
    const [uploading, setUploading] = useState<boolean>(false);
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const insets = useSafeAreaInsets();
    const [selectedType, setSelectedType] = useState<string>('default'); // Varsayılan tip
    const [isTypeModalVisible, setIsTypeModalVisible] = useState<boolean>(false);

    const types = ['Pothole', 'Sign', 'Sidewalk', 'None']; // Örnek tipler


    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="Grant Permission" />
            </SafeAreaView>
        );
    }

    const toggleCameraFacing = () => {
        setFacing((current) => (current === 'back' ? 'front' : 'back'));
    };

    const takePicture = async () => {
        if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync();
            setPhotoUri(photo.uri);
            console.log('Photo captured:', photo.uri);

            // Tip seçimi modalını göster
            setIsTypeModalVisible(true);
        }
    };

    const uploadPhoto = async () => {
        setUploading(true);
        if (!photoUri) {
            console.error('No photo available for upload.');
            return;
        }

        try {
            const storedUsername = await AsyncStorage.getItem('username'); // Kullanıcı adını al
            if (!storedUsername) {
                console.error('No username found in storage.');
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'No username found. Please set your username first.',
                });
                return;
            }

            const formData = new FormData();

            formData.append('file', {
                uri: photoUri,
                name: 'photo.jpg',
                type: 'image/jpeg',
            });
            formData.append('username', storedUsername);
            formData.append('name', storedUsername);
            formData.append('description', 'string');
            formData.append('type', selectedType); // Tip seçimini ekle
            formData.append('location', 'string'); // Replace with actual location if applicable
            const response = await fetch('https://roaport-upload-backend.thankfulpond-dc02f385.italynorth.azurecontainerapps.io/upload/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            if (response.ok) {
                console.log('Photo uploaded successfully!');
                setPhotoUri("");
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Photo uploaded successfully!',
                });
            } else {
                console.error('Failed to upload photo:', await response.text());
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to upload photo.',
                });
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to upload photo.',
            });
        } finally {
            setUploading(false);
        }

    };

    return (
        <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
            <Modal
                transparent={true}
                animationType="slide"
                visible={isTypeModalVisible}
                onRequestClose={() => setIsTypeModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Select Type</Text>
                    {types.map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={styles.typeButton}
                            onPress={() => {
                                setSelectedType(type); // Tipi ayarla
                                setIsTypeModalVisible(false); // Modalı kapat
                            }}
                        >
                            <Text style={styles.typeButtonText}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Modal>


            {photoUri ? (

                <View style={styles.previewContainer}>
                    <Image source={{ uri: photoUri }} style={styles.preview} />
                    <View style={styles.actionsContainer}>
                        {/* Retake Button */}
                        <TouchableOpacity
                            style={[styles.button, uploading && styles.disabledButton]}
                            onPress={() => setPhotoUri(null)}
                            disabled={uploading}
                        >
                            <Text style={[styles.buttonText, uploading && styles.disabledText]}>Retake Photo</Text>
                        </TouchableOpacity>

                        {/* Upload Button */}
                        <TouchableOpacity
                            style={[styles.button, uploading && styles.disabledButton]}
                            onPress={uploadPhoto}
                            disabled={uploading}
                        >
                            {uploading && <ActivityIndicator size="small" color="#ffffff" style={styles.spinnerInsideButton} />}
                            <Text style={[styles.buttonText, styles.uploadText]}>Upload Photo</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
                    <View style={[styles.buttonContainer, { marginTop: insets.top }]}>
                        <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                            <Ionicons name="camera-reverse-outline" size={36} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
                        <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
                            <Ionicons name="camera" size={36} color="#000000" />
                        </TouchableOpacity>
                    </View>
                </CameraView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
    },
    camera: {
        flex: 1,
    },
    buttonContainer: {
        flexDirection: 'row',
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
        marginTop: 60,
        marginRight: 20,
    },
    button: {
        backgroundColor: '#007BFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        flexDirection: 'row',
        alignItems: 'center', // Align items horizontally
    },
    disabledButton: {
        backgroundColor: '#CCCCCC',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledText: {
        color: '#666666',
    },
    previewContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    preview: {
        width: '80%',
        height: '50%',
        marginBottom: 20,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '80%',
    },
    spinnerInsideButton: {
        marginRight: 10, // Space between spinner and text
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 100,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    spinner: {
        marginRight: 10,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#fff',
    },
    typeButton: {
        padding: 10,
        marginVertical: 5,
        backgroundColor: '#007BFF',
        borderRadius: 5,
        width: 200,
        alignItems: 'center',
    },
    typeButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});
