import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState, useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SuccessAnimation } from '@/components/SuccessAnimation';
import * as Location from 'expo-location';

const REPORT_TYPES = [
  { id: 'Pothole', label: 'Pothole', description: 'Report damaged road surface' },
  { id: 'Sign', label: 'Traffic Sign', description: 'Report issues with traffic signs' },
  { id: 'Sidewalk', label: 'Sidewalk', description: 'Report sidewalk problems' },
  { id: 'None', label: 'Other', description: 'Report other road issues' },
];

export default function ReportScreen() {
  const [uploading, setUploading] = useState<boolean>(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isClosingForm, setIsClosingForm] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission denied',
          text2: 'Location permission is required',
        });
      }
    })();
  }, []);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to use the camera</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const location = await Location.getCurrentPositionAsync({});
        console.log('Location:', {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        
        setLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });

        const photo = await cameraRef.current.takePictureAsync();
        setPhotoUri(photo.uri);
      } catch (error) {
        console.error('Error taking picture or getting location:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to capture location',
        });
      }
    }
  };

  const handleBack = () => {
    setPhotoUri(null);
    setSelectedType('');
    setDescription('');
    setShowSuccessModal(false);
  };

  const handleSuccessAnimationComplete = () => {
    console.log('Animation complete callback received');
    setShowSuccessModal(false);
    setPhotoUri(null);
    setSelectedType('');
    setDescription('');
  };

  const uploadPhoto = async () => {
    if (!selectedType) {
      Toast.show({
        type: 'error',
        text1: 'Missing Report Type',
        text2: 'Please select what type of issue you want to report',
        position: 'bottom',
        visibilityTime: 3000,
      });
      return;
    }

    setUploading(true);

    try {
      const storedUsername = await AsyncStorage.getItem('username');
      if (!storedUsername) {
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
      } as any);

      formData.append('username', storedUsername);
      formData.append('name', storedUsername);
      formData.append('description', description || 'No description provided');
      formData.append('type', selectedType);

      if (location) {
        formData.append('location', JSON.stringify(location));
      }

      console.log('Form data:', formData);

      const response = await fetch('https://roaport-upload-backend.thankfulpond-dc02f385.italynorth.azurecontainerapps.io/upload/', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response.ok) {
        console.log('Upload successful, showing animation');
        setPhotoUri(null);
        setTimeout(() => {
          setShowSuccessModal(true);
        }, 300);
      } else {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to submit report.',
        });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to submit report.',
      });
    } finally {
      setUploading(false);
    }
  };

  const renderTypeButtons = () => (
    <View style={styles.typeContainer}>
      {REPORT_TYPES.map((type) => (
        <TouchableOpacity
          key={type.id}
          style={[
            styles.typeButton,
            { backgroundColor: colorScheme === 'dark' ? '#374151' : '#F3F4F6' },
            selectedType === type.id && styles.selectedTypeButton
          ]}
          onPress={() => setSelectedType(type.id)}
        >
          <View style={styles.typeContent}>
            <Text style={[
              styles.typeButtonLabel,
              { color: colorScheme === 'dark' ? '#fff' : '#1F2937' },
              selectedType === type.id && styles.selectedTypeButtonText
            ]}>
              {type.label}
            </Text>
            <Text style={[
              styles.typeButtonDescription,
              { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' },
              selectedType === type.id && styles.selectedTypeDescriptionText
            ]}>
              {type.description}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.cameraContainer}>
          <CameraView 
            style={styles.camera} 
            ref={cameraRef}
            facing="back"
          >
            <View style={styles.captureContainer}>
              <TouchableOpacity
                onPress={takePicture}
                style={styles.captureButton}
              >
                <View style={styles.captureInner} />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>

        <Modal
          visible={!!photoUri && !isClosingForm}
          animationType="slide"
          transparent={true}
          onRequestClose={handleBack}
        >
          <View style={styles.modalContainer}>
            <View style={[
              styles.formContainer,
              { 
                backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff',
                paddingTop: insets.top,
              }
            ]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBack}
                >
                  <Ionicons 
                    name="chevron-back" 
                    size={28} 
                    color={colorScheme === 'dark' ? '#fff' : '#1F2937'}
                  />
                  <Text style={[
                    styles.backButtonText,
                    { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                  ]}>
                    Back
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {photoUri ? (
                  <Image 
                    source={{ uri: photoUri }} 
                    style={styles.preview}
                  />
                ) : null}

                <View style={styles.formContent}>
                  <Text style={[
                    styles.sectionTitle,
                    { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                  ]}>
                    What do you want to report?
                  </Text>
                  
                  {renderTypeButtons()}

                  <Text style={[
                    styles.sectionTitle,
                    { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                  ]}>
                    Additional Details (Optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.descriptionInput,
                      { 
                        backgroundColor: colorScheme === 'dark' ? '#374151' : '#F3F4F6',
                        color: colorScheme === 'dark' ? '#fff' : '#1F2937'
                      }
                    ]}
                    placeholder="Describe the issue in more detail..."
                    placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.retakeButton]}
                      onPress={() => setPhotoUri(null)}
                      disabled={uploading}
                    >
                      <Ionicons name="camera-reverse" size={24} color="#fff" />
                      <Text style={styles.actionButtonText}>Retake</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.uploadButton]}
                      onPress={uploadPhoto}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <ActivityIndicator color="#fff" style={styles.uploadSpinner} />
                      ) : (
                        <Ionicons name="cloud-upload" size={24} color="#fff" />
                      )}
                      <Text style={styles.actionButtonText}>
                        {uploading ? 'Submitting...' : 'Submit Report'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>

      {showSuccessModal && (
        <View style={[
          StyleSheet.absoluteFill,
          styles.successModalContainer,
        ]}>
          <View style={styles.successModalContent}>
            <SuccessAnimation 
              message="Report submitted successfully!"
              onAnimationComplete={handleSuccessAnimationComplete}
            />
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    marginBottom: 80,
  },
  camera: {
    flex: 1,
  },
  captureContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  reviewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  preview: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  formContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  typeContainer: {
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedTypeButton: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  typeContent: {
    padding: 16,
  },
  typeButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  typeButtonDescription: {
    fontSize: 14,
  },
  selectedTypeButtonText: {
    color: '#fff',
  },
  selectedTypeDescriptionText: {
    color: '#E5E7EB',
  },
  descriptionInput: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  retakeButton: {
    backgroundColor: '#4B5563',
  },
  uploadButton: {
    backgroundColor: '#2563EB',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadSpinner: {
    marginRight: 8,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f3f4f6',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#374151',
  },
  permissionButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  formContent: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  successModalContainer: {
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  successModalContent: {
    padding: 32,
    alignItems: 'center',
    width: '100%',
  },
});
