import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, ColorSchemeName, Modal, Dimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const REPORT_TYPES = {
  pothole: { icon: 'alert-circle', color: '#EF4444' },
  sign: { icon: 'warning', color: '#F59E0B' },
  sidewalk: { icon: 'walk', color: '#10B981' },
  none: { icon: 'help-circle', color: '#6B7280' },
};

const STATUS_TYPES = {
  PENDING: { icon: 'time', color: '#F59E0B', label: 'Pending' },
  REJECTED: { icon: 'close-circle', color: '#EF4444', label: 'Rejected' },
  PROVISION: { icon: 'construct', color: '#3B82F6', label: 'In Progress' },
  FIXED: { icon: 'checkmark-circle', color: '#10B981', label: 'Fixed' },
};

interface Report {
  id: string;
  name: string;
  imageUrl: string;
  longitude: number;
  latitude: number;
  dateCreated: string;
  type: keyof typeof REPORT_TYPES;
  description: string;
  verified: string;
  status: keyof typeof STATUS_TYPES;
}

const ITEMS_PER_PAGE = 15;

const EmptyComponent = ({ colorScheme }: { colorScheme: ColorSchemeName }) => (
  <View style={styles.emptyContainer}>
    <Ionicons
      name="document-text-outline"
      size={48}
      color={colorScheme === 'dark' ? '#4B5563' : '#9CA3AF'}
    />
    <Text style={[
      styles.emptyText,
      { color: colorScheme === 'dark' ? '#4B5563' : '#9CA3AF' }
    ]}>
      No reports yet
    </Text>
  </View>
);

const LoadingComponent = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#3B82F6" />
  </View>
);

