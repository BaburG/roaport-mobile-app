import { CameraView, CameraType, useCameraPermissions, Camera } from 'expo-camera';
import { useRef, useState } from 'react';
import { Button, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setPhotoUri(photo.uri);
      console.log('Photo captured:', photo.uri);
    }
  };

  const uploadPhoto = async () => {
    if (!photoUri) {
      console.error('No photo available for upload.');
      return;
    }
  
    try {
      const formData = new FormData();
  
      // Attach the file
      formData.append('file', {
        uri: photoUri,
        name: 'photo.jpg', // Adjust as necessary
        type: 'image/jpeg', // Adjust based on your image type
      });
  
      // Add other required fields
      formData.append('hash', 'string'); // Replace 'string' with actual hash value if applicable
      formData.append('location', 'string'); // Replace with actual location if applicable
      formData.append('name', 'string'); // Replace with actual name if applicable
  
      const response = await fetch('http://192.168.1.89:8000/upload/', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
  
      if (response.ok) {
        console.log('Photo uploaded successfully!');
        const data = await response.json();
        console.log('Response:', data);
      } else {
        console.error('Failed to upload photo:', await response.text());
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };
  

  return (
    <View style={styles.container}>
      {photoUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photoUri }} style={styles.preview} />
          <View style={{ display: 'flex', justifyContent: 'space-around', gap: 20, }}>
            <Button title="Retake Photo" onPress={() => setPhotoUri(null)} />
            <Button title="Upload Photo" onPress={uploadPhoto} />
          </View>
        </View>
      ) : (
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse-outline" size={36} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <View style={styles.bottomBar}>
            <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
              <Ionicons name="camera" size={36} color="#000000" />
            </TouchableOpacity>
          </View>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    justifyContent: "flex-end",
    marginTop: 60,
    marginRight: 20,
  },
  button: {
  },
  bottomBar: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    height: 80,
    backgroundColor: 'transparent', // Semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35, // Makes the button circular
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
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
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});
