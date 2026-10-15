import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/theme/colors';
import { ClothingCategory } from '@/types/wardrobe';

interface CategoryFilterBarProps {
  categories: (ClothingCategory | 'All')[];
  selectedCategory: ClothingCategory | 'All';
  onSelectCategory: (category: ClothingCategory | 'All') => void;
  categoryCounts?: Record<string, number>;
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          const count = categoryCounts ? categoryCounts[cat] : undefined;

          return (
            <TouchableOpacity
              key={cat}
              onPress={() => onSelectCategory(cat)}
              activeOpacity={0.7}
              style={[
                styles.pill,
                isSelected ? styles.pillSelected : styles.pillDefault,
              ]}>
              <Text
                style={[
                  styles.pillText,
                  isSelected ? styles.pillTextSelected : styles.pillTextDefault,
                ]}>
                {cat}
              </Text>
              {count !== undefined && (
                <View
                  style={[
                    styles.countBadge,
                    isSelected ? styles.countBadgeSelected : styles.countBadgeDefault,
                  ]}>
                  <Text
                    style={[
                      styles.countText,
                      isSelected ? styles.countTextSelected : styles.countTextDefault,
                    ]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: Spacing.sm,
  },
  container: {
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.round,
    borderWidth: 1,
  },
  pillDefault: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  pillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  pillTextDefault: {
    color: Colors.textSecondary,
  },
  pillTextSelected: {
    color: Colors.textInverse,
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.round,
  },
  countBadgeDefault: {
    backgroundColor: Colors.surfaceSecondary,
  },
  countBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countText: {
    fontSize: Typography.fontSize.xs - 1,
    fontWeight: '700',
  },
  countTextDefault: {
    color: Colors.textMuted,
  },
  countTextSelected: {
    color: Colors.textInverse,
  },
});
