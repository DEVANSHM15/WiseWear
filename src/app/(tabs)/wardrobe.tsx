import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from 'lucide-react-native';
import { AddItemModal } from '@/components/AddItemModal';
import { AuthModal } from '@/components/AuthModal';
import { CategoryFilterBar } from '@/components/CategoryFilterBar';
import { ClothingCard } from '@/components/ClothingCard';
import { ClothingDetailModal } from '@/components/ClothingDetailModal';
import { Header } from '@/components/Header';
import { isSupabaseConfigured } from '@/services/supabase';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { Colors, Radius, Spacing, Typography } from '@/theme/colors';
import {
  AvailabilityStatus,
  ClothingCategory,
  ClothingItem,
} from '@/types/wardrobe';

const ALL_CATEGORIES: (ClothingCategory | 'All')[] = [
  'All',
  'Shirts',
  'T-shirts',
  'Trousers',
  'Jeans',
  'Shorts',
  'Jackets and outerwear',
  'Dresses and ethnic wear',
  'Shoes and footwear',
  'Accessories',
];

const AVAILABILITY_FILTERS: { label: string; value: AvailabilityStatus | 'All' }[] = [
  { label: 'All Items', value: 'All' },
  { label: 'Available', value: 'available' },
  { label: 'In Laundry', value: 'laundry' },
  { label: 'Stored Away', value: 'unavailable' },
];

