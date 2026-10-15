export type ClothingCategory =
  | 'Shirts'
  | 'T-shirts'
  | 'Trousers'
  | 'Jeans'
  | 'Shorts'
  | 'Jackets and outerwear'
  | 'Dresses and ethnic wear'
  | 'Shoes and footwear'
  | 'Accessories';

export type ClothingPattern = 'plain' | 'striped' | 'checked' | 'printed' | 'other';
export type ClothingStyle = 'casual' | 'formal' | 'sporty' | 'ethnic' | 'other';
export type ClothingSeason = 'summer' | 'winter' | 'monsoon' | 'all-season' | 'other';
export type AvailabilityStatus = 'available' | 'laundry' | 'unavailable';

export interface ClothingItem {
  id: string;
  userId?: string | null;
  name: string;
  category: ClothingCategory;
  subcategory?: string | null;
  imagePath?: string | null; // Supabase Storage object path (e.g. user-id/item-id.jpg)
  imageUrl: string; // Authenticated / signed URL or local file URI for display
  primaryColor?: string | null;
  secondaryColors?: string[] | null;
  color?: string; // Phase 1 compatibility display label (e.g. 'Crisp White')
  colorHex?: string;
  pattern?: ClothingPattern | null;
  style?: ClothingStyle | null;
  season?: ClothingSeason | ('Spring' | 'Summer' | 'Fall' | 'Winter')[] | null;
  formality?: number | null; // 1 to 5
  brand?: string | null;
  notes?: string | null;
  availabilityStatus: AvailabilityStatus;
  inLaundry?: boolean; // Phase 1 compatibility flag
  timesWorn: number;
  lastWornAt?: string | null;
  lastWornDate?: string | null; // Phase 1 compatibility
  createdAt: string;
  updatedAt?: string;
}

export type CreateClothingItemInput = {
  name: string;
  category: ClothingCategory;
  subcategory?: string | null;
  imageUri: string; // Local image URI chosen by user
  primaryColor?: string | null;
  secondaryColors?: string[] | null;
  pattern?: ClothingPattern | null;
  style?: ClothingStyle | null;
  season?: ClothingSeason | null;
  formality?: number | null;
  brand?: string | null;
  notes?: string | null;
  availabilityStatus?: AvailabilityStatus;
};

export type UpdateClothingItemInput = Partial<Omit<ClothingItem, 'id' | 'userId' | 'createdAt'>>;

export interface Outfit {
  id: string;
  name: string;
  description: string;
  items: ClothingItem[];
  compatibilityScore: number;
  styleVibe: string;
  occasion: string;
  isSaved: boolean;
  isWorn: boolean;
  lastWornDate?: string | null;
  stylistNote?: string;
}

export interface DayPlan {
  date: string;
  dayOfWeek: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  dayNumber: number;
  outfit: Outfit | null;
  status: 'planned' | 'worn' | 'rest';
  notes?: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  avatarUrl: string;
  stylePersona: string;
  primaryColors: string[];
  totalSavedOutfits: number;
  weeklyPlanGoalDays: number;
  notificationsEnabled: boolean;
  weatherSync: boolean;
  city: string;
  isAnonymous?: boolean;
}

export interface WardrobeStats {
  totalItems: number;
  availableItems: number;
  laundryItems: number;
  neverWornCount: number;
  wornCount: number;
  coveragePercentage: number;
  mostWornItem: ClothingItem | null;
  recentlyAdded: ClothingItem[];
  categoryBreakdown: Record<ClothingCategory, number>;
}
