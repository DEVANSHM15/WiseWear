import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  CalendarDays,
  CheckCircle2,
  CloudSun,
  EyeOff,
  Layers,
  Plus,
  Sparkles,
  TrendingUp,
  Wand2,
  WashingMachine,
} from 'lucide-react-native';
import { AddItemModal } from '@/components/AddItemModal';
import { OutfitCard } from '@/components/OutfitCard';
import { StatCard } from '@/components/StatCard';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { Colors, Radius, Spacing, Typography } from '@/theme/colors';

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);

  const user = useWardrobeStore((state) => state.user);
  const items = useWardrobeStore((state) => state.items);
  const todayOutfit = useWardrobeStore((state) => state.todayOutfit);
  const isGeneratingOutfit = useWardrobeStore((state) => state.isGeneratingOutfit);
  const getStats = useWardrobeStore((state) => state.getStats);
  const saveOutfit = useWardrobeStore((state) => state.saveOutfit);
  const markOutfitAsWorn = useWardrobeStore((state) => state.markOutfitAsWorn);
  const generateAnotherOutfit = useWardrobeStore((state) => state.generateAnotherOutfit);
  const addClothingItem = useWardrobeStore((state) => state.addClothingItem);

  const stats = getStats();

  const isTodayOutfitValid = Boolean(
    todayOutfit &&
    todayOutfit.items &&
    todayOutfit.items.length > 0 &&
    todayOutfit.items.every((oi) => items.some((i) => i.id === oi.id))
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* Weather & Context Pill */}
        <View style={styles.contextPill}>
          <CloudSun size={15} color={Colors.accent} />
          <Text style={styles.contextText}>
            {user.city} • Perfect day for crisp cotton & wool layers
          </Text>
        </View>

        {/* Quick Actions Row */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionButton}
            activeOpacity={0.8}
            onPress={() => setModalVisible(true)}>
            <View style={styles.quickActionIconWrapper}>
              <Plus size={18} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>Add Clothes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            activeOpacity={0.8}
            onPress={() => {
              generateAnotherOutfit();
              router.push('/discover');
            }}>
            <View style={styles.quickActionIconWrapper}>
              <Wand2 size={18} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>Generate Outfit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            activeOpacity={0.8}
            onPress={() => router.push('/planner')}>
            <View style={styles.quickActionIconWrapper}>
              <CalendarDays size={18} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>Plan My Week</Text>
          </TouchableOpacity>
        </View>

        {/* Wardrobe Health Overview Cards */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Wardrobe Analytics</Text>
          <Text style={styles.sectionSubtitle}>Zero decision fatigue</Text>
        </View>

        {items.length === 0 ? (
          /* Empty onboarding card */
          <View style={styles.emptyOnboardingCard}>
            <Sparkles size={24} color={Colors.accent} />
            <Text style={styles.emptyOnboardTitle}>Welcome to Your Digital Wardrobe</Text>
            <Text style={styles.emptyOnboardSub}>
              Snap a photo of your clothes to unlock AI outfit combinations and stop repeating the same outfits.
            </Text>
            <TouchableOpacity
              style={styles.emptyOnboardBtn}
              onPress={() => setModalVisible(true)}>
              <Plus size={16} color={Colors.textInverse} />
              <Text style={styles.emptyOnboardBtnText}>Add Your First Piece</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* 4 Core Stat Cards */}
            <View style={styles.statsGrid}>
              <View style={styles.statColumn}>
                <StatCard
                  label="Total Pieces"
                  value={stats.totalItems}
                  sublabel="In digital closet"
                  icon={<Layers size={16} color={Colors.textSecondary} />}
                />
              </View>
              <View style={styles.statColumn}>
                <StatCard
                  label="Available"
                  value={stats.availableItems}
                  sublabel="Ready to wear"
                  accentColor={Colors.success}
                  icon={<CheckCircle2 size={16} color={Colors.success} />}
                />
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statColumn}>
                <StatCard
                  label="In Laundry"
                  value={stats.laundryItems}
                  sublabel="Washing / care"
                  accentColor={stats.laundryItems > 0 ? '#8A5D0E' : Colors.textMuted}
                  icon={<WashingMachine size={16} color={stats.laundryItems > 0 ? '#8A5D0E' : Colors.textMuted} />}
                />
              </View>
              <View style={styles.statColumn}>
                <StatCard
                  label="Never Worn"
                  value={stats.neverWornCount}
                  sublabel="Needs rotation"
                  accentColor={stats.neverWornCount > 0 ? '#B87A00' : Colors.success}
                  icon={<EyeOff size={16} color="#B87A00" />}
                />
              </View>
            </View>

            {/* Wardrobe Coverage Percentage Card */}
            <View style={styles.coverageCard}>
              <View style={styles.coverageHeader}>
                <View>
                  <Text style={styles.coverageLabel}>WARDROBE COVERAGE</Text>
                  <Text style={styles.coverageValue}>{stats.coveragePercentage}%</Text>
                </View>
                <View style={styles.coverageBadge}>
                  <TrendingUp size={14} color={Colors.success} />
                  <Text style={styles.coverageBadgeText}>
                    {stats.wornCount} of {stats.totalItems} items active
                  </Text>
                </View>
              </View>

              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${stats.coveragePercentage}%` },
                  ]}
                />
              </View>

              <Text style={styles.coverageTip}>
                {stats.neverWornCount > 0
                  ? `Wearing your ${stats.neverWornCount} unworn piece${
                      stats.neverWornCount > 1 ? 's' : ''
                    } will increase your closet coverage to 100%! 👍`
                  : '🌟 Outstanding! You have utilized 100% of your wardrobe!'}
              </Text>
            </View>

            {/* Recently Added Items Section */}
            {stats.recentlyAdded.length > 0 && (
              <View style={styles.recentSection}>
                <View style={styles.recentHeaderRow}>
                  <Text style={styles.recentTitle}>Recently Added to Closet</Text>
                  <TouchableOpacity onPress={() => router.push('/wardrobe')}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentScroll}>
                  {stats.recentlyAdded.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.8}
                      onPress={() => router.push('/wardrobe')}
                      style={styles.recentCard}>
                      <Image source={{ uri: item.imageUrl }} style={styles.recentImage} />
                      <Text style={styles.recentItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.recentItemCat}>{item.category}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}

        {/* Today's Outfit Recommendation Hero */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Today&apos;s Outfit</Text>
            <Text style={styles.sectionSubtitle}>
              {isTodayOutfitValid ? 'AI Curated Look' : 'Upload clothes to generate'}
            </Text>
          </View>
          {isTodayOutfitValid && (
            <TouchableOpacity
              onPress={generateAnotherOutfit}
              disabled={isGeneratingOutfit}
              style={[styles.shuffleLink, isGeneratingOutfit && { opacity: 0.6 }]}>
              {isGeneratingOutfit ? (
                <ActivityIndicator size="small" color={Colors.accent} />
              ) : (
                <Sparkles size={14} color={Colors.accent} />
              )}
              <Text style={styles.shuffleLinkText}>
                {isGeneratingOutfit ? 'Styling...' : 'Shuffle Look'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isTodayOutfitValid && todayOutfit ? (
          <OutfitCard
            outfit={todayOutfit}
            onSave={() => saveOutfit(todayOutfit.id)}
            onMarkWorn={() => markOutfitAsWorn(todayOutfit.id)}
            onGenerateAnother={generateAnotherOutfit}
          />
        ) : (
          <View style={styles.emptyOutfitCard}>
            <View style={styles.emptyOutfitIcon}>
              <Sparkles size={22} color={Colors.accent} />
            </View>
            <Text style={styles.emptyOutfitTitle}>No Outfit Generated Yet</Text>
            <Text style={styles.emptyOutfitSub}>
              {items.length < 2
                ? 'Upload at least 2 pieces of your clothing (e.g. shirt and trousers) to generate personalized AI outfit recommendations!'
                : 'Tap below to generate a smart combination tailored to your wardrobe.'}
            </Text>
            <TouchableOpacity
              style={styles.emptyOutfitBtn}
              onPress={() => {
                if (items.length < 2) {
                  setModalVisible(true);
                } else {
                  generateAnotherOutfit();
                }
              }}>
              <Plus size={16} color={Colors.textInverse} />
              <Text style={styles.emptyOutfitBtnText}>
                {items.length < 2 ? 'Add Clothes' : 'Generate Outfit'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add Item Modal */}
      <AddItemModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={addClothingItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl * 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  userInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  greeting: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  avatarButton: {
    padding: 3,
    borderRadius: Radius.round,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.round,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF5EA',
    borderWidth: 1,
    borderColor: '#E6D7B8',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginTop: Spacing.sm,
  },
  demoPillText: {
    fontSize: Typography.fontSize.xs - 1,
    color: '#7D581A',
    fontWeight: '600',
    flex: 1,
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.round,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  contextText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Radius.round,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  shuffleLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.accentSubtle,
    borderRadius: Radius.round,
  },
  shuffleLinkText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.accent,
  },
  emptyOnboardingCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  emptyOnboardTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  emptyOnboardSub: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyOnboardBtn: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.round,
  },
  emptyOnboardBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xs + 1,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statColumn: {
    flex: 1,
  },
  coverageCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: Spacing.xl,
  },
  coverageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  coverageLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  coverageValue: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  coverageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.round,
  },
  coverageBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.success,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: Radius.round,
    backgroundColor: Colors.surfaceSecondary,
    overflow: 'hidden',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radius.round,
    backgroundColor: Colors.accent,
  },
  coverageTip: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  recentSection: {
    marginBottom: Spacing.xl,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  recentTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  viewAllText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.accent,
  },
  recentScroll: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  recentCard: {
    width: 100,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 6,
    gap: 3,
  },
  recentImage: {
    width: '100%',
    height: 90,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceSecondary,
  },
  recentItemName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  recentItemCat: {
    fontSize: 9,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  emptyOutfitCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  emptyOutfitIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.round,
    backgroundColor: '#F7EEDB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyOutfitTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptyOutfitSub: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  emptyOutfitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.round,
  },
  emptyOutfitBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
});
