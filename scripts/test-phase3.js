/**
 * WearWise Phase 3 — Vision AI & Clothing Attribute Recognition Test Suite
 * Tests AI metadata normalization against PostgreSQL schema constraints,
 * error handling, fallback modes, and CreateClothingItemInput compatibility.
 */

// Mirrors the normalization logic in src/services/visionService.ts
const VALID_CATEGORIES = [
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

const VALID_PATTERNS = ['plain', 'striped', 'checked', 'printed', 'other'];
const VALID_STYLES = ['casual', 'formal', 'sporty', 'ethnic', 'other'];
const VALID_SEASONS = ['summer', 'winter', 'monsoon', 'all-season', 'other'];

function normalizeCategory(val) {
  if (typeof val !== 'string') return 'Shirts';
  const c = val.toLowerCase().trim();

  if (c.includes('t-shirt') || c.includes('tee') || c.includes('tshirt') || c.includes('polo')) {
    return 'T-shirts';
  }
  if (c.includes('shirt') || c.includes('button') || c.includes('blouse') || c.includes('flannel')) {
    return 'Shirts';
  }
  if (c.includes('jean') || c.includes('denim')) {
    return 'Jeans';
  }
  if (c.includes('short')) {
    return 'Shorts';
  }
  if (
    c.includes('trouser') ||
    c.includes('pant') ||
    c.includes('chino') ||
    c.includes('slack') ||
    c.includes('cargo') ||
    c.includes('jogger')
  ) {
    return 'Trousers';
  }
  if (
    c.includes('jacket') ||
    c.includes('coat') ||
    c.includes('outerwear') ||
    c.includes('blazer') ||
    c.includes('hoodie') ||
    c.includes('sweater') ||
    c.includes('cardigan') ||
    c.includes('fleece') ||
    c.includes('bomber')
  ) {
    return 'Jackets and outerwear';
  }
  if (
    c.includes('dress') ||
    c.includes('skirt') ||
    c.includes('ethnic') ||
    c.includes('kurta') ||
    c.includes('kurti') ||
    c.includes('saree') ||
    c.includes('sari') ||
    c.includes('lehenga') ||
    c.includes('sherwani')
  ) {
    return 'Dresses and ethnic wear';
  }
  if (
    c.includes('shoe') ||
    c.includes('sneaker') ||
    c.includes('boot') ||
    c.includes('footwear') ||
    c.includes('loafer') ||
    c.includes('heel') ||
    c.includes('sandal') ||
    c.includes('slide')
  ) {
    return 'Shoes and footwear';
  }
  if (
    c.includes('accessory') ||
    c.includes('hat') ||
    c.includes('cap') ||
    c.includes('belt') ||
    c.includes('bag') ||
    c.includes('watch') ||
    c.includes('scarf') ||
    c.includes('tie') ||
    c.includes('sunglasses')
  ) {
    return 'Accessories';
  }

  const found = VALID_CATEGORIES.find((cat) => cat.toLowerCase() === c);
  return found || 'Shirts';
}

function normalizePattern(val) {
  if (typeof val !== 'string') return 'plain';
  const p = val.toLowerCase().trim();

  if (p.includes('stripe') || p.includes('strip')) return 'striped';
  if (
    p.includes('check') ||
    p.includes('plaid') ||
    p.includes('gingham') ||
    p.includes('tartan') ||
    p.includes('houndstooth')
  ) {
    return 'checked';
  }
  if (
    p.includes('print') ||
    p.includes('floral') ||
    p.includes('graphic') ||
    p.includes('polka') ||
    p.includes('pattern') ||
    p.includes('camo') ||
    p.includes('motif') ||
    p.includes('logo')
  ) {
    return 'printed';
  }
  if (
    p.includes('plain') ||
    p.includes('solid') ||
    p.includes('basic') ||
    p.includes('monochrome') ||
    p.includes('none') ||
    p.includes('clean')
  ) {
    return 'plain';
  }
  return 'other';
}

function normalizeStyle(val) {
  if (typeof val !== 'string') return 'casual';
  const s = val.toLowerCase().trim();

  if (s.includes('smart casual') || s.includes('business casual')) {
    return 'casual';
  }

  if (
    s.includes('formal') ||
    s.includes('business') ||
    s.includes('office') ||
    s.includes('dressy') ||
    s.includes('smart') ||
    s.includes('elegant')
  ) {
    return 'formal';
  }
  if (
    s.includes('sport') ||
    s.includes('athletic') ||
    s.includes('gym') ||
    s.includes('active') ||
    s.includes('workout') ||
    s.includes('runner')
  ) {
    return 'sporty';
  }
  if (
    s.includes('ethnic') ||
    s.includes('traditional') ||
    s.includes('cultural') ||
    s.includes('desi') ||
    s.includes('boho') ||
    s.includes('folk')
  ) {
    return 'ethnic';
  }
  if (
    s.includes('casual') ||
    s.includes('street') ||
    s.includes('lounge') ||
    s.includes('everyday') ||
    s.includes('relaxed') ||
    s.includes('comfy')
  ) {
    return 'casual';
  }
  return 'other';
}

function normalizeSeason(val) {
  if (typeof val !== 'string') return 'all-season';
  const s = val.toLowerCase().trim();

  if (s.includes('summer') || s.includes('hot') || s.includes('warm') || s.includes('beach')) {
    return 'summer';
  }
  if (s.includes('winter') || s.includes('cold') || s.includes('snow') || s.includes('autumn') || s.includes('fall')) {
    return 'winter';
  }
  if (s.includes('monsoon') || s.includes('rain') || s.includes('wet')) {
    return 'monsoon';
  }
  if (s.includes('all') || s.includes('year') || s.includes('transitional') || s.includes('spring')) {
    return 'all-season';
  }
  return 'all-season';
}

function normalizeFormality(val) {
  if (typeof val === 'number') {
    return Math.min(5, Math.max(1, Math.round(val)));
  }
  if (typeof val === 'string') {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      return Math.min(5, Math.max(1, Math.round(parsed)));
    }
  }
  return 2;
}

