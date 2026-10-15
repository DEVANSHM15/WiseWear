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
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Check,
  ImageIcon,
  RefreshCw,
  UploadCloud,
  X,
} from 'lucide-react-native';
import { Colors, Radius, Spacing, Typography } from '@/theme/colors';
import {
  AvailabilityStatus,
  ClothingCategory,
  ClothingPattern,
  ClothingSeason,
  ClothingStyle,
  CreateClothingItemInput,
} from '@/types/wardrobe';

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: CreateClothingItemInput) => Promise<unknown>;
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

const PATTERNS: ClothingPattern[] = ['plain', 'striped', 'checked', 'printed', 'other'];
const STYLES: ClothingStyle[] = ['casual', 'formal', 'sporty', 'ethnic', 'other'];
const SEASONS: ClothingSeason[] = ['all-season', 'summer', 'winter', 'monsoon', 'other'];
const STATUSES: AvailabilityStatus[] = ['available', 'laundry', 'unavailable'];

const PRESET_SAMPLE_PHOTOS = [
  {
    name: 'Oxford Button-Down',
    category: 'Shirts' as ClothingCategory,
    color: 'Pure White',
    url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Heavyweight Supima Tee',
    category: 'T-shirts' as ClothingCategory,
    color: 'Sand Beige',
    url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Single Pleat Trousers',
    category: 'Trousers' as ClothingCategory,
    color: 'Oatmeal',
    url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Raw Selvedge Denim',
    category: 'Jeans' as ClothingCategory,
    color: 'Deep Indigo',
    url: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Minimal White Sneakers',
    category: 'Shoes and footwear' as ClothingCategory,
    color: 'Off-White',
    url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Harrington Bomber',
    category: 'Jackets and outerwear' as ClothingCategory,
    color: 'Midnight Navy',
    url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
  },
];

