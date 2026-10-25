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
import { buildFallbackOutfit, generateAIOutfit } from '@/services/aiStylistService';

const STORAGE_CACHE_KEY = '@wearwise_wardrobe_items_v2';
const STORAGE_WEEKLY_PLAN_KEY = '@wearwise_weekly_plan_v2';
const DEMO_USER_ID = 'demo-user-wearwise-local';

/**
 * Returns seven entries, Monday through Sunday, for the week containing referenceDate.
 * Weekday, day number, and month use local time; date uses UTC YYYY-MM-DD and isToday
 * compares it with the current UTC date, independent of referenceDate. The input is unchanged.
 *
 * @throws {RangeError} If a generated date cannot be converted to ISO format, including
 * when referenceDate is invalid.
 */
export function getWeekDates(referenceDate: Date = new Date()): {
  date: string;
  dayOfWeek: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  dayNumber: number;
  monthName: string;
  isToday: boolean;
}[] {
  const d = new Date(referenceDate);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));

  const days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[] = [
    'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
  ];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  return days.map((dayOfWeek, idx) => {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + idx);
    const dateStr = cur.toISOString().split('T')[0];
    return {
      date: dateStr,
      dayOfWeek,
      dayNumber: cur.getDate(),
      monthName: months[cur.getMonth()],
      isToday: dateStr === todayStr,
    };
  });
}

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
  isGeneratingOutfit: boolean;
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
  generateAnotherOutfit: () => Promise<Outfit | null>;
  generateWeeklyPlan: () => void;
  shuffleDayOutfit: (date: string) => void;
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
export const buildOutfitFromItems = buildFallbackOutfit;

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  items: [],
  outfits: [],
  todayOutfit: null,
  weeklyPlan: INITIAL_WEEKLY_PLAN,
  user: INITIAL_USER_PROFILE,

  isLoading: false,
  isSubmitting: false,
  isGeneratingOutfit: false,
  error: null,
  isDemoMode: !isSupabaseConfigured,
  sessionUser: null,

  searchQuery: '',
  selectedCategory: 'All',
  selectedAvailability: 'All',
  selectedStyle: 'All',
  showOnlyNeverWorn: false,
  sortBy: 'recently_added',

  /**
   * Restores cached items and a nonempty weekly plan, then checks the Supabase session.
   * Fetches remote items for an authenticated user; otherwise enables demo mode.
   * Initialization failures are caught, retaining any state already restored.
   */
  initializeWardrobe: async () => {
    try {
      // 1. Try loading cached items & plan from safeStorage
      const cached = await safeStorage.getItem(STORAGE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as ClothingItem[];
        if (parsed.length > 0) {
          set({ items: parsed });
        }
      }

      const cachedPlan = await safeStorage.getItem(STORAGE_WEEKLY_PLAN_KEY);
      if (cachedPlan) {
        const parsedPlan = JSON.parse(cachedPlan) as DayPlan[];
        if (Array.isArray(parsedPlan) && parsedPlan.length > 0) {
          set({ weeklyPlan: parsedPlan });
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

  /**
   * Records a wear for an outfit found in outfits or todayOutfit; unknown IDs are ignored.
   * Each call increments its wardrobe items' wear counts, updates timestamps, marks the
   * outfit worn, and marks today (UTC) and any plan days with that outfit ID worn.
   * Caches items and the plan and updates remote wear metadata in the background;
   * persistence failures are ignored.
   */
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
      day.date === todayStr || day.outfit?.id === outfitId
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
    safeStorage.setItem(STORAGE_WEEKLY_PLAN_KEY, JSON.stringify(updatedPlan)).catch(() => {});
  },

  /**
   * Generates an outfit while setting isGeneratingOutfit, then makes it today's outfit
   * and prepends it to outfits, replacing any entry with the same ID.
   * Returns the outfit, or null on insufficient available items or a caught failure,
   * and clears the generation flag when the attempt finishes.
   */
  generateAnotherOutfit: async () => {
    const { items } = get();
    set({ isGeneratingOutfit: true });
    try {
      const newGenerated = await generateAIOutfit(items);
      if (!newGenerated) {
        set({ isGeneratingOutfit: false });
        return null;
      }

      set((state) => ({
        isGeneratingOutfit: false,
        todayOutfit: newGenerated,
        outfits: [newGenerated, ...state.outfits.filter((o) => o.id !== newGenerated.id)],
      }));
      return newGenerated;
    } catch {
      set({ isGeneratingOutfit: false });
      return null;
    }
  },

  /**
   * Replaces the current week's plan, rotating available tops and bottoms from least worn
   * first, with optional footwear and layers. Combinations can repeat when options are limited.
   * If a top or bottom is missing, cycles existing outfits without rechecking availability;
   * days without an outfit and Sunday become rest days.
   * Caches the plan in the background and ignores storage failures.
   */
  generateWeeklyPlan: () => {
    const { items, outfits } = get();
    const availableItems = items.filter((i) => i.availabilityStatus === 'available');
    const weekDays = getWeekDates();

    const tops = availableItems.filter((i) => i.category === 'Shirts' || i.category === 'T-shirts');
    const bottoms = availableItems.filter((i) => ['Trousers', 'Jeans', 'Shorts'].includes(i.category));
    const layers = availableItems.filter((i) => i.category === 'Jackets and outerwear');
    const shoes = availableItems.filter((i) => i.category === 'Shoes and footwear');

    // Prioritize unworn items
    const sortedTops = [...tops].sort((a, b) => a.timesWorn - b.timesWorn);
    const sortedBottoms = [...bottoms].sort((a, b) => a.timesWorn - b.timesWorn);

    const newWeeklyPlan: DayPlan[] = weekDays.map((dayInfo, idx) => {
      // Sunday is rest / laundry reset day
      if (dayInfo.dayOfWeek === 'Sun') {
        return {
          date: dayInfo.date,
          dayOfWeek: dayInfo.dayOfWeek,
          dayNumber: dayInfo.dayNumber,
          outfit: null,
          status: 'rest',
          notes: 'Wardrobe Reset & Clean Routine',
        };
      }

      // If wardrobe has insufficient items to compose a custom top+bottom
      if (sortedTops.length === 0 || sortedBottoms.length === 0) {
        const fallbackOutfit = outfits[idx % (outfits.length || 1)] || null;
        return {
          date: dayInfo.date,
          dayOfWeek: dayInfo.dayOfWeek,
          dayNumber: dayInfo.dayNumber,
          outfit: fallbackOutfit,
          status: fallbackOutfit ? 'planned' : 'rest',
          notes: fallbackOutfit ? 'Curated from saved looks' : 'Add clothes to plan look',
        };
      }

      // Select distinct top and bottom for this day with offset so combos don't repeat
      const top = sortedTops[idx % sortedTops.length];
      const bottom = sortedBottoms[(idx + Math.floor(idx / sortedTops.length)) % sortedBottoms.length];

      const outfitItems: ClothingItem[] = [top, bottom];
      if (shoes.length > 0) {
        outfitItems.push(shoes[idx % shoes.length]);
      }
      if (layers.length > 0 && idx % 2 === 0) {
        outfitItems.push(layers[idx % layers.length]);
      }

      const hasUnworn = outfitItems.some((i) => i.timesWorn === 0);
      let styleVibe = 'Smart Casual';
      let occasion = 'Daily Wear';

      if (dayInfo.dayOfWeek === 'Mon') {
        styleVibe = 'Clean & Professional';
        occasion = 'Week Kickoff';
      } else if (dayInfo.dayOfWeek === 'Fri') {
        styleVibe = 'Relaxed Casual';
        occasion = 'Casual Friday';
      } else if (dayInfo.dayOfWeek === 'Sat') {
        styleVibe = 'Weekend Comfort';
        occasion = 'Weekend Outing';
      }

      const outfitName = hasUnworn
        ? `Rotation: ${top.color || top.primaryColor} Combo`
        : `${styleVibe} Look`;

      const score = 88 + ((idx * 3) % 11);

      const dayOutfit: Outfit = {
        id: `plan-outfit-${dayInfo.date}`,
        name: outfitName,
        description: `Curated ${styleVibe.toLowerCase()} look for ${dayInfo.dayOfWeek}.`,
        items: outfitItems,
        compatibilityScore: score,
        styleVibe,
        occasion,
        isSaved: false,
        isWorn: false,
        lastWornDate: null,
        stylistNote: hasUnworn
          ? `Features unworn ${outfitItems.find((i) => i.timesWorn === 0)?.name}. Great balance of color and comfort.`
          : `Cohesive pairing of ${top.name} with ${bottom.name}.`,
      };

      return {
        date: dayInfo.date,
        dayOfWeek: dayInfo.dayOfWeek,
        dayNumber: dayInfo.dayNumber,
        outfit: dayOutfit,
        status: 'planned',
        notes: hasUnworn ? 'Unworn rotation look' : `${styleVibe} look`,
      };
    });

    set({ weeklyPlan: newWeeklyPlan });
    safeStorage.setItem(STORAGE_WEEKLY_PLAN_KEY, JSON.stringify(newWeeklyPlan)).catch(() => {});
  },

  /**
   * Replaces the outfit for a matching non-rest date (YYYY-MM-DD) with a random available
   * top and bottom, resetting its status to planned even if previously worn.
   * Leaves outfits unchanged when either category is missing or no eligible date matches.
   * Caches the plan in the background and ignores storage failures.
   */
  shuffleDayOutfit: (date: string) => {
    const { items, weeklyPlan } = get();
    const availableItems = items.filter((i) => i.availabilityStatus === 'available');
    const tops = availableItems.filter((i) => i.category === 'Shirts' || i.category === 'T-shirts');
    const bottoms = availableItems.filter((i) => ['Trousers', 'Jeans', 'Shorts'].includes(i.category));

    if (tops.length === 0 || bottoms.length === 0) return;

    // Pick random top & bottom
    const randomTop = tops[Math.floor(Math.random() * tops.length)];
    const randomBottom = bottoms[Math.floor(Math.random() * bottoms.length)];

    const updatedPlan = weeklyPlan.map((day) => {
      if (day.date !== date || day.status === 'rest') return day;

      const newOutfit: Outfit = {
        id: `plan-outfit-${date}-${Date.now()}`,
        name: `Alternative ${randomTop.category} Look`,
        description: `Shuffled combination for ${day.dayOfWeek}.`,
        items: [randomTop, randomBottom],
        compatibilityScore: 90 + Math.floor(Math.random() * 8),
        styleVibe: 'Fresh Dynamic Combo',
        occasion: 'Daily Rotation',
        isSaved: false,
        isWorn: false,
        stylistNote: `Alternative pairing of ${randomTop.name} with ${randomBottom.name}.`,
      };

      return {
        ...day,
        outfit: newOutfit,
        status: 'planned' as const,
        notes: 'Custom shuffled look',
      };
    });

    set({ weeklyPlan: updatedPlan });
    safeStorage.setItem(STORAGE_WEEKLY_PLAN_KEY, JSON.stringify(updatedPlan)).catch(() => {});
  },

  /**
   * Marks matching plan entries for date (YYYY-MM-DD) worn without changing item wear counts.
   * Caches the plan in the background and ignores storage failures.
   */
  markDayAsWorn: (date: string) => {
    set((state) => {
      const updatedPlan = state.weeklyPlan.map((day) =>
        day.date === date ? { ...day, status: 'worn' as const } : day
      );
      safeStorage.setItem(STORAGE_WEEKLY_PLAN_KEY, JSON.stringify(updatedPlan)).catch(() => {});
      return { weeklyPlan: updatedPlan };
    });
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
