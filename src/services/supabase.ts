import { Platform } from 'react-native';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ClothingCategory,
  ClothingItem,
  CreateClothingItemInput,
  UpdateClothingItemInput,
} from '@/types/wardrobe';
import { safeStorage } from '@/utils/safeStorage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate whether real credentials have been provided
export const isSupabaseConfigured: boolean =
  Boolean(SUPABASE_URL) &&
  Boolean(SUPABASE_ANON_KEY) &&
  !SUPABASE_URL.includes('your-project') &&
  !SUPABASE_ANON_KEY.includes('your-anon');

const isClientEnvironment = Platform.OS !== 'web' || typeof window !== 'undefined';

// Safe no-op WebSocket for Node SSR (prevents bundling Node 'ws'/'stream' on Android/iOS)
class NodeSSRWebSocket {
  close() {}
  send() {}
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: safeStorage,
        autoRefreshToken: isClientEnvironment,
        persistSession: isClientEnvironment,
        detectSessionInUrl: false,
      },
      realtime: !isClientEnvironment
        ? {
            transport: NodeSSRWebSocket as unknown as typeof WebSocket,
          }
        : undefined,
    })
  : null;

/**
 * Storage: Upload an optimized garment photo to the private wardrobe-images bucket
 * Target path convention: {userId}/{itemId}.jpg
 */
export async function uploadGarmentPhoto(
  userId: string,
  itemId: string,
  fileUri: string
): Promise<{ path: string; signedUrl: string }> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const filePath = `${userId}/${itemId}.jpg`;

  // Read file as blob for React Native upload
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('wardrobe-images')
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  // Generate an authenticated signed URL (valid for 7 days)
  const { data: signedData, error: signError } = await supabase.storage
    .from('wardrobe-images')
    .createSignedUrl(filePath, 60 * 60 * 24 * 7);

  if (signError || !signedData?.signedUrl) {
    throw signError || new Error('Failed to generate signed URL.');
  }

  return {
    path: filePath,
    signedUrl: signedData.signedUrl,
  };
}

/**
 * Storage: Delete an image from the private bucket
 */
export async function deleteGarmentPhoto(imagePath: string): Promise<void> {
  if (!supabase || !imagePath) return;

  const { error } = await supabase.storage
    .from('wardrobe-images')
    .remove([imagePath]);

  if (error) {
    console.warn('[supabase] Failed to delete image from storage:', error.message);
  }
}

/**
 * Storage: Refresh or get signed URL for an existing private image path
 */
export async function getGarmentSignedUrl(imagePath: string): Promise<string> {
  if (!supabase || !imagePath) return '';

  const { data, error } = await supabase.storage
    .from('wardrobe-images')
    .createSignedUrl(imagePath, 60 * 60 * 24 * 7);

  if (error || !data?.signedUrl) {
    return '';
  }

  return data.signedUrl;
}

/**
 * DB Row mapping: Convert Postgres snake_case row to TypeScript ClothingItem
 */
export function mapRowToClothingItem(row: Record<string, any>, signedUrl?: string): ClothingItem {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category as ClothingCategory,
    subcategory: row.subcategory,
    imagePath: row.image_path,
    imageUrl: signedUrl || row.image_path,
    primaryColor: row.primary_color,
    secondaryColors: row.secondary_colors || [],
    color: row.primary_color || 'Neutral',
    pattern: row.pattern,
    style: row.style,
    season: row.season,
    formality: row.formality,
    brand: row.brand,
    notes: row.notes,
    availabilityStatus: row.availability_status || 'available',
    inLaundry: row.availability_status === 'laundry',
    timesWorn: row.times_worn || 0,
    lastWornAt: row.last_worn_at,
    lastWornDate: row.last_worn_at ? row.last_worn_at.split('T')[0] : null,
    createdAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    updatedAt: row.updated_at,
  };
}

/**
 * Database: Fetch all clothing items for the authenticated user
 */
export async function fetchUserClothingItems(userId: string): Promise<ClothingItem[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  if (!data) return [];

  // Generate signed URLs in parallel for all private images
  const itemsWithUrls = await Promise.all(
    data.map(async (row) => {
      let signedUrl = '';
      if (row.image_path) {
        signedUrl = await getGarmentSignedUrl(row.image_path);
      }
      return mapRowToClothingItem(row, signedUrl);
    })
  );

  return itemsWithUrls;
}

/**
 * Database: Insert a new clothing item into Postgres
 */
export async function insertClothingItem(
  userId: string,
  itemId: string,
  imagePath: string,
  input: CreateClothingItemInput
): Promise<ClothingItem> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const newRow = {
    id: itemId,
    user_id: userId,
    name: input.name,
    category: input.category,
    subcategory: input.subcategory || null,
    image_path: imagePath,
    primary_color: input.primaryColor || null,
    secondary_colors: input.secondaryColors || [],
    pattern: input.pattern || null,
    style: input.style || null,
    season: input.season || null,
    formality: input.formality || null,
    brand: input.brand || null,
    notes: input.notes || null,
    availability_status: input.availabilityStatus || 'available',
    times_worn: 0,
  };

  const { data, error } = await supabase
    .from('clothing_items')
    .insert(newRow)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const signedUrl = await getGarmentSignedUrl(imagePath);
  return mapRowToClothingItem(data, signedUrl);
}

/**
 * Database: Update an existing clothing item
 */
export async function updateClothingItemInDb(
  itemId: string,
  updates: UpdateClothingItemInput
): Promise<ClothingItem> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const rowUpdates: Record<string, unknown> = {};

  if (updates.name !== undefined) rowUpdates.name = updates.name;
  if (updates.category !== undefined) rowUpdates.category = updates.category;
  if (updates.subcategory !== undefined) rowUpdates.subcategory = updates.subcategory;
  if (updates.primaryColor !== undefined) rowUpdates.primary_color = updates.primaryColor;
  if (updates.secondaryColors !== undefined) rowUpdates.secondary_colors = updates.secondaryColors;
  if (updates.pattern !== undefined) rowUpdates.pattern = updates.pattern;
  if (updates.style !== undefined) rowUpdates.style = updates.style;
  if (updates.season !== undefined) rowUpdates.season = updates.season;
  if (updates.formality !== undefined) rowUpdates.formality = updates.formality;
  if (updates.brand !== undefined) rowUpdates.brand = updates.brand;
  if (updates.notes !== undefined) rowUpdates.notes = updates.notes;
  if (updates.availabilityStatus !== undefined) {
    rowUpdates.availability_status = updates.availabilityStatus;
  }
  if (updates.timesWorn !== undefined) rowUpdates.times_worn = updates.timesWorn;
  if (updates.lastWornAt !== undefined) rowUpdates.last_worn_at = updates.lastWornAt;

  const { data, error } = await supabase
    .from('clothing_items')
    .update(rowUpdates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const signedUrl = data.image_path ? await getGarmentSignedUrl(data.image_path) : '';
  return mapRowToClothingItem(data, signedUrl);
}

/**
 * Database: Delete a clothing item from Postgres
 */
export async function deleteClothingItemFromDb(itemId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase
    .from('clothing_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    throw error;
  }
}
