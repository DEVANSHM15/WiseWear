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

# TypeScript typecheck
npx tsc --noEmit

# ESLint
npx expo lint
```

---

## Phase 3: Vision AI Garment Recognition

Phase 3 introduces automatic visual recognition of uploaded clothing photos:

1. **Vision AI Analysis:**
   - Detects clothing `category`, `primaryColor`, `pattern`, `style`, and `season` using Google Gemini Vision (`gemini-1.5-flash` / `gemini-2.0-flash`) or OpenAI (`gpt-4o-mini`).
   - Normalizes all detected values against strict PostgreSQL database check constraints.
2. **Auto-Fill & User Review:**
   - Automatically populates the Add Clothing form with detected attributes.
   - Allows users to review, edit, and adjust any field prior to saving.
3. **Graceful Fallback & Loading State:**
   - Displays real-time loading indicators during AI analysis.
   - If AI is unavailable (no API key configured) or recognition fails, provides clear user notices and unlocks full manual entry.
4. **Cloud & Local Persistence:**
   - Saves confirmed metadata and optimized photo to Supabase storage & database (or local storage in guest mode).

