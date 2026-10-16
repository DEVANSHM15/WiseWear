import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  CloudSun,
  Flame,
  Palette,
  Sparkles,
} from 'lucide-react-native';
import { Header } from '@/components/Header';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { Colors, Radius, Spacing, Typography } from '@/theme/colors';

export default function ProfileScreen() {
  const user = useWardrobeStore((state) => state.user);
  const getStats = useWardrobeStore((state) => state.getStats);
  const updateUserProfile = useWardrobeStore(
    (state) => state.updateUserProfile
  );

  const stats = getStats();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Profile & Style" subtitle="Your fashion persona & settings" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.personaBadge}>
              <Sparkles size={12} color="#8A5D0E" />
              <Text style={styles.personaText}>{user.stylePersona}</Text>
            </View>
          </View>
        </View>

        {/* Wardrobe Performance Section */}
        <Text style={styles.sectionHeading}>WARDROBE METRICS</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{stats.totalItems}</Text>
            <Text style={styles.metricLabel}>Total Pieces</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{stats.coveragePercentage}%</Text>
            <Text style={styles.metricLabel}>Closet Coverage</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={[styles.metricValue, { color: '#B87A00' }]}>
              {stats.neverWornCount}
            </Text>
            <Text style={styles.metricLabel}>Unworn Pieces</Text>
          </View>
        </View>

        {/* Most Worn Staple */}
        {stats.mostWornItem && (
          <View style={styles.stapleCard}>
            <Image
              source={{ uri: stats.mostWornItem.imageUrl }}
              style={styles.stapleImage}
            />
            <View style={styles.stapleInfo}>
              <View style={styles.stapleBadge}>
                <Flame size={12} color={Colors.accent} />
                <Text style={styles.stapleBadgeText}>MOST WORN STAPLE</Text>
              </View>
              <Text style={styles.stapleName}>{stats.mostWornItem.name}</Text>
              <Text style={styles.stapleSub}>
                Worn {stats.mostWornItem.timesWorn} times • {stats.mostWornItem.category}
              </Text>
            </View>
          </View>
        )}

        {/* Category Breakdown */}
        <Text style={styles.sectionHeading}>CLOSET COMPOSITION</Text>
        <View style={styles.compositionCard}>
          {Object.entries(stats.categoryBreakdown).map(([category, count]) => (
            <View key={category} style={styles.compRow}>
              <Text style={styles.compCategory}>{category}</Text>
              <View style={styles.compBarWrapper}>
                <View
                  style={[
                    styles.compBarFill,
                    {
                      width: `${Math.round(
                        (count / Math.max(stats.totalItems, 1)) * 100
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.compCount}>{count}</Text>
            </View>
          ))}
        </View>

        {/* Style Preferences */}
        <Text style={styles.sectionHeading}>STYLE PALETTE</Text>
        <View style={styles.card}>
          <View style={styles.paletteHeader}>
            <Palette size={16} color={Colors.accent} />
            <Text style={styles.paletteTitle}>Primary Color Harmony</Text>
          </View>
          <View style={styles.chipsRow}>
            {user.primaryColors.map((colorName) => (
              <View key={colorName} style={styles.chip}>
                <Text style={styles.chipText}>{colorName}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* App Settings */}
        <Text style={styles.sectionHeading}>APP SETTINGS</Text>
        <View style={styles.card}>
          {/* Notification Setting */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIconWrap}>
                <Bell size={18} color={Colors.text} />
              </View>
              <View>
                <Text style={styles.settingTitle}>Morning Outfit Prompt</Text>
                <Text style={styles.settingSub}>
                  Get today&apos;s curated combo at 7:30 AM
                </Text>
              </View>
            </View>
            <Switch
              value={user.notificationsEnabled}
              onValueChange={(val) =>
                updateUserProfile({ notificationsEnabled: val })
              }
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.surface}
            />
          </View>

          <View style={styles.divider} />

          {/* Weather Sync Setting */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIconWrap}>
                <CloudSun size={18} color={Colors.text} />
              </View>
              <View>
                <Text style={styles.settingTitle}>Weather-Smart Layering</Text>
                <Text style={styles.settingSub}>
                  Sync real-time temperature with outfit suggestions
                </Text>
              </View>
            </View>
            <Switch
              value={user.weatherSync}
              onValueChange={(val) => updateUserProfile({ weatherSync: val })}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.surface}
            />
          </View>
        </View>

        {/* App Version Info */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerVersion}>WearWise v2.0.0</Text>
          <Text style={styles.footerSub}>
            AI Smart Wardrobe &amp; Outfit Planner
          </Text>
        </View>
      </ScrollView>
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
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
  avatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.round,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.text,
  },
  userEmail: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
    marginBottom: 6,
  },
  personaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FAF5EA',
    borderWidth: 1,
    borderColor: '#E6D7B8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.round,
    alignSelf: 'flex-start',
  },
  personaText: {
    fontSize: Typography.fontSize.xs - 1,
    fontWeight: '700',
    color: '#8A5D0E',
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  metricBox: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  metricLabel: {
    fontSize: Typography.fontSize.xs - 1,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  stapleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  stapleImage: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceSecondary,
  },
  stapleInfo: {
    flex: 1,
  },
  stapleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  stapleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  stapleName: {
    fontSize: Typography.fontSize.sm + 1,
    fontWeight: '700',
    color: Colors.text,
  },
  stapleSub: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  compositionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compCategory: {
    width: 90,
    fontSize: Typography.fontSize.xs + 1,
    fontWeight: '600',
    color: Colors.text,
  },
  compBarWrapper: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.round,
    marginHorizontal: Spacing.md,
    overflow: 'hidden',
  },
  compBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.round,
  },
  compCount: {
    width: 24,
    textAlign: 'right',
    fontSize: Typography.fontSize.xs + 1,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  paletteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  paletteTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    paddingRight: Spacing.md,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.round,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  settingSub: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  footerInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: 2,
  },
  footerVersion: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  footerSub: {
    fontSize: Typography.fontSize.xs - 1,
    color: Colors.textMuted,
  },
});
