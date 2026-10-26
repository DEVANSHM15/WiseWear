import React, { useRef, useState } from 'react';
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
  AlertTriangle,
  Camera,
  Check,
  ImageIcon,
  Info,
  RefreshCw,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react-native';
import {
  analyzeClothingWithVision,
  isVisionAIAvailable,
} from '@/services/visionService';
import { Colors, Radius, Spacing, Typography } from '@/theme/colors';
import {
  AvailabilityStatus,
  ClothingCategory,
  ClothingPattern,
  ClothingSeason,
  ClothingStyle,
  CreateClothingItemInput,
} from '@/types/wardrobe';
import { createVisionThumbnail, optimizeClothingImage } from '@/utils/imageUtils';

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
    subcategory: 'Button-Down Shirt',
    color: 'Pure White',
    pattern: 'plain' as ClothingPattern,
    style: 'formal' as ClothingStyle,
    season: 'all-season' as ClothingSeason,
    formality: 3,
    url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Heavyweight Supima Tee',
    category: 'T-shirts' as ClothingCategory,
    subcategory: 'Crewneck Tee',
    color: 'Sand Beige',
    pattern: 'plain' as ClothingPattern,
    style: 'casual' as ClothingStyle,
    season: 'summer' as ClothingSeason,
    formality: 2,
    url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Single Pleat Trousers',
    category: 'Trousers' as ClothingCategory,
    subcategory: 'Pleated Chinos',
    color: 'Oatmeal',
    pattern: 'plain' as ClothingPattern,
    style: 'formal' as ClothingStyle,
    season: 'all-season' as ClothingSeason,
    formality: 4,
    url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Raw Selvedge Denim',
    category: 'Jeans' as ClothingCategory,
    subcategory: 'Straight-leg Jeans',
    color: 'Deep Indigo',
    pattern: 'plain' as ClothingPattern,
    style: 'casual' as ClothingStyle,
    season: 'all-season' as ClothingSeason,
    formality: 2,
    url: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Minimal White Sneakers',
    category: 'Shoes and footwear' as ClothingCategory,
    subcategory: 'Low-top Sneakers',
    color: 'Off-White',
    pattern: 'plain' as ClothingPattern,
    style: 'casual' as ClothingStyle,
    season: 'all-season' as ClothingSeason,
    formality: 2,
    url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Harrington Bomber',
    category: 'Jackets and outerwear' as ClothingCategory,
    subcategory: 'Lightweight Bomber',
    color: 'Midnight Navy',
    pattern: 'plain' as ClothingPattern,
    style: 'casual' as ClothingStyle,
    season: 'winter' as ClothingSeason,
    formality: 3,
    url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
  },
];

