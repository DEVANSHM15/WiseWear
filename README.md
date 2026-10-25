# WearWise — AI Smart Wardrobe & Outfit Planner

WearWise is a modern mobile digital wardrobe and intelligent outfit planner built with React Native, Expo, TypeScript, and Supabase.

---

## Phase 2: Digital Wardrobe & Supabase Integration

Phase 2 introduces a complete digital wardrobe ingestion and persistent storage pipeline:

1. **Native Camera & Gallery Ingestion:**
   - Capture photos directly using the device camera (`expo-image-picker`).
   - Select photos from the device library with aspect ratio cropping.
   - Built-in image optimization (`expo-image-manipulator`) resizing large uploads to 1200px max JPEG at 82% quality.
2. **Structured Clothing Metadata:**
   - Category (`Shirts`, `T-shirts`, `Trousers`, `Jeans`, `Shorts`, `Jackets and outerwear`, `Dresses and ethnic wear`, `Shoes and footwear`, `Accessories`).
   - Subcategory, Primary Color, Pattern (`plain`, `striped`, `checked`, `printed`, `other`).
   - Style (`casual`, `formal`, `sporty`, `ethnic`, `other`), Season (`summer`, `winter`, `monsoon`, `all-season`).
   - Formality level (1 to 5), Brand, Notes.
   - Availability Status (`available`, `laundry`, `unavailable`).
   - Wear counter (`times_worn`) and last worn timestamp (`last_worn_at`).
3. **Supabase Cloud Persistence:**
   - PostgreSQL `clothing_items` table with Row Level Security (RLS) strictly scoped to `auth.uid()`.
   - Private `wardrobe-images` Storage bucket storing encrypted garment images under `{user_id}/{item_id}.jpg`.
   - Dynamic 7-day signed URLs for rendering private images securely.
4. **Offline & Demo Mode Fallback:**
   - If Supabase credentials are not configured, WearWise runs in **Local Demo Mode** using AsyncStorage caching.
   - Items persist across app reboots without pretending data has been saved remotely.
5. **Interactive Wardrobe Management:**
   - Search by clothing name, color, brand, or subcategory.
   - Category filter pills with live item count badges.
   - Availability status filter (`All`, `Available`, `In Laundry`, `Stored Away`).
   - Sort by *Recently Added*, *Most Worn*, or *Name (A-Z)*.
   - Pull-to-refresh and empty onboarding states.
   - Item detail sheet with in-place editing, quick laundry toggles, and safe deletion with storage cleanup.
6. **Dashboard Integration:**
   - Real-time statistics: Total Pieces, Available Items, Items in Laundry, Never-Worn count, Coverage %, and Recently Added carousel.

---

## Running the Application

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Supabase (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase project URL and Anon key. Run the SQL migration from [`supabase/migrations/20261015000000_create_clothing_items_and_storage.sql`](./supabase/migrations/20261015000000_create_clothing_items_and_storage.sql) in your Supabase SQL editor.

### 3. Start Expo Dev Server
```bash
# Start server
npx expo start

# Or directly in web browser:
npx expo start --web

# Or on mobile device (using Expo Go):
npx expo start
```

### 4. Run Tests & Validation
```bash
# Automated Phase 2 test suite (metadata, filtering, availability, RLS)
node scripts/test-phase2.js

# Automated Phase 3 test suite (Vision AI attribute recognition & constraints)
node scripts/test-phase3.js

# Automated Phase 4 test suite (AI Outfit Stylist & anti-repetition rules)
node scripts/test-phase4.js

# Automated Phase 5 test suite (Dynamic 7-day Planner & Wear Cycle Tracking)
node scripts/test-phase5.js

# TypeScript typecheck
npx tsc --noEmit

# ESLint
npx expo lint
```

---

## Phase 3: Vision AI Garment Recognition

Phase 3 introduces automatic visual recognition of uploaded clothing photos:

1. **Vision AI Analysis:**
   - Detects clothing `category`, `primaryColor`, `pattern`, `style`, and `season` using Google Gemini Vision (`gemini-3.8-flash` / `gemini-3.5-flash-lite`) or OpenAI (`gpt-4o-mini`).
   - Normalizes all detected values against strict PostgreSQL database check constraints.
2. **Auto-Fill & User Review:**
   - Automatically populates the Add Clothing form with detected attributes.
   - Allows users to review, edit, and adjust any field prior to saving.
3. **Graceful Fallback & Loading State:**
   - Displays real-time loading indicators during AI analysis.
   - If AI is unavailable (no API key configured) or recognition fails, provides clear user notices and unlocks full manual entry.
4. **Cloud & Local Persistence:**
   - Saves confirmed metadata and optimized photo to Supabase storage & database (or local storage in guest mode).

---

## Phase 4: AI Outfit Stylist Engine

Phase 4 introduces intelligent outfit composition based on available wardrobe items:

1. **Available Wardrobe Filtering:**
   - Automatically ignores items marked as "In Laundry" or "Stored Away".
2. **Gemini 3.8 Flash Personal Stylist:**
   - Intelligently pairs tops, bottoms, footwear, and layers based on colors, patterns, and style cohesion.
   - Prioritizes unworn items (`timesWorn === 0`) to maximize wardrobe utilization.
   - Returns a Compatibility Score (85–99%) and a personalized Stylist Note explaining why the pieces match.
3. **Graceful Offline Fallback:**
   - Algorithmic color-harmony rule engine generates balanced outfits even when offline or without an API key.
4. **Interactive Controls:**
   - One-tap "Shuffle Look" / "New Combo" buttons with real-time styling loading indicators on both Home and Discover screens.

---

## Phase 5: Intelligent 7-Day Outfit Planner & Wear Cycle Tracking

Phase 5 turns the Planner tab into a dynamic weekly scheduling and wear-tracking engine:

1. **Dynamic Real-World Calendar:**
   - Computes live dates (Monday through Sunday) for the current week dynamically.
   - Status indicators for `Planned`, `Worn`, and `Rest / Reset` days.
2. **Anti-Repetition Multi-Day Scheduling:**
   - Intelligently generates 7-day schedules with zero duplicate garment combinations.
   - Actively rotates unworn pieces (`timesWorn === 0`) into the week.
   - Designates Sundays as Wardrobe Rest & Reset days.
3. **Single-Day Shuffle:**
   - Allows users to re-roll just one day's outfit on the fly without regenerating the entire week.
4. **Wear Cycle & Laundry Sync:**
   - Tapping "Mark as Worn" increments `timesWorn` (+1), timestamps `lastWornDate`, and prompts to transition the pieces into the Laundry basket.
   - Laundered pieces are instantly excluded from future outfit generation until washed and returned to the closet.
5. **Local Persistence:**
   - Persists the active weekly schedule to device storage across app launches.


