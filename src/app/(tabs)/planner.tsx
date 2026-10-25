import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Check,
  CheckCircle2,
  Clock,
  Coffee,
  RefreshCw,
  Sparkles,
  Wand2,
} from 'lucide-react-native';
import { Header } from '@/components/Header';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { Colors, Radius, Spacing, Typography } from '@/theme/colors';
import { DayPlan } from '@/types/wardrobe';

/**
 * Displays the weekly plan with generation, daily shuffle, wear, and laundry actions.
 * Initially selects today's UTC date when present, otherwise the first plan entry.
 */
export default function PlannerScreen() {
  const weeklyPlan = useWardrobeStore((state) => state.weeklyPlan);
  const generateWeeklyPlan = useWardrobeStore(
    (state) => state.generateWeeklyPlan
  );
  const shuffleDayOutfit = useWardrobeStore((state) => state.shuffleDayOutfit);
  const markDayAsWorn = useWardrobeStore((state) => state.markDayAsWorn);
  const markOutfitAsWorn = useWardrobeStore((state) => state.markOutfitAsWorn);
  const setAvailabilityStatus = useWardrobeStore(
    (state) => state.setAvailabilityStatus
  );

  // Active selected day in the 7-day strip (defaults to today if present)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const todayMatch = weeklyPlan.find((day) => day.date === todayStr);
    return todayMatch?.date || weeklyPlan[0]?.date || todayStr;
  });

  const activeDay =
    weeklyPlan.find((day) => day.date === selectedDate) || weeklyPlan[0];

  /**
   * Marks the day worn and attempts wear tracking for its outfit. If an outfit is
   * present, offers to move its items to laundry, starting updates without awaiting them.
   */
  const handleMarkDayWorn = (day: DayPlan) => {
    markDayAsWorn(day.date);
    if (day.outfit) {
      markOutfitAsWorn(day.outfit.id);

      Alert.alert(
        'Move Items to Laundry?',
        'Would you like to move these worn items to your Laundry basket so future outfit recommendations know they need washing?',
        [
          { text: 'Keep in Closet', style: 'cancel' },
          {
            text: 'Move to Laundry',
            onPress: () => {
              day.outfit?.items.forEach((item) => {
                setAvailabilityStatus(item.id, 'laundry');
              });
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Screen Header */}
      <Header
        title="Outfit Planner"
        subtitle="7-Day Intelligent Wardrobe Schedule"
        rightAction={
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={generateWeeklyPlan}
            style={styles.generateBtn}>
            <Wand2 size={15} color={Colors.textInverse} />
            <Text style={styles.generateBtnText}>Auto-Plan Week</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Anti-Repetition Info Banner */}
        <View style={styles.infoBanner}>
          <Sparkles size={16} color="#8A5D0E" />
          <Text style={styles.infoBannerText}>
            Our AI schedules zero identical combinations and rotates unworn
            items through your week automatically.
          </Text>
        </View>

        {/* 7-Day Calendar Strip */}
        <Text style={styles.sectionLabel}>
          {weeklyPlan.length >= 7
            ? `WEEK OF ${weeklyPlan[0].dayOfWeek.toUpperCase()} ${weeklyPlan[0].dayNumber} – ${weeklyPlan[6].dayOfWeek.toUpperCase()} ${weeklyPlan[6].dayNumber}`
            : '7-DAY SCHEDULE'}
        </Text>
        <View style={styles.calendarStrip}>
          {weeklyPlan.map((day) => {
            const isSelected = day.date === selectedDate;
            const isWorn = day.status === 'worn';
            const isRest = day.status === 'rest';

            return (
              <TouchableOpacity
                key={day.date}
                activeOpacity={0.8}
                onPress={() => setSelectedDate(day.date)}
                style={[
                  styles.dayCard,
                  isSelected ? styles.dayCardSelected : styles.dayCardDefault,
                ]}>
                <Text
                  style={[
                    styles.dayOfWeekText,
                    isSelected ? styles.dayTextSelected : styles.dayTextDefault,
                  ]}>
                  {day.dayOfWeek}
                </Text>
                <Text
                  style={[
                    styles.dayNumberText,
                    isSelected ? styles.dayTextSelected : styles.dayTextDefault,
                  ]}>
                  {day.dayNumber}
                </Text>

                {/* Status Indicator Dot / Icon */}
                <View style={styles.statusIndicator}>
                  {isWorn ? (
                    <View style={styles.wornDot}>
                      <Check size={8} color={Colors.textInverse} />
                    </View>
                  ) : isRest ? (
                    <View style={styles.restDot} />
                  ) : (
                    <View
                      style={[
                        styles.plannedDot,
                        isSelected ? { backgroundColor: Colors.accent } : null,
                      ]}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Status Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.legendText}>Actually Worn</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
            <Text style={styles.legendText}>Planned Look</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.textMuted }]} />
            <Text style={styles.legendText}>Rest / Laundry</Text>
          </View>
        </View>

        {/* Selected Day Outfit Preview */}
        {activeDay && (
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailDayTitle}>
                  {activeDay.dayOfWeek}, Day {activeDay.dayNumber}
                </Text>
                <Text style={styles.detailNotes}>
                  {activeDay.notes || 'Curated daily wardrobe'}
                </Text>
              </View>

              {/* Status Badge */}
              <View
                style={[
                  styles.badgePill,
                  activeDay.status === 'worn'
                    ? styles.badgeWorn
                    : activeDay.status === 'rest'
                    ? styles.badgeRest
                    : styles.badgePlanned,
                ]}>
                {activeDay.status === 'worn' ? (
                  <>
                    <CheckCircle2 size={13} color={Colors.success} />
                    <Text style={styles.badgeTextWorn}>Worn</Text>
                  </>
                ) : activeDay.status === 'rest' ? (
                  <>
                    <Coffee size={13} color={Colors.textSecondary} />
                    <Text style={styles.badgeTextRest}>Rest Day</Text>
                  </>
                ) : (
                  <>
                    <Clock size={13} color="#9E6E16" />
                    <Text style={styles.badgeTextPlanned}>Scheduled</Text>
                  </>
                )}
              </View>
            </View>

            {/* If rest day */}
            {activeDay.status === 'rest' || !activeDay.outfit ? (
              <View style={styles.restDayContainer}>
                <Coffee size={32} color={Colors.accent} />
                <Text style={styles.restDayTitle}>Wardrobe Rest & Reset</Text>
                <Text style={styles.restDayDesc}>
                  Scheduled laundry wash and rotation refresh day. No outfit required.
                </Text>
              </View>
            ) : (
              <>
                {/* Outfit Info */}
                <View style={styles.outfitMetaRow}>
                  <View style={styles.outfitMetaLeft}>
                    <Text style={styles.outfitVibe}>
                      {activeDay.outfit.styleVibe}
                    </Text>
                    <Text style={styles.outfitName}>{activeDay.outfit.name}</Text>
                  </View>
                  <View style={styles.outfitScoreTag}>
                    <Sparkles size={11} color="#9E6E16" />
                    <Text style={styles.outfitScoreText}>
                      {activeDay.outfit.compatibilityScore}% Match
                    </Text>
                  </View>
                </View>

                {/* Items in the outfit */}
                <Text style={styles.itemsIncludedHeader}>
                  ITEMS INCLUDED ({activeDay.outfit.items.length})
                </Text>
                <View style={styles.itemsGrid}>
                  {activeDay.outfit.items.map((item, idx) => (
                    <View key={`${item.id}-${idx}`} style={styles.itemCard}>
                      <View style={styles.itemImageContainer}>
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.itemImg}
                          resizeMode="cover"
                        />
                        {item.timesWorn === 0 && (
                          <View style={styles.itemNewTag}>
                            <Text style={styles.itemNewText}>Unworn</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.itemCatText}>{item.category}</Text>
                      <Text style={styles.itemNameText} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemColorText}>{item.color}</Text>
                    </View>
                  ))}
                </View>

                {/* Action buttons */}
                <View style={styles.buttonActionRow}>
                  {activeDay.status !== 'worn' && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => shuffleDayOutfit(activeDay.date)}
                      style={styles.shuffleBtn}>
                      <RefreshCw size={14} color={Colors.primary} />
                      <Text style={styles.shuffleBtnText}>Shuffle Look</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleMarkDayWorn(activeDay)}
                    disabled={activeDay.status === 'worn'}
                    style={[
                      styles.markWornButton,
                      activeDay.status === 'worn' ? styles.markWornBtnDone : null,
                      activeDay.status !== 'worn' ? { flex: 1, marginTop: 0 } : null,
                    ]}>
                    {activeDay.status === 'worn' ? (
                      <>
                        <CheckCircle2 size={16} color={Colors.success} />
                        <Text style={styles.markWornBtnDoneText}>
                          Marked as Worn for {activeDay.dayOfWeek}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Check size={16} color={Colors.textInverse} />
                        <Text style={styles.markWornBtnText}>
                          Mark as Worn
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        {/* Action Button at bottom */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={generateWeeklyPlan}
          style={styles.bigGenerateBtn}>
          <Wand2 size={18} color={Colors.textInverse} />
          <Text style={styles.bigGenerateBtnText}>Generate Weekly Plan</Text>
        </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl * 2,
  },
  infoBanner: {
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
  infoBannerText: {
    flex: 1,
    fontSize: Typography.fontSize.xs + 1,
    color: '#7D581A',
    lineHeight: 18,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  dayCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md - 2,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  dayCardDefault: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  dayCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayOfWeekText: {
    fontSize: Typography.fontSize.xs - 1,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dayNumberText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    marginTop: 2,
  },
  dayTextDefault: {
    color: Colors.text,
  },
  dayTextSelected: {
    color: Colors.textInverse,
  },
  statusIndicator: {
    marginTop: 6,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wornDot: {
    width: 14,
    height: 14,
    borderRadius: Radius.round,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plannedDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.round,
    backgroundColor: Colors.accent,
  },
  restDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.round,
    backgroundColor: Colors.border,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.round,
  },
  legendText: {
    fontSize: Typography.fontSize.xs - 1,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: Spacing.xl,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  detailDayTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.text,
  },
  detailNotes: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.round,
  },
  badgeWorn: {
    backgroundColor: Colors.successLight,
  },
  badgePlanned: {
    backgroundColor: Colors.accentSubtle,
    borderWidth: 1,
    borderColor: '#E6D7B8',
  },
  badgeRest: {
    backgroundColor: Colors.surfaceSecondary,
  },
  badgeTextWorn: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.success,
  },
  badgeTextPlanned: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: '#8A5D0E',
  },
  badgeTextRest: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  restDayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.sm,
  },
  restDayTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  restDayDesc: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },
  outfitMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  outfitMetaLeft: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  outfitVibe: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.accent,
    textTransform: 'uppercase',
  },
  outfitName: {
    fontSize: Typography.fontSize.md + 1,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  outfitScoreTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentSubtle,
    borderWidth: 1,
    borderColor: '#E6D7B8',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.round,
  },
  outfitScoreText: {
    fontSize: Typography.fontSize.xs - 1,
    fontWeight: '800',
    color: '#8A5D0E',
  },
  itemsIncludedHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  itemCard: {
    flex: 1,
    minWidth: '22%',
  },
  itemImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 4,
    position: 'relative',
  },
  itemImg: {
    width: '100%',
    height: '100%',
  },
  itemNewTag: {
    position: 'absolute',
    top: 3,
    left: 3,
    backgroundColor: '#B87A00',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  itemNewText: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.textInverse,
  },
  itemCatText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  itemNameText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  itemColorText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  buttonActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md - 2,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shuffleBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  markWornButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radius.round,
    paddingVertical: Spacing.md - 2,
    marginTop: Spacing.xs,
  },
  markWornBtnDone: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  markWornBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  markWornBtnDoneText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.success,
  },
  bigGenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.round,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  bigGenerateBtnText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.textInverse,
  },
});
