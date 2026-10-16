import { safeStorage } from '@/utils/safeStorage';
import { create } from 'zustand';
import {
  INITIAL_USER_PROFILE,
  INITIAL_WEEKLY_PLAN,
} from '@/data/mockData';
import {
  deleteClothingItemFromDb,
  deleteGarmentPhoto,
  fetchUserClothingItems,
  insertClothingItem,
  isSupabaseConfigured,
  supabase,
  updateClothingItemInDb,
  uploadGarmentPhoto,
} from '@/services/supabase';
import {
  AvailabilityStatus,
  ClothingCategory,
  ClothingItem,
  CreateClothingItemInput,
  DayPlan,
  Outfit,
  UpdateClothingItemInput,
  UserProfile,
  WardrobeStats,
} from '@/types/wardrobe';
import { optimizeClothingImage } from '@/utils/imageUtils';

const STORAGE_CACHE_KEY = '@wearwise_wardrobe_items_v2';
const DEMO_USER_ID = 'demo-user-wearwise-local';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface WardrobeState {
  items: ClothingItem[];
  outfits: Outfit[];
  todayOutfit: Outfit | null;
  weeklyPlan: DayPlan[];
  user: UserProfile;
  
  // Status flags
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  isDemoMode: boolean;
  sessionUser: { id: string; email?: string } | null;

  // Filters & Search
  searchQuery: string;
  selectedCategory: ClothingCategory | 'All';
  selectedAvailability: AvailabilityStatus | 'All';
  selectedStyle: string | 'All';
  showOnlyNeverWorn: boolean;
  sortBy: 'recently_added' | 'most_worn' | 'name';

  // Async Actions
  initializeWardrobe: () => Promise<void>;
  fetchClothingItems: () => Promise<void>;
  refreshWardrobe: () => Promise<void>;
  signOut: () => Promise<void>;
  addClothingItem: (input: CreateClothingItemInput) => Promise<ClothingItem>;
  updateClothingItem: (id: string, updates: UpdateClothingItemInput) => Promise<ClothingItem>;
  deleteClothingItem: (id: string) => Promise<void>;
  setAvailabilityStatus: (id: string, status: AvailabilityStatus) => Promise<void>;

  // Synchronous Local Actions (compatibility)
  toggleLaundry: (id: string) => void;
  saveOutfit: (outfitId: string) => void;
  markOutfitAsWorn: (outfitId: string) => void;
  generateAnotherOutfit: () => void;
  generateWeeklyPlan: () => void;
  markDayAsWorn: (date: string) => void;
  
  // Filter setters
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: ClothingCategory | 'All') => void;
  setSelectedAvailability: (availability: AvailabilityStatus | 'All') => void;
  setSelectedStyle: (style: string | 'All') => void;
  setShowOnlyNeverWorn: (val: boolean) => void;
  setSortBy: (sort: 'recently_added' | 'most_worn' | 'name') => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  clearError: () => void;

  // Computed getters
  getStats: () => WardrobeStats;
}

/**
 * Dynamically builds an outfit strictly from the user's available clothing items
 */
