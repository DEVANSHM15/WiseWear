import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertCircle,
  Check,
  Edit3,
  Save,
  Trash2,
  WashingMachine,
  X,
} from 'lucide-react-native';
import { Colors, Radius, Spacing, Typography } from '@/theme/colors';
import {
  AvailabilityStatus,
  ClothingCategory,
  ClothingItem,
  UpdateClothingItemInput,
} from '@/types/wardrobe';

interface ClothingDetailModalProps {
  item: ClothingItem | null;
  visible: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: UpdateClothingItemInput) => Promise<unknown>;
  onDelete: (id: string) => Promise<void>;
}

const CATEGORIES: ClothingCategory[] = [
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

export const ClothingDetailModal: React.FC<ClothingDetailModalProps> = ({
  item,
  visible,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit form state
  const [name, setName] = useState(item?.name || '');
  const [category, setCategory] = useState<ClothingCategory>(item?.category || 'Shirts');
  const [subcategory, setSubcategory] = useState(item?.subcategory || '');
  const [primaryColor, setPrimaryColor] = useState(item?.primaryColor || item?.color || '');
  const [brand, setBrand] = useState(item?.brand || '');
  const [notes, setNotes] = useState(item?.notes || '');
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>(
    item?.availabilityStatus || 'available'
  );

  // Sync state when item changes
  React.useEffect(() => {
    if (item) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(item.name);
      setCategory(item.category);
      setSubcategory(item.subcategory || '');
      setPrimaryColor(item.primaryColor || item.color || '');
      setBrand(item.brand || '');
      setNotes(item.notes || '');
      setAvailabilityStatus(item.availabilityStatus || (item.inLaundry ? 'laundry' : 'available'));
      setIsEditing(false);
    }
  }, [item]);

  if (!item) return null;

  const handleSaveEdit = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Item name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(item.id, {
        name: name.trim(),
        category,
        subcategory: subcategory.trim() || null,
        primaryColor: primaryColor.trim() || null,
        brand: brand.trim() || null,
        notes: notes.trim() || null,
        availabilityStatus,
      });
      setIsEditing(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update item.';
      Alert.alert('Error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePrompt = () => {
    Alert.alert(
      'Delete Clothing Item',
      `Are you sure you want to permanently delete "${item.name}" from your wardrobe?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await onDelete(item.id);
              onClose();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Failed to delete item.';
              Alert.alert('Error', msg);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleQuickAvailabilityChange = async (newStatus: AvailabilityStatus) => {
    setAvailabilityStatus(newStatus);
    try {
      await onUpdate(item.id, { availabilityStatus: newStatus });
    } catch (err) {
      console.warn('Failed to update status:', err);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Top Image Preview */}
          <View style={styles.imageWrap}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={isDeleting}>
              <X size={18} color={Colors.text} />
            </TouchableOpacity>

            {/* Edit / View Toggle */}
            <TouchableOpacity
              style={styles.editToggleBtn}
              onPress={() => setIsEditing(!isEditing)}
              disabled={isDeleting}>
              <Edit3 size={15} color={Colors.text} />
              <Text style={styles.editToggleText}>{isEditing ? 'Cancel Edit' : 'Edit Details'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {isEditing ? (
              /* ================= EDIT MODE ================= */
              <View style={styles.editForm}>
                <Text style={styles.editHeaderTitle}>Edit Garment Details</Text>

                <Text style={styles.label}>NAME</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Item Name"
                />

                <Text style={styles.label}>CATEGORY</Text>
                <View style={styles.categoryChips}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.chip,
                        category === cat ? styles.chipActive : styles.chipInactive,
                      ]}>
                      <Text
                        style={[
                          styles.chipText,
                          category === cat ? styles.chipTextActive : styles.chipTextInactive,
                        ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>SUBCATEGORY</Text>
                <TextInput
                  style={styles.input}
                  value={subcategory}
                  onChangeText={setSubcategory}
                  placeholder="e.g. Button-down, Chino"
                />

                <Text style={styles.label}>PRIMARY COLOR</Text>
                <TextInput
                  style={styles.input}
                  value={primaryColor}
                  onChangeText={setPrimaryColor}
                  placeholder="e.g. Chalk White"
                />

                <Text style={styles.label}>BRAND</Text>
                <TextInput
                  style={styles.input}
                  value={brand}
                  onChangeText={setBrand}
                  placeholder="e.g. Uniqlo, Arket"
                />

                <Text style={styles.label}>AVAILABILITY</Text>
                <View style={styles.categoryChips}>
                  {(['available', 'laundry', 'unavailable'] as AvailabilityStatus[]).map((st) => (
                    <TouchableOpacity
                      key={st}
                      onPress={() => setAvailabilityStatus(st)}
                      style={[
                        styles.chip,
                        availabilityStatus === st ? styles.chipActive : styles.chipInactive,
                      ]}>
                      <Text
                        style={[
                          styles.chipText,
                          availabilityStatus === st ? styles.chipTextActive : styles.chipTextInactive,
                        ]}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>NOTES</Text>
                <TextInput
                  style={[styles.input, { height: 60 }]}
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Care notes, fit instructions..."
                />

                <TouchableOpacity
                  style={styles.saveChangesBtn}
                  onPress={handleSaveEdit}
                  disabled={isSaving}>
                  {isSaving ? (
                    <ActivityIndicator color={Colors.textInverse} size="small" />
                  ) : (
                    <>
                      <Save size={16} color={Colors.textInverse} />
                      <Text style={styles.saveChangesText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* ================= VIEW MODE ================= */
              <View style={styles.viewBody}>
                <View style={styles.titleRow}>
                  <View style={styles.titleGroup}>
                    <Text style={styles.categoryBadge}>{item.category}</Text>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.subcategory && (
                      <Text style={styles.itemSubcategory}>{item.subcategory}</Text>
                    )}
                  </View>
                </View>

                {/* Quick Availability Toggles */}
                <Text style={styles.sectionHeading}>AVAILABILITY STATUS</Text>
                <View style={styles.statusRow}>
                  <TouchableOpacity
                    style={[
                      styles.statusPill,
                      item.availabilityStatus === 'available' ? styles.statusPillAvailableActive : null,
                    ]}
                    onPress={() => handleQuickAvailabilityChange('available')}>
                    <Check size={14} color={item.availabilityStatus === 'available' ? Colors.success : Colors.textSecondary} />
                    <Text style={[styles.statusPillText, item.availabilityStatus === 'available' ? styles.statusPillTextAvailable : null]}>
                      Available
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusPill,
                      item.availabilityStatus === 'laundry' ? styles.statusPillLaundryActive : null,
                    ]}
                    onPress={() => handleQuickAvailabilityChange('laundry')}>
                    <WashingMachine size={14} color={item.availabilityStatus === 'laundry' ? '#8A5D0E' : Colors.textSecondary} />
                    <Text style={[styles.statusPillText, item.availabilityStatus === 'laundry' ? styles.statusPillTextLaundry : null]}>
                      In Laundry
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusPill,
                      item.availabilityStatus === 'unavailable' ? styles.statusPillUnavailableActive : null,
                    ]}
                    onPress={() => handleQuickAvailabilityChange('unavailable')}>
                    <AlertCircle size={14} color={item.availabilityStatus === 'unavailable' ? Colors.danger : Colors.textSecondary} />
                    <Text style={[styles.statusPillText, item.availabilityStatus === 'unavailable' ? styles.statusPillTextUnavailable : null]}>
                      Stored / Away
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Structured Metadata Grid */}
                <Text style={styles.sectionHeading}>GARMENT ATTRIBUTES</Text>
                <View style={styles.attrGrid}>
                  <View style={styles.attrBox}>
                    <Text style={styles.attrLabel}>COLOR</Text>
                    <Text style={styles.attrValue}>{item.primaryColor || item.color || 'Neutral'}</Text>
                  </View>
                  <View style={styles.attrBox}>
                    <Text style={styles.attrLabel}>BRAND</Text>
                    <Text style={styles.attrValue}>{item.brand || 'Unspecified'}</Text>
                  </View>
                  <View style={styles.attrBox}>
                    <Text style={styles.attrLabel}>PATTERN</Text>
                    <Text style={styles.attrValue}>{item.pattern || 'Plain'}</Text>
                  </View>
                  <View style={styles.attrBox}>
                    <Text style={styles.attrLabel}>STYLE</Text>
                    <Text style={styles.attrValue}>{item.style || 'Casual'}</Text>
                  </View>
                  <View style={styles.attrBox}>
                    <Text style={styles.attrLabel}>SEASON</Text>
                    <Text style={styles.attrValue}>{typeof item.season === 'string' ? item.season : 'All-season'}</Text>
                  </View>
                  <View style={styles.attrBox}>
                    <Text style={styles.attrLabel}>FORMALITY</Text>
                    <Text style={styles.attrValue}>
                      {item.formality ? `Level ${item.formality}/5` : 'Level 2/5'}
                    </Text>
                  </View>
                </View>

                {/* Wear Metrics */}
                <Text style={styles.sectionHeading}>USAGE & WEAR HISTORY</Text>
                <View style={styles.metricsRow}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricVal}>{item.timesWorn}</Text>
                    <Text style={styles.metricSub}>Recorded Wears</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricVal}>
                      {item.lastWornAt ? item.lastWornAt.split('T')[0] : (item.lastWornDate || 'Never')}
                    </Text>
                    <Text style={styles.metricSub}>Last Worn</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricVal}>{item.createdAt || 'Recent'}</Text>
                    <Text style={styles.metricSub}>Date Added</Text>
                  </View>
                </View>

                {/* Notes if present */}
                {item.notes ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>NOTES</Text>
                    <Text style={styles.notesText}>{item.notes}</Text>
                  </View>
                ) : null}

                {/* Delete Garment Action */}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={handleDeletePrompt}
                  disabled={isDeleting}>
                  {isDeleting ? (
                    <ActivityIndicator color={Colors.danger} size="small" />
                  ) : (
                    <>
                      <Trash2 size={16} color={Colors.danger} />
                      <Text style={styles.deleteBtnText}>Delete Item from Wardrobe</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    height: 240,
    position: 'relative',
    backgroundColor: Colors.surfaceSecondary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: Radius.round,
    padding: 6,
  },
  editToggleBtn: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: Radius.round,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editToggleText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollBody: {
    padding: Spacing.xl,
  },
  viewBody: {
    gap: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleGroup: {
    flex: 1,
  },
  categoryBadge: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  itemName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  itemSubcategory: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginTop: Spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusPillAvailableActive: {
    backgroundColor: Colors.successLight,
    borderColor: '#C8E6C9',
  },
  statusPillLaundryActive: {
    backgroundColor: '#FAF5EA',
    borderColor: '#E6D7B8',
  },
  statusPillUnavailableActive: {
    backgroundColor: Colors.dangerLight,
    borderColor: '#FFCDD2',
  },
  statusPillText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  statusPillTextAvailable: {
    color: Colors.success,
  },
  statusPillTextLaundry: {
    color: '#8A5D0E',
  },
  statusPillTextUnavailable: {
    color: Colors.danger,
  },
  attrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  attrBox: {
    width: '48%',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  attrLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  attrValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.text,
  },
  metricSub: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
  },
  notesBox: {
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  notesLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  notesText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.round,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  deleteBtnText: {
    fontSize: Typography.fontSize.xs + 1,
    fontWeight: '700',
    color: Colors.danger,
  },
  editForm: {
    gap: Spacing.sm,
  },
  editHeaderTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: 4,
  },
  input: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.round,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipInactive: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
  },
  chipText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.textInverse,
  },
  chipTextInactive: {
    color: Colors.textSecondary,
  },
  saveChangesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.round,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
  },
  saveChangesText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
});