export default function MyReportsScreen() {
  const { isAuthenticated, user, accessToken } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedType, setSelectedType] = useState<keyof typeof REPORT_TYPES | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<keyof typeof STATUS_TYPES | 'all'>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  const fetchReports = async (pageNum: number, shouldRefresh = false) => {
    try {
      if (!user?.id || !accessToken) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Authentication information not available',
        });
        return;
      }

      const response = await fetch(
        `${API_URL}/posts/user/${user.id}?page=${pageNum}&limit=${ITEMS_PER_PAGE}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      if (shouldRefresh) {
        setReports(data);
      } else {
        setReports(prev => [...prev, ...data]);
      }
      
      setHasMore(data.length === ITEMS_PER_PAGE);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch reports',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports(1, true);
  }, []);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchReports(page + 1);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchReports(1, true);
  };

  const filteredReports = reports.filter(report => {
    const typeMatch = selectedType === 'all' || report.type === selectedType;
    const statusMatch = selectedStatus === 'all' || report.status === selectedStatus;
    return typeMatch && statusMatch;
  });

  const renderReportItem = ({ item }: { item: Report }) => (
    <TouchableOpacity
      activeOpacity={.7}
      style={[
        styles.reportItem,
        { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff' }
      ]}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportTypeContainer}>
          <View style={[
            styles.reportTypeIcon,
            { backgroundColor: REPORT_TYPES[item.type]?.color || REPORT_TYPES.none.color }
          ]}>
            <Ionicons
              name={REPORT_TYPES[item.type]?.icon as any || REPORT_TYPES.none.icon}
              size={20}
              color="#fff"
            />
          </View>
          <Text style={[
            styles.reportType,
            { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
          ]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
        <View style={styles.reportStatusContainer}>
          <View style={[
            styles.reportStatusIcon,
            { backgroundColor: STATUS_TYPES[item.status]?.color || STATUS_TYPES.PENDING.color }
          ]}>
            <Ionicons
              name={STATUS_TYPES[item.status]?.icon as any || STATUS_TYPES.PENDING.icon}
              size={16}
              color="#fff"
            />
          </View>
          <Text style={[
            styles.reportStatus,
            { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
          ]}>
            {STATUS_TYPES[item.status]?.label || 'Pending'}
          </Text>
        </View>
      </View>

      {item.imageUrl && (
        <TouchableOpacity onPress={() => setSelectedImage(item.imageUrl)}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.reportImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}

      <Text style={[
        styles.reportDescription,
        { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
      ]}>
        {item.description}
      </Text>

      <View style={styles.reportFooter}>
        <View style={styles.locationContainer}>
          <Ionicons
            name="location"
            size={16}
            color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
          />
          <Text style={[
            styles.locationText,
            { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
          ]}>
            {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
          </Text>
        </View>
        <Text style={[
          styles.reportDate,
          { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
        ]}>
          {new Date(item.dateCreated).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFilterMenu = () => (
    <Modal
      visible={showFilter}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilter(false)}
    >
      <Pressable
        style={styles.filterModalOverlay}
        onPress={() => setShowFilter(false)}
      >
        <View style={[
          styles.filterModalContent,
          { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff' }
        ]}>
          <View style={styles.filterHeader}>
            <Text style={[
              styles.filterTitle,
              { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
            ]}>
              Filter Reports
            </Text>
            <TouchableOpacity
              onPress={() => setShowFilter(false)}
              style={styles.closeFilterButton}
            >
              <Ionicons
                name="close"
                size={24}
                color={colorScheme === 'dark' ? '#fff' : '#1F2937'}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={[
              styles.filterSectionTitle,
              { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
            ]}>
              Report Type
            </Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  selectedType === 'all' && {
                    backgroundColor: '#3B82F6',
                    borderWidth: 2,
                    borderColor: '#3B82F6'
                  },
                  { backgroundColor: colorScheme === 'dark' ? '#374151' : '#F3F4F6' }
                ]}
                onPress={() => setSelectedType('all')}
              >
                <Text style={[
                  styles.filterOptionText,
                  selectedType === 'all' ? { color: '#000' } : { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                ]}>
                  All Types
                </Text>
              </TouchableOpacity>
              {Object.entries(REPORT_TYPES).map(([type, { icon, color }]) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterOption,
                    selectedType === type && {
                      backgroundColor: color,
                      borderWidth: 2,
                      borderColor: color
                    },
                    { backgroundColor: colorScheme === 'dark' ? '#374151' : '#F3F4F6' }
                  ]}
                  onPress={() => setSelectedType(type as keyof typeof REPORT_TYPES)}
                >
                  <View style={[
                    styles.filterOptionIcon,
                    { backgroundColor: selectedType === type ? '#fff' : color }
                  ]}>
                    <Ionicons
                      name={icon as any}
                      size={16}
                      color={selectedType === type ? color : '#fff'}
                    />
                  </View>
                  <Text style={[
                    styles.filterOptionText,
                    selectedType === type ? { color: '#000' } : { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={[
              styles.filterSectionTitle,
              { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
            ]}>
              Status
            </Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  selectedStatus === 'all' && {
                    backgroundColor: '#3B82F6',
                    borderWidth: 2,
                    borderColor: '#3B82F6'
                  },
                  { backgroundColor: colorScheme === 'dark' ? '#374151' : '#F3F4F6' }
                ]}
                onPress={() => setSelectedStatus('all')}
              >
                <Text style={[
                  styles.filterOptionText,
                  selectedStatus === 'all' ? { color: '#000' } : { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                ]}>
                  All Status
                </Text>
              </TouchableOpacity>
              {Object.entries(STATUS_TYPES).map(([status, { icon, color, label }]) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterOption,
                    selectedStatus === status && {
                      backgroundColor: color,
                      borderWidth: 2,
                      borderColor: color
                    },
                    { backgroundColor: colorScheme === 'dark' ? '#374151' : '#F3F4F6' }
                  ]}
                  onPress={() => setSelectedStatus(status as keyof typeof STATUS_TYPES)}
                >
                  <View style={[
                    styles.filterOptionIcon,
                    { backgroundColor: selectedStatus === status ? '#fff' : color }
                  ]}>
                    <Ionicons
                      name={icon as any}
                      size={16}
                      color={selectedStatus === status ? color : '#fff'}
                    />
                  </View>
                  <Text style={[
                    styles.filterOptionText,
                    selectedStatus === status ? { color: '#000' } : { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedType !== 'all') count++;
    if (selectedStatus !== 'all') count++;
    return count;
  };

  const getActiveFiltersText = () => {
    const filters = [];
    if (selectedType !== 'all') {
      filters.push(selectedType.charAt(0).toUpperCase() + selectedType.slice(1));
    }
    if (selectedStatus !== 'all') {
      filters.push(STATUS_TYPES[selectedStatus].label);
    }
    return filters.join(', ');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: colorScheme === 'dark' ? '#000' : '#f3f4f6' }
    ]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff' }
          ]}
          onPress={() => setShowFilter(true)}
        >
          <Ionicons
            name="filter"
            size={20}
            color={colorScheme === 'dark' ? '#fff' : '#1F2937'}
          />
          <Text style={[
            styles.filterButtonText,
            { color: colorScheme === 'dark' ? '#fff' : '#1F2937' }
          ]}>
            Filter
          </Text>
          {getActiveFiltersCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {getActiveFiltersCount()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        {getActiveFiltersCount() > 0 && (
          <Text style={[
            styles.activeFiltersText,
            { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
          ]}>
            {getActiveFiltersText()}
          </Text>
        )}
      </View>

      <FlatList
        data={filteredReports}
        renderItem={renderReportItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={!loading ? <EmptyComponent colorScheme={colorScheme} /> : null}
        ListFooterComponent={loading && !refreshing ? <LoadingComponent /> : null}
      />

      {renderFilterMenu()}

      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setSelectedImage(null)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons
                name="close"
                size={28}
                color="#fff"
              />
            </TouchableOpacity>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  reportItem: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  reportType: {
    fontSize: 16,
    fontWeight: '600',
  },
  reportStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportStatusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  reportDate: {
    fontSize: 14,
  },
  reportImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  reportDescription: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  modalImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  activeFiltersText: {
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeFilterButton: {
    padding: 4,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFilterOption: {
    backgroundColor: '#3B82F6',
  },
  filterOptionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 