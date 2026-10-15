import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { Colors, Radius, Spacing, Typography } from '@/theme/colors';
import { ClothingItem } from '@/types/wardrobe';

interface ClothingCardProps {
  item: ClothingItem;
  onPress?: () => void;
  onToggleLaundry?: () => void;
}

export const ClothingCard: React.FC<ClothingCardProps> = ({
  item,
  onPress,
  onToggleLaundry,
}) => {
  const isNeverWorn = item.timesWorn === 0;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Never Worn Tag */}
        {isNeverWorn && (
          <View style={styles.neverWornBadge}>
            <Sparkles size={11} color="#B87A00" />
            <Text style={styles.neverWornText}>Never Worn</Text>
          </View>
        )}

        {/* Laundry Tag if true */}
        {item.inLaundry && (
          <View style={styles.laundryBadge}>
            <Text style={styles.laundryText}>In Laundry</Text>
          </View>
        )}

        {/* Wear count pill */}
        {!isNeverWorn && (
          <View style={styles.wearCountBadge}>
            <Text style={styles.wearCountText}>{item.timesWorn}x</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.metaRow}>
          <Text style={styles.category}>{item.category}</Text>
          {item.brand && <Text style={styles.brand}>{item.brand}</Text>}
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.colorRow}>
          {item.colorHex ? (
            <View
              style={[
                styles.colorDot,
                { backgroundColor: item.colorHex },
                item.colorHex === '#FFFFFF' || item.colorHex === '#FAFAFA'
                  ? styles.whiteBorder
                  : null,
              ]}
            />
          ) : null}
          <Text style={styles.colorText} numberOfLines={1}>
            {item.color}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: Spacing.md,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 0.95,
    backgroundColor: Colors.surfaceSecondary,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  neverWornBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.warningLight,
    borderColor: '#F0D499',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.round,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  neverWornText: {
    fontSize: Typography.fontSize.xs - 1,
    fontWeight: '700',
    color: '#936100',
    letterSpacing: 0.2,
  },
  laundryBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(28, 26, 24, 0.85)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  laundryText: {
    fontSize: Typography.fontSize.xs - 1,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  wearCountBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  wearCountText: {
    fontSize: Typography.fontSize.xs - 1,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  content: {
    padding: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  category: {
    fontSize: Typography.fontSize.xs,
    color: Colors.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  brand: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  name: {
    fontSize: Typography.fontSize.sm + 1,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  colorDot: {
    width: 9,
    height: 9,
    borderRadius: Radius.round,
  },
  whiteBorder: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  colorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
