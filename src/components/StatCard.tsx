import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/theme/colors';

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  progress?: number; // 0 to 100
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sublabel,
  icon,
  progress,
  accentColor,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{label}</Text>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
      </View>
      <Text style={[styles.value, accentColor ? { color: accentColor } : null]}>
        {value}
      </Text>
      {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
      {progress !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(100, Math.max(0, progress))}%`,
                  backgroundColor: accentColor || Colors.primary,
                },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
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
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconWrapper: {
    padding: 2,
  },
  value: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  sublabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  progressContainer: {
    marginTop: Spacing.sm,
  },
  progressTrack: {
    height: 5,
    borderRadius: Radius.round,
    backgroundColor: Colors.surfaceSecondary,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: Radius.round,
  },
});
