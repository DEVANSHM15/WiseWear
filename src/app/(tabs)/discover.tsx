import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bookmark, Sparkles, Wand2 } from 'lucide-react-native';
import { Header } from '@/components/Header';
import { OutfitCard } from '@/components/OutfitCard';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { Colors, Radius, Spacing, Typography } from '@/theme/colors';

const LOOK_FILTERS = ['All Looks', 'Saved Looks'];

/**
 * Displays all or saved outfits whose items remain in the wardrobe, with generation controls.
 */
export default function DiscoverScreen() {
  const [activeFilter, setActiveFilter] = useState('All Looks');

  const items = useWardrobeStore((state) => state.items);
  const outfits = useWardrobeStore((state) => state.outfits);
  const isGeneratingOutfit = useWardrobeStore((state) => state.isGeneratingOutfit);
  const saveOutfit = useWardrobeStore((state) => state.saveOutfit);
  const markOutfitAsWorn = useWardrobeStore((state) => state.markOutfitAsWorn);
  const generateAnotherOutfit = useWardrobeStore(
    (state) => state.generateAnotherOutfit
  );

  const validOutfits = outfits.filter(
    (o) => o.items && o.items.length > 0 && o.items.every((oi) => items.some((i) => i.id === oi.id))
  );

  const filteredOutfits = validOutfits.filter((outfit) => {
    if (activeFilter === 'Saved Looks') return outfit.isSaved;
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Screen Header */}
      <Header
        title="Discover Outfits"
        subtitle="AI combinations matched to your style"
        rightAction={
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={generateAnotherOutfit}
            disabled={isGeneratingOutfit}
            style={[styles.generateBtn, isGeneratingOutfit && { opacity: 0.7 }]}>
            {isGeneratingOutfit ? (
              <ActivityIndicator size="small" color={Colors.textInverse} />
            ) : (
              <Wand2 size={15} color={Colors.textInverse} />
            )}
            <Text style={styles.generateBtnText}>
              {isGeneratingOutfit ? 'Styling...' : 'New Combo'}
            </Text>
          </TouchableOpacity>
        }
      />

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <View style={styles.filterRow}>
          {LOOK_FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.75}
                style={[
                  styles.filterPill,
                  isActive ? styles.filterPillActive : styles.filterPillInactive,
                ]}>
                {filter === 'Saved Looks' && (
                  <Bookmark
                    size={13}
                    color={isActive ? Colors.textInverse : Colors.textSecondary}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text
                  style={[
                    styles.filterText,
                    isActive ? styles.filterTextActive : styles.filterTextInactive,
                  ]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Outfits List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}>
        {/* Unworn Priority Banner */}
        <View style={styles.priorityCard}>
          <Sparkles size={16} color="#8A5D0E" />
          <View style={styles.priorityTextWrap}>
            <Text style={styles.priorityTitle}>Smart Anti-Repetition Rule</Text>
            <Text style={styles.priorityDesc}>
              Outfits dynamically prioritize clothes that haven&apos;t been worn yet.
              Tap &quot;Generate Another&quot; on any card to explore new silhouettes.
            </Text>
          </View>
        </View>

        {filteredOutfits.map((outfit) => (
          <OutfitCard
            key={outfit.id}
            outfit={outfit}
            onSave={() => saveOutfit(outfit.id)}
            onMarkWorn={() => markOutfitAsWorn(outfit.id)}
            onGenerateAnother={generateAnotherOutfit}
          />
        ))}

        {filteredOutfits.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {items.length < 2 ? 'No outfits to discover yet' : 'No outfits found'}
            </Text>
            <Text style={styles.emptyDesc}>
              {items.length < 2
                ? 'Upload your clothes in the Wardrobe tab to let AI build creative combinations from your personal pieces.'
                : 'Tap "New Combo" in the header to generate fresh looks from your wardrobe.'}
            </Text>
            {activeFilter !== 'All Looks' && (
              <TouchableOpacity
                onPress={() => setActiveFilter('All Looks')}
                style={styles.browseAllBtn}>
                <Text style={styles.browseAllBtnText}>Browse All Looks</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.round,
  },
  generateBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xs + 1,
    fontWeight: '700',
  },
  filterBar: {
    marginBottom: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.round,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillInactive: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  filterText: {
    fontSize: Typography.fontSize.xs + 1,
    fontWeight: '600',
  },
  filterTextActive: {
    color: Colors.textInverse,
  },
  filterTextInactive: {
    color: Colors.textSecondary,
  },
  scrollList: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl * 2,
  },
  priorityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: '#FAF5EA',
    borderWidth: 1,
    borderColor: '#E6D7B8',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  priorityTextWrap: {
    flex: 1,
  },
  priorityTitle: {
    fontSize: Typography.fontSize.xs + 1,
    fontWeight: '700',
    color: '#7D581A',
    marginBottom: 2,
  },
  priorityDesc: {
    fontSize: Typography.fontSize.xs,
    color: '#8A6828',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl * 2,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
  browseAllBtn: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.round,
  },
  browseAllBtnText: {
    fontSize: Typography.fontSize.xs + 1,
    fontWeight: '700',
    color: Colors.textInverse,
  },
});