export function buildOutfitFromItems(items: ClothingItem[]): Outfit | null {
  const availableItems = items.filter(
    (i) => i.availabilityStatus !== 'laundry' && i.availabilityStatus !== 'unavailable'
  );
  const pool = availableItems.length >= 2 ? availableItems : items;
  if (pool.length < 2) return null;

  const tops = pool.filter((i) => i.category === 'Shirts' || i.category === 'T-shirts');
  const bottoms = pool.filter(
    (i) => i.category === 'Trousers' || i.category === 'Jeans' || i.category === 'Shorts'
  );
  const dresses = pool.filter((i) => i.category === 'Dresses and ethnic wear');
  const shoes = pool.filter((i) => i.category === 'Shoes and footwear');
  const jackets = pool.filter((i) => i.category === 'Jackets and outerwear');

  let combo: ClothingItem[] = [];

  if (tops.length > 0 && bottoms.length > 0) {
    const unwornTops = tops.filter((i) => i.timesWorn === 0);
    const chosenTop =
      unwornTops.length > 0
        ? unwornTops[Math.floor(Math.random() * unwornTops.length)]
        : tops[Math.floor(Math.random() * tops.length)];

    const unwornBottoms = bottoms.filter((i) => i.timesWorn === 0);
    const chosenBottom =
      unwornBottoms.length > 0
        ? unwornBottoms[Math.floor(Math.random() * unwornBottoms.length)]
        : bottoms[Math.floor(Math.random() * bottoms.length)];

    combo = [chosenTop, chosenBottom];
  } else if (dresses.length > 0) {
    combo = [dresses[Math.floor(Math.random() * dresses.length)]];
  } else if (pool.length >= 2) {
    combo = [pool[0], pool[1]];
  } else {
    return null;
  }

  if (shoes.length > 0) combo.push(shoes[Math.floor(Math.random() * shoes.length)]);
  if (jackets.length > 0) combo.push(jackets[Math.floor(Math.random() * jackets.length)]);

  const unwornCount = combo.filter((i) => i.timesWorn === 0).length;
  const score = Math.min(99, 88 + unwornCount * 4 + Math.floor(Math.random() * 4));

  return {
    id: `outfit-curated-${Date.now()}`,
    name: unwornCount > 0 ? 'Unworn Spotlight Look' : 'Curated Closet Harmony',
    description: `Tailored ensemble pairing ${combo.map((c) => c.name).join(' and ')}.`,
    items: combo,
    compatibilityScore: score,
    styleVibe: combo[0]?.style || 'Modern Minimalist',
    occasion: 'Everyday Versatile',
    isSaved: false,
    isWorn: false,
    stylistNote:
      unwornCount > 0
        ? `Prioritizes ${unwornCount} never-worn piece(s) in your wardrobe to increase your closet utilization!`
        : `Balanced palette generated from your personal clothes.`,
  };
}

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  items: [],
  outfits: [],
  todayOutfit: null,
  weeklyPlan: INITIAL_WEEKLY_PLAN,
  user: INITIAL_USER_PROFILE,

  isLoading: false,
  isSubmitting: false,
  error: null,
  isDemoMode: !isSupabaseConfigured,
  sessionUser: null,

  searchQuery: '',
  selectedCategory: 'All',
  selectedAvailability: 'All',
  selectedStyle: 'All',
  showOnlyNeverWorn: false,
  sortBy: 'recently_added',

  initializeWardrobe: async () => {
    try {
      // 1. Try loading cached items from safeStorage
      const cached = await safeStorage.getItem(STORAGE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as ClothingItem[];
        if (parsed.length > 0) {
          set({ items: parsed });
        }
      }

      // 2. If Supabase is configured, check live auth session
      if (isSupabaseConfigured && supabase) {
        const { data: authData } = await supabase.auth.getSession();
        const user = authData.session?.user;
        if (user) {
          set({
            isDemoMode: false,
            sessionUser: { id: user.id, email: user.email },
          });
          await get().fetchClothingItems();
        } else {
          set({ isDemoMode: true, sessionUser: null });
        }
      } else {
        set({ isDemoMode: true, sessionUser: null });
      }
    } catch (e) {
      console.warn('[store] Initialization warning:', e);
    }
  },

  fetchClothingItems: async () => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const { data: authData } = await supabase.auth.getSession();
      const user = authData.session?.user;

      if (!user) {
        set({ isDemoMode: true, sessionUser: null, isLoading: false });
        return;
      }

      set({
        sessionUser: { id: user.id, email: user.email },
      });

      const remoteItems = await fetchUserClothingItems(user.id);
      const generatedToday = buildOutfitFromItems(remoteItems);
      set({
        items: remoteItems,
        isDemoMode: false,
        isLoading: false,
        todayOutfit: generatedToday,
        outfits: generatedToday ? [generatedToday] : [],
      });
      
      // Cache locally
      await safeStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(remoteItems));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch items from Supabase';
      set({ error: msg, isLoading: false });
    }
  },

  refreshWardrobe: async () => {
    await get().fetchClothingItems();
  },

  signOut: async () => {
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    await safeStorage.removeItem(STORAGE_CACHE_KEY).catch(() => {});
    set({
      sessionUser: null,
      isDemoMode: true,
      items: [],
      todayOutfit: null,
      outfits: [],
    });
  },

  addClothingItem: async (input: CreateClothingItemInput): Promise<ClothingItem> => {
    set({ isSubmitting: true, error: null });

    let uploadedPath = '';
    const itemId = generateUUID();

    try {
      // 1. Optimize image (compress, resize to 1200px max, pre-calculate base64)
      const optimized = await optimizeClothingImage(input.imageUri);

      // Check if Supabase configured & active user
      if (isSupabaseConfigured && supabase) {
        const { data: authData } = await supabase.auth.getSession();
        const userId = authData.session?.user.id;

        if (userId) {
          // 2. Upload to Storage: user-id/item-id.jpg
          const { path, signedUrl } = await uploadGarmentPhoto(
            userId,
            itemId,
            optimized.uri,
            optimized.base64
          );
          uploadedPath = path;

          // 3. Insert into Postgres
          try {
            const newItem = await insertClothingItem(userId, itemId, path, input);
            newItem.imageUrl = signedUrl;

            // 4. Update local state
            set((state) => {
              const updated = [newItem, ...state.items];
              safeStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(updated)).catch(() => {});
              const nextToday = state.todayOutfit || buildOutfitFromItems(updated);
              const nextOutfits =
                nextToday && !state.outfits.some((o) => o.id === nextToday.id)
                  ? [nextToday, ...state.outfits]
                  : state.outfits;
              return { items: updated, isSubmitting: false, todayOutfit: nextToday, outfits: nextOutfits };
            });

            return newItem;
          } catch (dbErr) {
            // Clean up orphaned storage image if DB insert failed
            if (uploadedPath) {
              await deleteGarmentPhoto(uploadedPath).catch(() => {});
            }
            throw dbErr;
          }
        }
      }

      // 5. Fallback / Demo Mode: Local Persistence
      const localNewItem: ClothingItem = {
        id: itemId,
        userId: DEMO_USER_ID,
        name: input.name,
        category: input.category,
        subcategory: input.subcategory || null,
        imagePath: null,
        imageUrl: optimized.uri,
        primaryColor: input.primaryColor || null,
        secondaryColors: input.secondaryColors || [],
        color: input.primaryColor || 'Neutral',
        pattern: input.pattern || null,
        style: input.style || null,
        season: input.season || null,
        formality: input.formality || null,
        brand: input.brand || null,
        notes: input.notes || null,
        availabilityStatus: input.availabilityStatus || 'available',
        inLaundry: input.availabilityStatus === 'laundry',
        timesWorn: 0,
        lastWornAt: null,
        lastWornDate: null,
        createdAt: new Date().toISOString().split('T')[0],
      };

      set((state) => {
        const updated = [localNewItem, ...state.items];
        safeStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(updated)).catch(() => {});
        const nextToday = state.todayOutfit || buildOutfitFromItems(updated);
        const nextOutfits =
          nextToday && !state.outfits.some((o) => o.id === nextToday.id)
            ? [nextToday, ...state.outfits]
            : state.outfits;
        return { items: updated, isSubmitting: false, todayOutfit: nextToday, outfits: nextOutfits };
      });

      return localNewItem;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add clothing item.';
      set({ error: msg, isSubmitting: false });
      throw err;
    }
  },

  updateClothingItem: async (id: string, updates: UpdateClothingItemInput): Promise<ClothingItem> => {
    set({ isSubmitting: true, error: null });

    const previousItems = get().items;
    const target = previousItems.find((i) => i.id === id);

    if (!target) {
      set({ isSubmitting: false });
      throw new Error('Item not found');
    }

    try {
      if (isSupabaseConfigured && supabase && target.userId && target.userId !== DEMO_USER_ID) {
        const updatedRemote = await updateClothingItemInDb(id, updates);
        set((state) => {
          const updated = state.items.map((i) => (i.id === id ? updatedRemote : i));
          safeStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(updated)).catch(() => {});
          return { items: updated, isSubmitting: false };
        });
        return updatedRemote;
      }

      // Local update
      const updatedLocal: ClothingItem = {
        ...target,
        ...updates,
        inLaundry: updates.availabilityStatus ? updates.availabilityStatus === 'laundry' : target.inLaundry,
        updatedAt: new Date().toISOString(),
      };

      set((state) => {
        const updated = state.items.map((i) => (i.id === id ? updatedLocal : i));
        safeStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(updated)).catch(() => {});
        return { items: updated, isSubmitting: false };
      });

      return updatedLocal;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update clothing item.';
      set({ error: msg, isSubmitting: false, items: previousItems });
      throw err;
    }
  },

  deleteClothingItem: async (id: string) => {
    set({ isSubmitting: true, error: null });

    const previousItems = get().items;
    const target = previousItems.find((i) => i.id === id);

    try {
      if (isSupabaseConfigured && supabase && target?.userId && target.userId !== DEMO_USER_ID) {
        // Delete row in Postgres
        await deleteClothingItemFromDb(id);

        // Delete storage photo if path exists
        if (target.imagePath) {
          await deleteGarmentPhoto(target.imagePath);
        }
      }

      // Remove from state AND persist cache atomically (same pattern as add/update)
      set((state) => {
        const updated = state.items.filter((i) => i.id !== id);
        safeStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(updated)).catch(() => {});
        return { items: updated, isSubmitting: false };
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete clothing item.';
      set({ items: previousItems, error: msg, isSubmitting: false });
      throw err;
    }
  },

  setAvailabilityStatus: async (id: string, status: AvailabilityStatus) => {
    await get().updateClothingItem(id, { availabilityStatus: status });
  },

  toggleLaundry: (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;

    const nextStatus: AvailabilityStatus =
      item.availabilityStatus === 'laundry' ? 'available' : 'laundry';

    get().setAvailabilityStatus(id, nextStatus).catch(() => {});
  },

  saveOutfit: (outfitId) => {
    set((state) => ({
      outfits: state.outfits.map((o) =>
        o.id === outfitId ? { ...o, isSaved: !o.isSaved } : o
      ),
      todayOutfit:
        state.todayOutfit && state.todayOutfit.id === outfitId
          ? { ...state.todayOutfit, isSaved: !state.todayOutfit.isSaved }
          : state.todayOutfit,
    }));
  },

  markOutfitAsWorn: (outfitId) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const state = get();
    const targetOutfit =
      state.outfits.find((o) => o.id === outfitId) ||
      (state.todayOutfit && state.todayOutfit.id === outfitId ? state.todayOutfit : null);

    if (!targetOutfit) return;

    const itemIdsToUpdate = new Set(targetOutfit.items.map((i) => i.id));

    const updatedItems = state.items.map((item) => {
      if (itemIdsToUpdate.has(item.id)) {
        const nextTimes = item.timesWorn + 1;
        // Also fire background update
        if (isSupabaseConfigured && supabase && item.userId && item.userId !== DEMO_USER_ID) {
          updateClothingItemInDb(item.id, { timesWorn: nextTimes, lastWornAt: new Date().toISOString() }).catch(() => {});
        }
        return {
          ...item,
          timesWorn: nextTimes,
          lastWornDate: todayStr,
          lastWornAt: new Date().toISOString(),
        };
      }
      return item;
    });

    const updatedOutfits = state.outfits.map((o) =>
      o.id === outfitId ? { ...o, isWorn: true, lastWornDate: todayStr } : o
    );

    const updatedToday =
      state.todayOutfit && state.todayOutfit.id === outfitId
        ? { ...state.todayOutfit, isWorn: true, lastWornDate: todayStr }
        : state.todayOutfit;

    const updatedPlan = state.weeklyPlan.map((day) =>
      day.date === '2026-10-13' || day.date === todayStr
        ? { ...day, status: 'worn' as const }
        : day
    );

    set({
      items: updatedItems,
      outfits: updatedOutfits,
      todayOutfit: updatedToday,
      weeklyPlan: updatedPlan,
    });

    safeStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(updatedItems)).catch(() => {});
  },

  generateAnotherOutfit: () => {
    const { items } = get();
    const newGenerated = buildOutfitFromItems(items);
    if (!newGenerated) return;

    set((state) => ({
      todayOutfit: newGenerated,
      outfits: [newGenerated, ...state.outfits],
    }));
  },

  generateWeeklyPlan: () => {
    const { outfits } = get();
    const days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[] = [
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ];

    const availableOutfits = [...outfits];
    const newWeeklyPlan: DayPlan[] = days.map((day, idx) => {
      const dayNum = 12 + idx;
      const dateStr = `2026-10-${dayNum < 10 ? '0' + dayNum : dayNum}`;

      if (day === 'Sun') {
        return {
          date: dateStr,
          dayOfWeek: day,
          dayNumber: dayNum,
          outfit: null,
          status: 'rest' as const,
          notes: 'Wardrobe Reset & Clean Routine',
        };
      }

      const assignedOutfit =
        availableOutfits.length > 0
          ? availableOutfits[idx % availableOutfits.length]
          : null;

      return {
        date: dateStr,
        dayOfWeek: day,
        dayNumber: dayNum,
        outfit: assignedOutfit,
        status: assignedOutfit ? (idx === 0 ? ('worn' as const) : ('planned' as const)) : ('rest' as const),
        notes: assignedOutfit ? `Curated look focusing on ${assignedOutfit.styleVibe}` : 'Add clothes to plan look',
      };
    });

    set({ weeklyPlan: newWeeklyPlan });
  },

  markDayAsWorn: (date: string) => {
    set((state) => ({
      weeklyPlan: state.weeklyPlan.map((day) =>
        day.date === date ? { ...day, status: 'worn' as const } : day
      ),
    }));
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedAvailability: (availability) => set({ selectedAvailability: availability }),
  setSelectedStyle: (style) => set({ selectedStyle: style }),
  setShowOnlyNeverWorn: (val) => set({ showOnlyNeverWorn: val }),
  setSortBy: (sort) => set({ sortBy: sort }),
  updateUserProfile: (profile) =>
    set((state) => ({ user: { ...state.user, ...profile } })),
  clearError: () => set({ error: null }),

  getStats: () => {
    const { items } = get();
    const totalItems = items.length;
    const availableItems = items.filter((i) => i.availabilityStatus === 'available').length;
    const laundryItems = items.filter((i) => i.availabilityStatus === 'laundry').length;
    const neverWornCount = items.filter((i) => i.timesWorn === 0).length;
    const wornCount = totalItems - neverWornCount;
    const coveragePercentage = totalItems > 0 ? Math.round((wornCount / totalItems) * 100) : 0;

    const sortedByWorn = [...items].sort((a, b) => b.timesWorn - a.timesWorn);
    const mostWornItem = sortedByWorn.length > 0 && sortedByWorn[0].timesWorn > 0 ? sortedByWorn[0] : null;

    const recentlyAdded = [...items]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const categoryBreakdown = items.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      },
      {} as Record<ClothingCategory, number>
    );

    return {
      totalItems,
      availableItems,
      laundryItems,
      neverWornCount,
      wornCount,
      coveragePercentage,
      mostWornItem,
      recentlyAdded,
      categoryBreakdown,
    };
  },
}));