export const AddItemModal: React.FC<AddItemModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClothingCategory>('Shirts');
  const [subcategory, setSubcategory] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [pattern, setPattern] = useState<ClothingPattern>('plain');
  const [style, setStyle] = useState<ClothingStyle>('casual');
  const [season, setSeason] = useState<ClothingSeason>('all-season');
  const [formality, setFormality] = useState<number>(2);
  const [brand, setBrand] = useState('');
  const [notes, setNotes] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('available');

  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Pick photo from phone photo library
  const pickFromGallery = async () => {
    try {
      setErrorMessage('');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow gallery access to pick photos of your clothes.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Gallery pick error:', err);
      setErrorMessage('Could not open photo gallery.');
    }
  };

  // 2. Capture photo using phone camera
  const captureWithCamera = async () => {
    try {
      setErrorMessage('');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow camera access to take photos of your clothes.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Camera error:', err);
      setErrorMessage('Could not open camera.');
    }
  };

  const handleReset = () => {
    setSelectedImageUri(null);
    setName('');
    setCategory('Shirts');
    setSubcategory('');
    setPrimaryColor('');
    setPattern('plain');
    setStyle('casual');
    setSeason('all-season');
    setFormality(2);
    setBrand('');
    setNotes('');
    setAvailabilityStatus('available');
    setErrorMessage('');
    setIsUploading(false);
  };

  const handleSubmit = async () => {
    if (!selectedImageUri) {
      setErrorMessage('Please capture or select a photo of your clothing item.');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Please give your clothing item a name.');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');

    try {
      await onAdd({
        name: name.trim(),
        category,
        subcategory: subcategory.trim() || null,
        imageUri: selectedImageUri,
        primaryColor: primaryColor.trim() || 'Neutral',
        secondaryColors: [],
        pattern,
        style,
        season,
        formality,
        brand: brand.trim() || null,
        notes: notes.trim() || null,
        availabilityStatus,
      });

      handleReset();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Add Clothing</Text>
              <Text style={styles.modalSubtitle}>
                Add to your persistent digital wardrobe
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={isUploading}>
              <X size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {/* Error banner */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Photo Capture & Preview Section */}
            <Text style={styles.inputLabel}>GARMENT PHOTO</Text>
            {selectedImageUri ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
                <View style={styles.previewActions}>
                  <TouchableOpacity
                    style={styles.changePhotoBtn}
                    onPress={pickFromGallery}>
                    <RefreshCw size={14} color={Colors.text} />
                    <Text style={styles.changePhotoText}>Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => setSelectedImageUri(null)}>
                    <X size={14} color={Colors.danger} />
                    <Text style={styles.removePhotoText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.captureButtonsRow}>
                <TouchableOpacity
                  style={styles.captureActionCard}
                  activeOpacity={0.8}
                  onPress={captureWithCamera}>
                  <View style={styles.captureIconCircle}>
                    <Camera size={24} color={Colors.primary} />
                  </View>
                  <Text style={styles.captureTitle}>Take Photo</Text>
                  <Text style={styles.captureSub}>Use phone camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.captureActionCard}
                  activeOpacity={0.8}
                  onPress={pickFromGallery}>
                  <View style={styles.captureIconCircle}>
                    <ImageIcon size={24} color={Colors.primary} />
                  </View>
                  <Text style={styles.captureTitle}>Photo Library</Text>
                  <Text style={styles.captureSub}>Pick from album</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Sample presets for fast testing */}
            <Text style={styles.inputLabel}>OR CHOOSE A SAMPLE PRESET</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetScroll}>
              {PRESET_SAMPLE_PHOTOS.map((preset, idx) => {
                const isSelected = selectedImageUri === preset.url;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      setSelectedImageUri(preset.url);
                      setCategory(preset.category);
                      if (!name) setName(preset.name);
                      if (!primaryColor) setPrimaryColor(preset.color);
                    }}
                    style={[
                      styles.presetCard,
                      isSelected ? styles.presetCardSelected : null,
                    ]}>
                    <Image source={{ uri: preset.url }} style={styles.presetImg} />
                    {isSelected && (
                      <View style={styles.presetCheck}>
                        <Check size={11} color={Colors.textInverse} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Category selection */}
            <Text style={styles.inputLabel}>CATEGORY *</Text>
            <View style={styles.categoryChips}>
              {CATEGORIES.map((cat) => {
                const isCatSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.catChip,
                      isCatSelected ? styles.catChipActive : styles.catChipInactive,
                    ]}>
                    <Text
                      style={[
                        styles.catChipText,
                        isCatSelected
                          ? styles.catChipTextActive
                          : styles.catChipTextInactive,
                      ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Item Name */}
            <Text style={styles.inputLabel}>ITEM NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Oxford Cotton Button-Down"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            {/* Subcategory */}
            <Text style={styles.inputLabel}>SUBCATEGORY (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Button-down, Polo, Oversized tee, Chino"
              placeholderTextColor={Colors.textMuted}
              value={subcategory}
              onChangeText={setSubcategory}
            />

            {/* Primary Color */}
            <Text style={styles.inputLabel}>PRIMARY COLOR</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Chalk White, Navy Blue, Dark Olive"
              placeholderTextColor={Colors.textMuted}
              value={primaryColor}
              onChangeText={setPrimaryColor}
            />

            {/* Pattern */}
            <Text style={styles.inputLabel}>PATTERN</Text>
            <View style={styles.categoryChips}>
              {PATTERNS.map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPattern(p)}
                  style={[
                    styles.catChip,
                    pattern === p ? styles.catChipActive : styles.catChipInactive,
                  ]}>
                  <Text
                    style={[
                      styles.catChipText,
                      pattern === p ? styles.catChipTextActive : styles.catChipTextInactive,
                    ]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Style */}
            <Text style={styles.inputLabel}>STYLE</Text>
            <View style={styles.categoryChips}>
              {STYLES.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStyle(s)}
                  style={[
                    styles.catChip,
                    style === s ? styles.catChipActive : styles.catChipInactive,
                  ]}>
                  <Text
                    style={[
                      styles.catChipText,
                      style === s ? styles.catChipTextActive : styles.catChipTextInactive,
                    ]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Season */}
            <Text style={styles.inputLabel}>SEASON</Text>
            <View style={styles.categoryChips}>
              {SEASONS.map((se) => (
                <TouchableOpacity
                  key={se}
                  onPress={() => setSeason(se)}
                  style={[
                    styles.catChip,
                    season === se ? styles.catChipActive : styles.catChipInactive,
                  ]}>
                  <Text
                    style={[
                      styles.catChipText,
                      season === se ? styles.catChipTextActive : styles.catChipTextInactive,
                    ]}>
                    {se}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Formality (1 - 5) */}
            <Text style={styles.inputLabel}>FORMALITY (1: LOUNGEWEAR — 5: BLACK TIE)</Text>
            <View style={styles.categoryChips}>
              {[1, 2, 3, 4, 5].map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setFormality(level)}
                  style={[
                    styles.catChip,
                    formality === level ? styles.catChipActive : styles.catChipInactive,
                  ]}>
                  <Text
                    style={[
                      styles.catChipText,
                      formality === level ? styles.catChipTextActive : styles.catChipTextInactive,
                    ]}>
                    Level {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Brand */}
            <Text style={styles.inputLabel}>BRAND (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Uniqlo, Arket, COS, Levi's"
              placeholderTextColor={Colors.textMuted}
              value={brand}
              onChangeText={setBrand}
            />

            {/* Availability */}
            <Text style={styles.inputLabel}>AVAILABILITY STATUS</Text>
            <View style={styles.categoryChips}>
              {STATUSES.map((st) => (
                <TouchableOpacity
                  key={st}
                  onPress={() => setAvailabilityStatus(st)}
                  style={[
                    styles.catChip,
                    availabilityStatus === st ? styles.catChipActive : styles.catChipInactive,
                  ]}>
                  <Text
                    style={[
                      styles.catChipText,
                      availabilityStatus === st ? styles.catChipTextActive : styles.catChipTextInactive,
                    ]}>
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <Text style={styles.inputLabel}>NOTES (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              multiline
              placeholder="Care instructions, fit notes, styling ideas..."
              placeholderTextColor={Colors.textMuted}
              value={notes}
              onChangeText={setNotes}
            />

            {/* Save Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={isUploading || !selectedImageUri || !name.trim()}
              style={[
                styles.saveButton,
                (!selectedImageUri || !name.trim() || isUploading) ? styles.saveButtonDisabled : null,
              ]}>
              {isUploading ? (
                <>
                  <ActivityIndicator color={Colors.textInverse} size="small" />
                  <Text style={styles.saveButtonText}>Saving Garment...</Text>
                </>
              ) : (
                <>
                  <UploadCloud size={18} color={Colors.textInverse} />
                  <Text style={styles.saveButtonText}>Save to Digital Wardrobe</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    maxHeight: '92%',
    paddingBottom: Spacing.xxxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.sm,
    borderRadius: Radius.round,
    backgroundColor: Colors.surfaceSecondary,
  },
  scrollBody: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  errorBox: {
    backgroundColor: Colors.dangerLight,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.danger,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  captureButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  captureActionCard: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  captureIconCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  captureTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  captureSub: {
    fontSize: Typography.fontSize.xs - 1,
    color: Colors.textMuted,
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 1.2,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewActions: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.round,
  },
  changePhotoText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  removePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.round,
  },
  removePhotoText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.danger,
  },
  presetScroll: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  presetCard: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  presetCardSelected: {
    borderColor: Colors.primary,
  },
  presetImg: {
    width: '100%',
    height: '100%',
  },
  presetCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.round,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.round,
    borderWidth: 1,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catChipInactive: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
  },
  catChipText: {
    fontSize: Typography.fontSize.xs + 1,
    fontWeight: '600',
  },
  catChipTextActive: {
    color: Colors.textInverse,
  },
  catChipTextInactive: {
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.round,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.textInverse,
  },
});
