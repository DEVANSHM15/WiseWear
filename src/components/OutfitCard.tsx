import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Bookmark,
  Check,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react-native';
import { Colors, Radius, Spacing, Typography } from '@/theme/colors';
import { Outfit } from '@/types/wardrobe';

interface OutfitCardProps {
  outfit: Outfit;
  onSave?: () => void;
  onMarkWorn?: () => void;
  onGenerateAnother?: () => void;
  showShuffleButton?: boolean;
}

export const OutfitCard: React.FC<OutfitCardProps> = ({
  outfit,
  onSave,
  onMarkWorn,
  onGenerateAnother,
  showShuffleButton = true,
}) => {
  const unwornItemsInOutfit = outfit.items.filter((i) => i.timesWorn === 0);

  return (
    <View style={styles.card}>
      {/* Header with Vibe & Compatibility Score */}
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.vibeTag}>{outfit.styleVibe}</Text>
          <Text style={styles.title}>{outfit.name}</Text>
        </View>

        {/* Compatibility Score Badge */}
        <View style={styles.scoreBadge}>
          <Sparkles size={13} color="#9E6E16" />
          <Text style={styles.scoreText}>{outfit.compatibilityScore}% Match</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>{outfit.description}</Text>

      {/* Unworn Spotlight Alert if contains never worn items */}
      {unwornItemsInOutfit.length > 0 && (
        <View style={styles.unwornAlert}>
          <Sparkles size={14} color="#A87C39" />
          <Text style={styles.unwornAlertText}>
            Includes {unwornItemsInOutfit.length} never-worn piece
            {unwornItemsInOutfit.length > 1 ? 's' : ''} to boost your rotation!
          </Text>
        </View>
      )}

      {/* Clothing Items Grid / Collage */}
      <View style={styles.itemsGrid}>
        {outfit.items.map((item, index) => (
          <View key={`${item.id}-${index}`} style={styles.itemSlot}>
            <View style={styles.itemImageWrapper}>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.itemImage}
                resizeMode="cover"
              />
              {item.timesWorn === 0 && (
                <View style={styles.unwornMiniBadge}>
                  <Text style={styles.unwornMiniText}>New</Text>
                </View>
              )}
            </View>
            <Text style={styles.itemCategory}>{item.category}</Text>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
        ))}
      </View>

      {/* Stylist Note */}
      {outfit.stylistNote && (
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>AI STYLIST NOTE</Text>
          <Text style={styles.noteText}>{outfit.stylistNote}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {/* Save Outfit Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onSave}
          style={[styles.button, outfit.isSaved ? styles.buttonSaved : styles.buttonOutline]}>
          <Bookmark
            size={16}
            color={outfit.isSaved ? Colors.textInverse : Colors.text}
            fill={outfit.isSaved ? Colors.textInverse : 'none'}
          />
          <Text
            style={[
              styles.buttonText,
              outfit.isSaved ? styles.buttonTextSaved : styles.buttonTextOutline,
            ]}>
            {outfit.isSaved ? 'Saved' : 'Save Look'}
          </Text>
        </TouchableOpacity>

        {/* Mark as Worn Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onMarkWorn}
          disabled={outfit.isWorn}
          style={[
            styles.button,
            outfit.isWorn ? styles.buttonWorn : styles.buttonPrimary,
          ]}>
          {outfit.isWorn ? (
            <>
              <CheckCircle2 size={16} color={Colors.success} />
              <Text style={styles.buttonTextWorn}>Worn Today</Text>
            </>
          ) : (
            <>
              <Check size={16} color={Colors.textInverse} />
              <Text style={styles.buttonTextPrimary}>Wear This</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Generate Another Button */}
        {showShuffleButton && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onGenerateAnother}
            style={[styles.button, styles.buttonIconOnly]}>
            <RefreshCw size={17} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  vibeTag: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  title: {
    fontSize: Typography.fontSize.lg + 1,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentSubtle,
    borderColor: '#E6D7B8',
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.round,
  },
  scoreText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
    color: '#8A5D0E',
  },
  description: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  unwornAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAF5EA',
    borderColor: '#EBDCB9',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  unwornAlertText: {
    fontSize: Typography.fontSize.xs + 1,
    fontWeight: '600',
    color: '#7D581A',
    flex: 1,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  itemSlot: {
    flex: 1,
    minWidth: '22%',
    alignItems: 'flex-start',
  },
  itemImageWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 6,
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  unwornMiniBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#B87A00',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  unwornMiniText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textInverse,
  },
  itemCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  itemName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  noteBox: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    marginBottom: Spacing.lg,
  },
  noteLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  noteText: {
    fontSize: Typography.fontSize.xs + 1,
    color: Colors.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md - 2,
    borderRadius: Radius.round,
  },
  buttonPrimary: {
    flex: 1.2,
    backgroundColor: Colors.primary,
  },
  buttonOutline: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonSaved: {
    flex: 1,
    backgroundColor: Colors.accent,
  },
  buttonWorn: {
    flex: 1.2,
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  buttonIconOnly: {
    width: 44,
    height: 44,
    paddingVertical: 0,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  buttonTextPrimary: {
    color: Colors.textInverse,
  },
  buttonTextOutline: {
    color: Colors.text,
  },
  buttonTextSaved: {
    color: Colors.textInverse,
  },
  buttonTextWorn: {
    color: Colors.success,
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
});