export const AddItemModal: React.FC<AddItemModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [cachedBase64, setCachedBase64] = useState<string | null>(null);

  // Form Fields
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

  // AI Recognition & Processing State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiDetected, setAiDetected] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [aiNoticeType, setAiNoticeType] = useState<'success' | 'info' | 'warning' | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // AbortController ref to allow instant skipping / cancellation of AI vision requests
  const visionAbortRef = useRef<AbortController | null>(null);

  const cancelVisionAnalysis = () => {
    if (visionAbortRef.current) {
      visionAbortRef.current.abort();
      visionAbortRef.current = null;
    }
    setIsAnalyzing(false);
  };

  /**
   * Run Vision AI recognition on an image (optimized for 2-3s turnaround)
   */
  const runVisionAnalysis = async (uri: string, base64?: string) => {
    // Abort any prior in-flight request
    if (visionAbortRef.current) {
      visionAbortRef.current.abort();
    }
    const abortCtrl = new AbortController();
    visionAbortRef.current = abortCtrl;

    setIsAnalyzing(true);
    setErrorMessage('');
    setAiNotice(null);
    setAiNoticeType(null);

    try {
      const hasKey = isVisionAIAvailable();
      if (!hasKey) {
        setIsAnalyzing(false);
        setAiDetected(false);
        setAiNotice(
          'Vision AI API key is not configured (add EXPO_PUBLIC_GEMINI_API_KEY in .env). Please enter garment details manually below.'
        );
        setAiNoticeType('info');
        return;
      }

      const result = await analyzeClothingWithVision({
        base64: base64 || undefined,
        uri,
        timeoutMs: 18000,
      });

      // If user aborted/skipped while request was in-flight, ignore result
      if (abortCtrl.signal.aborted) {
        return;
      }

      if (result.success && result.data) {
        // Automatically fill detected details into the form
        setCategory(result.data.category);
        setPrimaryColor(result.data.primaryColor);
        setPattern(result.data.pattern);
        setStyle(result.data.style);
        setSeason(result.data.season);
        setFormality(result.data.formality);

        if (result.data.name) setName(result.data.name);
        if (result.data.subcategory) setSubcategory(result.data.subcategory);
        if (result.data.brand) setBrand(result.data.brand);

        setAiDetected(true);
        setAiNotice(
          `✨ AI Identified: ${result.data.category} in ${result.data.primaryColor} (${result.data.pattern}, ${result.data.style}). Review and edit below.`
        );
        setAiNoticeType('success');
      } else if (result.isUnavailable) {
        setAiDetected(false);
        setAiNotice(
          'Vision AI is unavailable. Please enter garment details manually below.'
        );
        setAiNoticeType('info');
      } else {
        setAiDetected(false);
        setAiNotice(
          result.error ||
            'AI recognition could not identify this garment. Please fill in the details manually below.'
        );
        setAiNoticeType('warning');
      }
    } catch (err: unknown) {
      if (abortCtrl.signal.aborted) return;
      console.warn('[AddItemModal] Vision analysis failed:', err);
      setAiDetected(false);
      setAiNotice('AI recognition encountered an issue. You can enter all details manually below.');
      setAiNoticeType('warning');
    } finally {
      if (visionAbortRef.current === abortCtrl) {
        visionAbortRef.current = null;
      }
      setIsAnalyzing(false);
    }
  };

  /**
   * Process and optimize an image after picking/capturing:
   * Concurrently launches ~30ms thumbnail generation for instant ~2s Vision AI,
   * while running full 800px catalog compression for storage in the background.
   */
  const handleImagePicked = async (uri: string) => {
    try {
      setSelectedImageUri(uri);

      // Start full-res storage optimization in background
      const catalogOptimizePromise = optimizeClothingImage(uri).then((optimized) => {
        setSelectedImageUri(optimized.uri);
        setCachedBase64(optimized.base64 || null);
        return optimized;
      });

      // Ultra-fast path: create 384px thumbnail in ~30ms and fire Vision AI immediately
      const thumbBase64 = await createVisionThumbnail(uri);
      if (thumbBase64) {
        runVisionAnalysis(uri, thumbBase64);
      } else {
        // Fallback: wait for catalog optimization
        const opt = await catalogOptimizePromise;
        runVisionAnalysis(opt.uri, opt.base64);
      }

      await catalogOptimizePromise;
    } catch (err) {
      console.warn('[AddItemModal] Image optimization error:', err);
      runVisionAnalysis(uri);
    }
  };

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
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        await handleImagePicked(result.assets[0].uri);
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
        await handleImagePicked(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Camera error:', err);
      setErrorMessage('Could not open camera.');
    }
  };

  // 3. Choose a preset sample
  const handleSelectPreset = (preset: typeof PRESET_SAMPLE_PHOTOS[number]) => {
    setSelectedImageUri(preset.url);
    setCachedBase64(null);
    setName(preset.name);
    setCategory(preset.category);
    setSubcategory(preset.subcategory);
    setPrimaryColor(preset.color);
    setPattern(preset.pattern);
    setStyle(preset.style);
    setSeason(preset.season);
    setFormality(preset.formality);

    setAiDetected(true);
    setAiNotice(
      `✨ Auto-filled: ${preset.category} in ${preset.color} (${preset.pattern}, ${preset.style}, ${preset.season}). Review and edit details below.`
    );
    setAiNoticeType('success');
  };

  const handleReset = () => {
    setSelectedImageUri(null);
    setCachedBase64(null);
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
    setIsAnalyzing(false);
    setAiDetected(false);
    setAiNotice(null);
    setAiNoticeType(null);
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
                AI-powered garment recognition & digital cataloging
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                cancelVisionAnalysis();
                onClose();
              }}
              style={styles.closeBtn}
              disabled={isUploading}>
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

            {/* AI Vision Notice / Status Banner */}
            {aiNotice ? (
              <View
                style={[
                  styles.aiNoticeCard,
                  aiNoticeType === 'success'
                    ? styles.aiNoticeSuccess
                    : aiNoticeType === 'warning'
                    ? styles.aiNoticeWarning
                    : styles.aiNoticeInfo,
                ]}>
                <View style={styles.aiNoticeIconWrapper}>
                  {aiNoticeType === 'success' ? (
                    <Sparkles size={16} color={Colors.accent} />
                  ) : aiNoticeType === 'warning' ? (
                    <AlertTriangle size={16} color={Colors.warning} />
                  ) : (
                    <Info size={16} color={Colors.textSecondary} />
                  )}
                </View>
                <View style={styles.aiNoticeTextWrapper}>
                  <Text
                    style={[
                      styles.aiNoticeText,
                      aiNoticeType === 'success'
                        ? styles.aiNoticeTextSuccess
                        : aiNoticeType === 'warning'
                        ? styles.aiNoticeTextWarning
                        : styles.aiNoticeTextInfo,
                    ]}>
                    {aiNotice}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Photo Capture & Preview Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.inputLabel}>GARMENT PHOTO *</Text>
              {aiDetected && (
                <View style={styles.aiBadgePill}>
                  <Sparkles size={11} color={Colors.accent} />
                  <Text style={styles.aiBadgePillText}>AI Analyzed</Text>
                </View>
              )}
            </View>

            {selectedImageUri ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />

                {/* Loading overlay during AI analysis */}
                {isAnalyzing && (
                  <View style={styles.analyzingOverlay}>
                    <ActivityIndicator size="large" color={Colors.accent} />
                    <View style={styles.analyzingContent}>
                      <View style={styles.analyzingTitleRow}>
                        <Sparkles size={16} color={Colors.accent} />
                        <Text style={styles.analyzingTitle}>AI Auto-Detecting...</Text>
                      </View>
                      <Text style={styles.analyzingSub}>
                        Identifying category, color, pattern, style & season
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.skipAiBtn}
                      activeOpacity={0.8}
                      onPress={cancelVisionAnalysis}>
                      <Text style={styles.skipAiBtnText}>Skip / Enter Manually</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Photo action controls */}
                {!isAnalyzing && (
                  <View style={styles.previewActions}>
                    <TouchableOpacity
                      style={styles.changePhotoBtn}
                      onPress={async () => {
                        const thumb = await createVisionThumbnail(selectedImageUri);
                        runVisionAnalysis(selectedImageUri, thumb || cachedBase64 || undefined);
                      }}>
                      <Sparkles size={13} color={Colors.accent} />
                      <Text style={styles.changePhotoText}>Re-analyze</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.changePhotoBtn}
                      onPress={pickFromGallery}>
                      <RefreshCw size={13} color={Colors.text} />
                      <Text style={styles.changePhotoText}>Change</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removePhotoBtn}
                      onPress={() => {
                        setSelectedImageUri(null);
                        setCachedBase64(null);
                        setAiDetected(false);
                        setAiNotice(null);
                      }}>
                      <X size={13} color={Colors.danger} />
                      <Text style={styles.removePhotoText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
                  <Text style={styles.captureSub}>With AI auto-detection</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.captureActionCard}
                  activeOpacity={0.8}
                  onPress={pickFromGallery}>
                  <View style={styles.captureIconCircle}>
                    <ImageIcon size={24} color={Colors.primary} />
                  </View>
                  <Text style={styles.captureTitle}>Photo Library</Text>
                  <Text style={styles.captureSub}>Scan gallery garment</Text>
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
                    onPress={() => handleSelectPreset(preset)}
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
            <View style={styles.fieldLabelRow}>
              <Text style={styles.inputLabel}>CATEGORY *</Text>
              {aiDetected && (
                <Text style={styles.fieldAiTag}>AI detected</Text>
              )}
            </View>
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
            <View style={styles.fieldLabelRow}>
              <Text style={styles.inputLabel}>ITEM NAME *</Text>
              {aiDetected && <Text style={styles.fieldAiTag}>Editable</Text>}
            </View>
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
            <View style={styles.fieldLabelRow}>
              <Text style={styles.inputLabel}>PRIMARY COLOR</Text>
              {aiDetected && <Text style={styles.fieldAiTag}>AI detected</Text>}
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g. Chalk White, Navy Blue, Dark Olive"
              placeholderTextColor={Colors.textMuted}
              value={primaryColor}
              onChangeText={setPrimaryColor}
            />

            {/* Pattern */}
            <View style={styles.fieldLabelRow}>
              <Text style={styles.inputLabel}>PATTERN</Text>
              {aiDetected && <Text style={styles.fieldAiTag}>AI detected</Text>}
            </View>
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
            <View style={styles.fieldLabelRow}>
              <Text style={styles.inputLabel}>STYLE</Text>
              {aiDetected && <Text style={styles.fieldAiTag}>AI detected</Text>}
            </View>
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
            <View style={styles.fieldLabelRow}>
              <Text style={styles.inputLabel}>SUITABLE SEASON</Text>
              {aiDetected && <Text style={styles.fieldAiTag}>AI detected</Text>}
            </View>
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
              disabled={isUploading || isAnalyzing || !selectedImageUri || !name.trim()}
              style={[
                styles.saveButton,
                (!selectedImageUri || !name.trim() || isUploading || isAnalyzing)
                  ? styles.saveButtonDisabled
                  : null,
              ]}>
              {isUploading ? (
                <>
                  <ActivityIndicator color={Colors.textInverse} size="small" />
                  <Text style={styles.saveButtonText}>Saving Garment...</Text>
                </>
              ) : isAnalyzing ? (
                <>
                  <ActivityIndicator color={Colors.textInverse} size="small" />
                  <Text style={styles.saveButtonText}>Analyzing Image...</Text>
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
  aiNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  aiNoticeSuccess: {
    backgroundColor: Colors.accentSubtle,
    borderColor: '#E8DCC2',
  },
  aiNoticeWarning: {
    backgroundColor: Colors.warningLight,
    borderColor: '#F3E0B5',
  },
  aiNoticeInfo: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
  },
  aiNoticeIconWrapper: {
    marginTop: 1,
  },
  aiNoticeTextWrapper: {
    flex: 1,
  },
  aiNoticeText: {
    fontSize: Typography.fontSize.xs,
    lineHeight: 18,
    fontWeight: '600',
  },
  aiNoticeTextSuccess: {
    color: '#6E5224',
  },
  aiNoticeTextWarning: {
    color: Colors.warning,
  },
  aiNoticeTextInfo: {
    color: Colors.textSecondary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  aiBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: '#E8DCC2',
  },
  aiBadgePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accent,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  fieldAiTag: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
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
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(28, 26, 24, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  analyzingContent: {
    alignItems: 'center',
    gap: 4,
  },
  analyzingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  analyzingTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  analyzingSub: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
  },
  skipAiBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    marginTop: 4,
  },
  skipAiBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.textInverse,
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
    borderWidth: 1,
    borderColor: Colors.borderLight,
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
    borderWidth: 1,
    borderColor: Colors.borderLight,
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
    marginTop: Spacing.xs,
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