export default function WardrobeScreen() {
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [detailItem, setDetailItem] = useState<ClothingItem | null>(null);

  const items = useWardrobeStore((state) => state.items);
  const isLoading = useWardrobeStore((state) => state.isLoading);
  const error = useWardrobeStore((state) => state.error);
  const sessionUser = useWardrobeStore((state) => state.sessionUser);
  
  const searchQuery = useWardrobeStore((state) => state.searchQuery);
  const selectedCategory = useWardrobeStore((state) => state.selectedCategory);
  const selectedAvailability = useWardrobeStore((state) => state.selectedAvailability);
  const showOnlyNeverWorn = useWardrobeStore((state) => state.showOnlyNeverWorn);
  const sortBy = useWardrobeStore((state) => state.sortBy);

  const setSearchQuery = useWardrobeStore((state) => state.setSearchQuery);
  const setSelectedCategory = useWardrobeStore((state) => state.setSelectedCategory);
  const setSelectedAvailability = useWardrobeStore((state) => state.setSelectedAvailability);
  const setShowOnlyNeverWorn = useWardrobeStore((state) => state.setShowOnlyNeverWorn);
  const setSortBy = useWardrobeStore((state) => state.setSortBy);

  const addClothingItem = useWardrobeStore((state) => state.addClothingItem);
  const updateClothingItem = useWardrobeStore((state) => state.updateClothingItem);
  const deleteClothingItem = useWardrobeStore((state) => state.deleteClothingItem);
  const refreshWardrobe = useWardrobeStore((state) => state.refreshWardrobe);
  const toggleLaundry = useWardrobeStore((state) => state.toggleLaundry);

  // Category item counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: items.length };
    ALL_CATEGORIES.forEach((cat) => {
      if (cat !== 'All') {
        counts[cat] = items.filter((i) => i.category === cat).length;
      }
    });
    return counts;
  }, [items]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    const filtered = items.filter((item) => {
      // Category filter
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;

      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.primaryColor && item.primaryColor.toLowerCase().includes(q)) ||
        (item.color && item.color.toLowerCase().includes(q)) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(q));

      // Never-worn filter
      const matchesNeverWorn = showOnlyNeverWorn ? item.timesWorn === 0 : true;

      // Availability filter
      const matchesAvailability =
        selectedAvailability === 'All' || item.availabilityStatus === selectedAvailability;

      return matchesCategory && matchesSearch && matchesNeverWorn && matchesAvailability;
    });

    // Sort
    return filtered.sort((a, b) => {
      if (sortBy === 'most_worn') {
        return b.timesWorn - a.timesWorn;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      // 'recently_added' default
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [items, selectedCategory, searchQuery, showOnlyNeverWorn, selectedAvailability, sortBy]);

  const toggleSort = () => {
    if (sortBy === 'recently_added') setSortBy('most_worn');
    else if (sortBy === 'most_worn') setSortBy('name');
    else setSortBy('recently_added');
  };

  const getSortLabel = () => {
    if (sortBy === 'most_worn') return 'Most Worn';
    if (sortBy === 'name') return 'Name (A-Z)';
    return 'Recently Added';
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Screen Header */}
      <Header
        title="My Wardrobe"
        subtitle={`${items.length} items cataloged`}
        rightAction={
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setAddModalVisible(true)}
            style={styles.addHeaderBtn}>
            <Plus size={16} color={Colors.textInverse} />
            <Text style={styles.addHeaderBtnText}>Add Item</Text>
          </TouchableOpacity>
        }
      />

      {/* Cloud Sync / Guest Mode Banner */}
      {sessionUser ? (
        <View style={styles.connectedBanner}>
          <CheckCircle2 size={13} color={Colors.success} />
          <Text style={styles.connectedBannerText}>
            Cloud Synced • {sessionUser.email || 'Supabase Connected'}
          </Text>
        </View>
      ) : isSupabaseConfigured ? (
        <View style={styles.demoBanner}>
          <Sparkles size={13} color="#8A5D0E" />
          <Text style={styles.demoBannerText}>
            Guest Mode: Sign in to sync your wardrobe with Supabase Cloud
          </Text>
          <TouchableOpacity
            onPress={() => setAuthModalVisible(true)}
            style={styles.bannerActionBtn}>
            <Text style={styles.bannerActionBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.demoBanner}>
          <Sparkles size={13} color="#8A5D0E" />
          <Text style={styles.demoBannerText}>
            Demo Mode: Wardrobe persisted locally. Add Supabase keys to .env for multi-device cloud sync.
          </Text>
        </View>
      )}

      {/* Error state alert if any */}
      {error ? (
        <View style={styles.errorAlert}>
          <AlertCircle size={16} color={Colors.danger} />
          <Text style={styles.errorAlertText}>{error}</Text>
          <TouchableOpacity onPress={refreshWardrobe} style={styles.retryBtn}>
            <RefreshCw size={13} color={Colors.danger} />
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Search Input & Action Controls */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, color, or brand..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Never Worn Quick Filter Toggle */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setShowOnlyNeverWorn(!showOnlyNeverWorn)}
          style={[
            styles.toggleBtn,
            showOnlyNeverWorn ? styles.toggleBtnActive : null,
          ]}>
          <Sparkles
            size={14}
            color={showOnlyNeverWorn ? '#8A5D0E' : Colors.textSecondary}
          />
          <Text
            style={[
              styles.toggleBtnText,
              showOnlyNeverWorn ? styles.toggleBtnTextActive : null,
            ]}>
            Unworn
          </Text>
        </TouchableOpacity>

        {/* Sort Toggle */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={toggleSort}
          style={styles.sortBtn}>
          <ArrowUpDown size={14} color={Colors.textSecondary} />
          <Text style={styles.sortBtnText}>{getSortLabel()}</Text>
        </TouchableOpacity>
      </View>

      {/* Availability Status Filter Row */}
      <View style={styles.availabilityRow}>
        {AVAILABILITY_FILTERS.map((filt) => {
          const isSelected = selectedAvailability === filt.value;
          return (
            <TouchableOpacity
              key={filt.value}
              onPress={() => setSelectedAvailability(filt.value)}
              style={[
                styles.availPill,
                isSelected ? styles.availPillActive : styles.availPillInactive,
              ]}>
              <Text
                style={[
                  styles.availPillText,
                  isSelected ? styles.availPillTextActive : styles.availPillTextInactive,
                ]}>
                {filt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Category Pills Bar */}
      <CategoryFilterBar
        categories={ALL_CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={categoryCounts}
      />

      {/* Two-Column Grid of Clothes */}
      <FlatList
        data={filteredAndSortedItems}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshWardrobe}
            tintColor={Colors.primary}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <ClothingCard
              item={item}
              onPress={() => setDetailItem(item)}
              onToggleLaundry={() => toggleLaundry(item.id)}
            />
          </View>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.emptySubtitle}>Loading wardrobe...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Filter size={24} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>
                {items.length === 0 ? 'Your Digital Closet is Empty' : 'No clothing items match'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {items.length === 0
                  ? 'Start by snapping a photo or picking an image of your clothes!'
                  : 'Try adjusting your search query, sort order, or filters.'}
              </Text>
              {items.length === 0 ? (
                <TouchableOpacity
                  onPress={() => setAddModalVisible(true)}
                  style={styles.emptyActionBtn}>
                  <Plus size={16} color={Colors.textInverse} />
                  <Text style={styles.emptyActionBtnText}>Add Your First Item</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSelectedAvailability('All');
                    setShowOnlyNeverWorn(false);
                  }}
                  style={styles.resetFiltersBtn}>
                  <Text style={styles.resetFiltersBtnText}>Reset All Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
      />

      {/* Add Item Modal */}
      <AddItemModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={addClothingItem}
      />

      {/* Item Detail & Edit Modal */}
      <ClothingDetailModal
        item={detailItem}
        visible={!!detailItem}
        onClose={() => setDetailItem(null)}
        onUpdate={async (id, updates) => {
          const updated = await updateClothingItem(id, updates);
          setDetailItem(updated);
        }}
        onDelete={async (id) => {
          await deleteClothingItem(id);
          setDetailItem(null);
        }}
      />

      {/* Cloud Auth Modal */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onAuthSuccess={() => {
          refreshWardrobe();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  connectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF7EE',
    borderWidth: 1,
    borderColor: '#C3E6CD',
    borderRadius: Radius.sm,
    marginHorizontal: Spacing.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginBottom: Spacing.xs,
  },
  connectedBannerText: {
    fontSize: Typography.fontSize.xs,
    color: '#1E6B37',
    fontWeight: '600',
    flex: 1,
  },
  bannerActionBtn: {
    backgroundColor: '#8A5D0E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  bannerActionBtnText: {
    color: '#FFF',
    fontSize: Typography.fontSize.xs - 2,
    fontWeight: '700',
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.round,
  },
  addHeaderBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xs + 1,
    fontWeight: '700',
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF5EA',
    borderWidth: 1,
    borderColor: '#E6D7B8',
    borderRadius: Radius.sm,
    marginHorizontal: Spacing.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    marginBottom: Spacing.xs,
  },
  demoBannerText: {
    fontSize: Typography.fontSize.xs - 1,
    color: '#7D581A',
    fontWeight: '600',
    flex: 1,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    marginBottom: Spacing.xs,
  },
  errorAlertText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: Colors.danger,
    fontWeight: '600',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: Radius.round,
  },
  retryBtnText: {
    fontSize: Typography.fontSize.xs - 1,
    color: Colors.danger,
    fontWeight: '700',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    height: 42,
  },
  toggleBtnActive: {
    backgroundColor: '#FAF5EA',
    borderColor: '#E6D7B8',
  },
  toggleBtnText: {
    fontSize: Typography.fontSize.xs - 1,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: '#8A5D0E',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    height: 42,
  },
  sortBtnText: {
    fontSize: Typography.fontSize.xs - 1,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  availabilityRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.xl,
    marginTop: 4,
    marginBottom: 4,
  },
  availPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.round,
    borderWidth: 1,
  },
  availPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  availPillInactive: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  availPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  availPillTextActive: {
    color: Colors.textInverse,
  },
  availPillTextInactive: {
    color: Colors.textSecondary,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  gridItem: {
    flex: 1,
    maxWidth: '48.5%',
  },
  listContainer: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxxl * 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl * 2,
    paddingHorizontal: Spacing.xxl,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: Radius.round,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyActionBtn: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.round,
  },
  emptyActionBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  resetFiltersBtn: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetFiltersBtnText: {
    fontSize: Typography.fontSize.xs + 1,
    fontWeight: '700',
    color: Colors.text,
  },
});
