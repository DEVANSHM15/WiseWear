-- ==============================================================================
-- WearWise Phase 2: Clothing Items and Storage Setup
-- ==============================================================================

-- 1. Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 2. Create clothing_items table
create table if not exists public.clothing_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null check (
    category in (
      'Shirts',
      'T-shirts',
      'Trousers',
      'Jeans',
      'Shorts',
      'Jackets and outerwear',
      'Dresses and ethnic wear',
      'Shoes and footwear',
      'Accessories'
    )
  ),
  subcategory text,
  image_path text not null,
  primary_color text,
  secondary_colors text[] default '{}'::text[],
  pattern text check (pattern is null or pattern in ('plain', 'striped', 'checked', 'printed', 'other')),
  style text check (style is null or style in ('casual', 'formal', 'sporty', 'ethnic', 'other')),
  season text check (season is null or season in ('summer', 'winter', 'monsoon', 'all-season', 'other')),
  formality integer check (formality is null or (formality >= 1 and formality <= 5)),
  brand text,
  notes text,
  availability_status text not null default 'available' check (
    availability_status in ('available', 'laundry', 'unavailable')
  ),
  times_worn integer not null default 0 check (times_worn >= 0),
  last_worn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Indexes for fast query and filtering
create index if not exists idx_clothing_items_user_id on public.clothing_items (user_id);
create index if not exists idx_clothing_items_category on public.clothing_items (user_id, category);
create index if not exists idx_clothing_items_availability on public.clothing_items (user_id, availability_status);
create index if not exists idx_clothing_items_times_worn on public.clothing_items (user_id, times_worn);
create index if not exists idx_clothing_items_created_at on public.clothing_items (user_id, created_at desc);

-- 4. Trigger for automatic updated_at
drop trigger if exists set_clothing_items_updated_at on public.clothing_items;
create trigger set_clothing_items_updated_at
  before update on public.clothing_items
  for each row execute function public.handle_updated_at();

-- 5. Enable Row Level Security (RLS)
alter table public.clothing_items enable row level security;

-- Drop existing policies if any to allow clean re-runs
drop policy if exists "Users can view their own clothing items" on public.clothing_items;
drop policy if exists "Users can insert their own clothing items" on public.clothing_items;
drop policy if exists "Users can update their own clothing items" on public.clothing_items;
drop policy if exists "Users can delete their own clothing items" on public.clothing_items;

-- RLS Policies strictly scoped to auth.uid()
create policy "Users can view their own clothing items"
  on public.clothing_items
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own clothing items"
  on public.clothing_items
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own clothing items"
  on public.clothing_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own clothing items"
  on public.clothing_items
  for delete
  using (auth.uid() = user_id);

-- ==============================================================================
-- 6. Storage Bucket Configuration (wardrobe-images)
-- ==============================================================================

-- Create private bucket for wardrobe images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wardrobe-images',
  'wardrobe-images',
  false,
  10485760, -- 10MB limit per image
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Storage RLS: Users can only access objects under their own user-id folder:
-- Path convention: {user_id}/{clothing_item_id}.jpg

drop policy if exists "Users can view own wardrobe images" on storage.objects;
drop policy if exists "Users can upload own wardrobe images" on storage.objects;
drop policy if exists "Users can update own wardrobe images" on storage.objects;
drop policy if exists "Users can delete own wardrobe images" on storage.objects;

create policy "Users can view own wardrobe images"
  on storage.objects for select
  using (
    bucket_id = 'wardrobe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can upload own wardrobe images"
  on storage.objects for insert
  with check (
    bucket_id = 'wardrobe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own wardrobe images"
  on storage.objects for update
  using (
    bucket_id = 'wardrobe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own wardrobe images"
  on storage.objects for delete
  using (
    bucket_id = 'wardrobe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