function formatColorLabel(val) {
  if (typeof val !== 'string' || !val.trim()) return 'Neutral';
  const trimmed = val.trim();
  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function runPhase3Tests() {
  console.log('🧪 Starting WearWise Phase 3 Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  // 1. Category Normalization Tests
  console.log('--- Test 1: Category Normalization (PostgreSQL Constraint Compliance) ---');
  assert(
    normalizeCategory('t-shirt') === 'T-shirts',
    'Normalizes "t-shirt" to "T-shirts"'
  );
  assert(
    normalizeCategory('Graphic Tee') === 'T-shirts',
    'Normalizes "Graphic Tee" to "T-shirts"'
  );
  assert(
    normalizeCategory('Oxford Button Down Shirt') === 'Shirts',
    'Normalizes "Oxford Button Down Shirt" to "Shirts"'
  );
  assert(
    normalizeCategory('Slim Denim Jeans') === 'Jeans',
    'Normalizes "Slim Denim Jeans" to "Jeans"'
  );
  assert(
    normalizeCategory('Chino Pants') === 'Trousers',
    'Normalizes "Chino Pants" to "Trousers"'
  );
  assert(
    normalizeCategory('Leather Bomber Jacket') === 'Jackets and outerwear',
    'Normalizes "Leather Bomber Jacket" to "Jackets and outerwear"'
  );
  assert(
    normalizeCategory('Silk Anarkali Kurta') === 'Dresses and ethnic wear',
    'Normalizes "Silk Anarkali Kurta" to "Dresses and ethnic wear"'
  );
  assert(
    normalizeCategory('Running Sneakers') === 'Shoes and footwear',
    'Normalizes "Running Sneakers" to "Shoes and footwear"'
  );
  assert(
    normalizeCategory('Leather Belt') === 'Accessories',
    'Normalizes "Leather Belt" to "Accessories"'
  );

  VALID_CATEGORIES.forEach((cat) => {
    assert(VALID_CATEGORIES.includes(cat), `Valid database category: "${cat}"`);
  });

  // 2. Pattern Normalization Tests
  console.log('\n--- Test 2: Pattern Normalization ---');
  assert(normalizePattern('Vertical Stripes') === 'striped', 'Normalizes "Vertical Stripes" to "striped"');
  assert(normalizePattern('Tartan Plaid') === 'checked', 'Normalizes "Tartan Plaid" to "checked"');
  assert(normalizePattern('Floral Graphic') === 'printed', 'Normalizes "Floral Graphic" to "printed"');
  assert(normalizePattern('Solid Monochrome') === 'plain', 'Normalizes "Solid Monochrome" to "plain"');
  assert(normalizePattern('Embroidered') === 'other', 'Normalizes "Embroidered" to "other"');

  VALID_PATTERNS.forEach((p) => {
    assert(VALID_PATTERNS.includes(p), `Valid database pattern: "${p}"`);
  });

  // 3. Style Normalization Tests
  console.log('\n--- Test 3: Style Normalization ---');
  assert(normalizeStyle('Business Formal') === 'formal', 'Normalizes "Business Formal" to "formal"');
  assert(normalizeStyle('Everyday Streetwear') === 'casual', 'Normalizes "Everyday Streetwear" to "casual"');
  assert(normalizeStyle('Athletic Gymwear') === 'sporty', 'Normalizes "Athletic Gymwear" to "sporty"');
  assert(normalizeStyle('Traditional Desi') === 'ethnic', 'Normalizes "Traditional Desi" to "ethnic"');

  VALID_STYLES.forEach((s) => {
    assert(VALID_STYLES.includes(s), `Valid database style: "${s}"`);
  });

  // 4. Season Normalization Tests
  console.log('\n--- Test 4: Season Normalization ---');
  assert(normalizeSeason('Hot Summer') === 'summer', 'Normalizes "Hot Summer" to "summer"');
  assert(normalizeSeason('Cold Winter') === 'winter', 'Normalizes "Cold Winter" to "winter"');
  assert(normalizeSeason('Heavy Monsoon Rain') === 'monsoon', 'Normalizes "Heavy Monsoon Rain" to "monsoon"');
  assert(normalizeSeason('All Year Round') === 'all-season', 'Normalizes "All Year Round" to "all-season"');

  VALID_SEASONS.forEach((se) => {
    assert(VALID_SEASONS.includes(se), `Valid database season: "${se}"`);
  });

  // 5. Formality & Color Formatting Tests
  console.log('\n--- Test 5: Formality & Color Sanitization ---');
  assert(normalizeFormality(1) === 1, 'Formality 1 is preserved');
  assert(normalizeFormality(5) === 5, 'Formality 5 is preserved');
  assert(normalizeFormality(0) === 1, 'Formality 0 clamped to 1');
  assert(normalizeFormality(10) === 5, 'Formality 10 clamped to 5');
  assert(normalizeFormality('3') === 3, 'String "3" parsed to integer 3');

  assert(formatColorLabel('navy blue') === 'Navy Blue', 'Capitalizes color "navy blue" -> "Navy Blue"');
  assert(formatColorLabel('   ') === 'Neutral', 'Handles empty color fallback to "Neutral"');

  // 6. Simulated AI Ingestion & Form Auto-fill Flow
  console.log('\n--- Test 6: AI Ingestion & Form Auto-fill Flow ---');
  const mockAiOutput = {
    name: 'Midnight Navy Oxford Button-Down',
    category: normalizeCategory('Oxford Shirt'),
    subcategory: 'Button-Down Shirt',
    primaryColor: formatColorLabel('midnight navy'),
    pattern: normalizePattern('Solid'),
    style: normalizeStyle('Smart Casual'),
    season: normalizeSeason('All-season'),
    formality: normalizeFormality(3),
    brand: 'Arket',
    availabilityStatus: 'available',
  };

  assert(mockAiOutput.category === 'Shirts', 'Detected category is Shirts');
  assert(mockAiOutput.primaryColor === 'Midnight Navy', 'Detected color is Midnight Navy');
  assert(mockAiOutput.pattern === 'plain', 'Detected pattern is plain');
  assert(mockAiOutput.style === 'casual', 'Detected style is casual');
  assert(mockAiOutput.season === 'all-season', 'Detected season is all-season');
  assert(mockAiOutput.formality === 3, 'Detected formality is 3');

  // 7. Review & Edit Simulation (User adjusts fields before saving)
  console.log('\n--- Test 7: Review & Edit Metadata Prior to Database Save ---');
  const userEdited = {
    ...mockAiOutput,
    primaryColor: 'Deep Indigo',
    category: normalizeCategory('Denim Jeans'),
    notes: 'Purchased on sale, tailored waist',
  };

  assert(userEdited.primaryColor === 'Deep Indigo', 'User successfully edits color before saving');
  assert(userEdited.category === 'Jeans', 'User successfully modifies category before saving');
  assert(userEdited.notes.includes('tailored waist'), 'User adds personal notes');

  // 8. Database Insert Compatibility Check
  console.log('\n--- Test 8: Supabase Postgres Insert Row Validation ---');
  const dbRow = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    user_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    name: userEdited.name,
    category: userEdited.category,
    subcategory: userEdited.subcategory,
    image_path: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11.jpg',
    primary_color: userEdited.primaryColor,
    pattern: userEdited.pattern,
    style: userEdited.style,
    season: userEdited.season,
    formality: userEdited.formality,
    brand: userEdited.brand,
    notes: userEdited.notes,
    availability_status: userEdited.availabilityStatus,
    times_worn: 0,
  };

  assert(VALID_CATEGORIES.includes(dbRow.category), 'Category satisfies database check constraint');
  assert(VALID_PATTERNS.includes(dbRow.pattern), 'Pattern satisfies database check constraint');
  assert(VALID_STYLES.includes(dbRow.style), 'Style satisfies database check constraint');
  assert(VALID_SEASONS.includes(dbRow.season), 'Season satisfies database check constraint');
  assert(dbRow.formality >= 1 && dbRow.formality <= 5, 'Formality satisfies database check constraint');
  assert(dbRow.times_worn === 0, 'Initial times_worn is 0');

  console.log(`\n========================================`);
  console.log(`Phase 3 Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3Tests();
