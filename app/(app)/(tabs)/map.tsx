import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Dimensions, ScrollView, Image, Animated } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const REPORT_TYPES = {
  pothole: { icon: 'alert-circle', color: '#EF4444' },
  sign: { icon: 'warning', color: '#F59E0B' },
  sidewalk: { icon: 'walk', color: '#10B981' },
  none: { icon: 'help-circle', color: '#6B7280' },
};

interface Post {
  id: string;
  name: string;
  imageUrl: string;
  longitude: number;
  latitude: number;
  dateCreated: string;
  type: keyof typeof REPORT_TYPES;
  description: string;
  username: string;
  verified: string;
}

interface Cluster {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  count: number;
  pins: Post[];
}

const MapScreen = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [pins, setPins] = useState<Post[]>([]);
  const [selectedPin, setSelectedPin] = useState<Post | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const scaleAnim = useMemo(() => new Animated.Value(1), []);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<keyof typeof REPORT_TYPES>>(new Set(Object.keys(REPORT_TYPES) as Array<keyof typeof REPORT_TYPES>));
  const [tempSelectedTypes, setTempSelectedTypes] = useState<Set<keyof typeof REPORT_TYPES>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission denied',
          text2: 'Location permission is required',
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      try {
        const response = await fetch(`${API_URL}/posts?lat=${location.coords.latitude}&lon=${location.coords.longitude}&verified=true&maxDistance=150`);
        const data = await response.json();
        setPins(data);
        updateClusters(data, mapRegion);
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch reports',
        });
      }
    })();
  }, []);

  useEffect(() => {
    if (isFilterModalVisible) {
      setTempSelectedTypes(new Set(selectedTypes));
    }
  }, [isFilterModalVisible]);

  const toggleTypeFilter = (type: keyof typeof REPORT_TYPES) => {
    const newSelectedTypes = new Set(tempSelectedTypes);
    if (newSelectedTypes.has(type)) {
      newSelectedTypes.delete(type);
    } else {
      newSelectedTypes.add(type);
    }
    setTempSelectedTypes(newSelectedTypes);
  };

  const applyFilters = () => {
    setSelectedTypes(tempSelectedTypes);
    setIsFilterModalVisible(false);
  };

  const filteredPins = useMemo(() => {
    return pins.filter(pin => selectedTypes.has(pin.type));
  }, [pins, selectedTypes]);

  const updateClusters = (pins: Post[], region: Region) => {
    const gridSize = Math.pow(2, Math.floor(Math.log2(360 / region.latitudeDelta)));
    const clusters: { [key: string]: Cluster } = {};

    pins.forEach((pin) => {
      if (!selectedTypes.has(pin.type)) return;
      
      const gridX = Math.floor((pin.longitude + 180) * gridSize / 360);
      const gridY = Math.floor((pin.latitude + 90) * gridSize / 180);
      const key = `${gridX},${gridY}`;

      if (!clusters[key]) {
        clusters[key] = {
          id: key,
          coordinate: {
            latitude: pin.latitude,
            longitude: pin.longitude,
          },
          count: 0,
          pins: [],
        };
      }

      clusters[key].pins.push(pin);
      clusters[key].count++;
      clusters[key].coordinate = {
        latitude: clusters[key].pins.reduce((sum, p) => sum + p.latitude, 0) / clusters[key].pins.length,
        longitude: clusters[key].pins.reduce((sum, p) => sum + p.longitude, 0) / clusters[key].pins.length,
      };
    });

    setClusters(Object.values(clusters));
  };

  const handleRegionChangeComplete = (region: Region) => {
    setMapRegion(region);
    updateClusters(pins, region);
  };

  const handleClusterPress = (cluster: Cluster) => {
    if (cluster.count === 1) {
      setSelectedPin(cluster.pins[0]);
    } else {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Zoom to cluster
      const newRegion = {
        latitude: cluster.coordinate.latitude,
        longitude: cluster.coordinate.longitude,
        latitudeDelta: mapRegion.latitudeDelta / 2,
        longitudeDelta: mapRegion.longitudeDelta / 2,
      };
      setMapRegion(newRegion);
      setSelectedCluster(cluster);
    }
  };

  const getClusterColor = (count: number) => {
    if (count > 50) return '#EF4444';
    if (count > 20) return '#F59E0B';
    if (count > 10) return '#10B981';
    return '#3B82F6';
  };

  const getClusterSize = (count: number) => {
    if (count > 50) return 48;
    if (count > 20) return 40;
    if (count > 10) return 36;
    return 32;
  };

  useEffect(() => {
    updateClusters(pins, mapRegion);
  }, [selectedTypes]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        region={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={true}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {clusters.map((cluster) => (
          <Marker
            key={cluster.id}
            coordinate={cluster.coordinate}
            onPress={() => handleClusterPress(cluster)}
          >
            <Animated.View
              style={[
                styles.markerContainer,
                cluster.count > 1 ? [
                  styles.clusterContainer,
                  {
                    backgroundColor: getClusterColor(cluster.count),
                    width: getClusterSize(cluster.count),
                    height: getClusterSize(cluster.count),
                    transform: [{ scale: scaleAnim }],
                  }
                ] : { backgroundColor: REPORT_TYPES[cluster.pins[0].type]?.color || REPORT_TYPES.none.color }
              ]}
            >
              {cluster.count > 1 ? (
                <View style={styles.clusterContent}>
                  <Text style={styles.clusterText}>{cluster.count}</Text>
                  <Ionicons name="location" size={12} color="#fff" style={styles.clusterIcon} />
                </View>
              ) : (
                <Ionicons
                  name={REPORT_TYPES[cluster.pins[0].type]?.icon as any || REPORT_TYPES.none.icon}
                  size={20}
                  color="#fff"
                />
              )}
            </Animated.View>
          </Marker>
        ))}
      </MapView>

      {/* Filter Button */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setIsFilterModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.filterButtonInner}>
          <Ionicons name="filter" size={24} color="#fff" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={!!selectedPin}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedPin(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff' }
          ]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedPin(null)}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={colorScheme === 'dark' ? '#fff' : '#1F2937'}
                />
              </TouchableOpacity>
              <Text style={[
                styles.modalTitle,
                { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
              ]}>
                Report Details
              </Text>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedPin && (
                <>
                  <View style={styles.reportTypeContainer}>
                    <View style={[
                      styles.reportTypeIcon,
                      { backgroundColor: REPORT_TYPES[selectedPin.type]?.color || REPORT_TYPES.none.color }
                    ]}>
                      <Ionicons
                        name={REPORT_TYPES[selectedPin.type]?.icon as any || REPORT_TYPES.none.icon}
                        size={24}
                        color="#fff"
                      />
                    </View>
                    <Text style={[
                      styles.reportType,
                      { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                    ]}>
                      {selectedPin.type}
                    </Text>
                  </View>

                  {selectedPin.imageUrl && (
                    <TouchableOpacity
                      activeOpacity={.8}
                      style={styles.imageContainer}
                      onPress={() => setIsImageModalVisible(true)}
                    >
                      <Image
                        source={{ uri: selectedPin.imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  )}

                  <View style={styles.detailSection}>
                    <Text style={[
                      styles.detailLabel,
                      { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
                    ]}>
                      Description
                    </Text>
                    <Text style={[
                      styles.detailText,
                      { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                    ]}>
                      {selectedPin.description}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={[
                      styles.detailLabel,
                      { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
                    ]}>
                      Date Reported
                    </Text>
                    <Text style={[
                      styles.detailText,
                      { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                    ]}>
                      {new Date(selectedPin.dateCreated).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={[
                      styles.detailLabel,
                      { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
                    ]}>
                      Location
                    </Text>
                    <Text style={[
                      styles.detailText,
                      { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                    ]}>
                      {selectedPin.latitude.toFixed(6)}, {selectedPin.longitude.toFixed(6)}
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsImageModalVisible(false)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalCloseButton}
            onPress={() => setIsImageModalVisible(false)}
          >
            <Ionicons
              name="close"
              size={32}
              color="#fff"
            />
          </TouchableOpacity>
          {selectedPin?.imageUrl && (
            <Image
              source={{ uri: selectedPin.imageUrl }}
              style={styles.zoomedImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Cluster Info Toast */}
      {selectedCluster && selectedCluster.count > 1 && (
        <View style={styles.clusterInfo}>
          <Text style={styles.clusterInfoText}>
            {selectedCluster.count} reports in this area
          </Text>
          <TouchableOpacity
            style={styles.clusterInfoClose}
            onPress={() => setSelectedCluster(null)}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.filterModalContent,
            { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff' }
          ]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsFilterModalVisible(false)}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={colorScheme === 'dark' ? '#fff' : '#1F2937'}
                />
              </TouchableOpacity>
              <Text style={[
                styles.modalTitle,
                { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
              ]}>
                Filter Reports
              </Text>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterModalBody}>
              {Object.entries(REPORT_TYPES).map(([type, { icon, color }]) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterItem,
                    tempSelectedTypes.has(type as keyof typeof REPORT_TYPES) && styles.filterItemSelected,
                    { borderColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB' }
                  ]}
                  onPress={() => toggleTypeFilter(type as keyof typeof REPORT_TYPES)}
                >
                  <View style={[styles.filterItemIcon, { backgroundColor: color }]}>
                    <Ionicons name={icon as any} size={20} color="#fff" />
                  </View>
                  <Text style={[
                    styles.filterItemText,
                    { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                  {tempSelectedTypes.has(type as keyof typeof REPORT_TYPES) && (
                    <Ionicons name="checkmark-circle" size={24} color={color} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerContainer: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '95%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 16,
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  reportTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  reportTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportType: {
    fontSize: 24,
    fontWeight: '600',
  },
  imageContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, .7)',
    borderRadius: 25,
  },
  zoomedImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
  },
  clusterContainer: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clusterContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  clusterIcon: {
    opacity: 0.8,
  },
  clusterInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clusterInfoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  clusterInfoClose: {
    padding: 4,
  },
  filterButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalContent: {
    height: '50%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  filterModalBody: {
    flex: 1,
    padding: 16,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  filterItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  filterItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  filterItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 