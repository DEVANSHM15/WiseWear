/**
 * WearWise Phase 4 — AI Outfit Stylist Engine Test Suite
 * Tests outfit composition, category balance, unworn piece prioritization,
 * laundry filtering, and schema integrity.
 */

// Mirror of rule-based stylist fallback in aiStylistService.ts
function buildFallbackOutfit(items) {
  const available = items.filter((i) => i.availabilityStatus === 'available');
  if (available.length < 2) return null;

  const tops = available.filter((i) => i.category === 'Shirts' || i.category === 'T-shirts');
  const bottoms = available.filter((i) => ['Trousers', 'Jeans', 'Shorts'].includes(i.category));
  const dresses = available.filter((i) => i.category === 'Dresses and ethnic wear');
  const shoes = available.filter((i) => i.category === 'Shoes and footwear');
  const layers = available.filter((i) => i.category === 'Jackets and outerwear');

  let combo = [];
  if (tops.length > 0 && bottoms.length > 0) {
    const unwornTops = tops.filter((t) => t.timesWorn === 0);
    const top = unwornTops[0] || tops[Math.floor(Math.random() * tops.length)];
    const unwornBottoms = bottoms.filter((b) => b.timesWorn === 0);
    const bottom = unwornBottoms[0] || bottoms[Math.floor(Math.random() * bottoms.length)];
    combo = [top, bottom];
  } else if (dresses.length > 0) {
    combo = [dresses[0]];
  } else {
    combo = available.slice(0, 2);
  }

  if (shoes.length > 0) combo.push(shoes[Math.floor(Math.random() * shoes.length)]);
  if (layers.length > 0) combo.push(layers[Math.floor(Math.random() * layers.length)]);

  const unworn = combo.filter((i) => i.timesWorn === 0).length;
  const score = Math.min(99, 88 + unworn * 4 + Math.floor(Math.random() * 4));

  return {
    id: `outfit-${Date.now()}`,
    name: unworn > 0 ? 'Unworn Rotation Spotlight' : 'Curated Wardrobe Harmony',
    description: `Balanced pairing of ${combo.map((c) => c.name).join(' and ')}.`,
    items: combo,
    compatibilityScore: score,
    styleVibe: combo[0]?.style || 'Modern Casual',
    occasion: 'Everyday Versatile',
    isSaved: false,
    isWorn: false,
    stylistNote:
      unworn > 0
        ? `Spotlights ${unworn} unworn item to boost your rotation.`
        : 'Cohesive color palette matched from your available pieces.',
  };
}

function runPhase4Tests() {
  console.log('🧪 Starting WearWise Phase 4 Test Suite...\n');
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

  const sampleWardrobe = [
    {
      id: 'top-1',
      name: 'Oxford White Shirt',
      category: 'Shirts',
      color: 'White',
      style: 'formal',
      availabilityStatus: 'available',
      timesWorn: 3,
    },
    {
      id: 'top-2',
      name: 'Heavyweight Sand Tee',
      category: 'T-shirts',
      color: 'Beige',
      style: 'casual',
      availabilityStatus: 'available',
      timesWorn: 0, // Unworn
    },
    {
      id: 'bottom-1',
      name: 'Raw Selvedge Denim',
      category: 'Jeans',
      color: 'Indigo',
      style: 'casual',
      availabilityStatus: 'available',
      timesWorn: 5,
    },
    {
      id: 'bottom-2',
      name: 'Pleated Chino Trousers',
      category: 'Trousers',
      color: 'Navy',
      style: 'formal',
      availabilityStatus: 'laundry', // In Laundry! Must be excluded
      timesWorn: 1,
    },
    {
      id: 'shoes-1',
      name: 'White Leather Sneakers',
      category: 'Shoes and footwear',
      color: 'Off-White',
      style: 'casual',
      availabilityStatus: 'available',
      timesWorn: 2,
    },
    {
      id: 'jacket-1',
      name: 'Navy Harrington Bomber',
      category: 'Jackets and outerwear',
      color: 'Navy',
      style: 'casual',
      availabilityStatus: 'available',
      timesWorn: 0, // Unworn
    },
  ];

  // Test 1: Laundry Filtering
  console.log('--- Test 1: Laundry & Availability Filtering ---');
  const outfit = buildFallbackOutfit(sampleWardrobe);
  assert(outfit !== null, 'Generates valid outfit from available items');
  const includesLaundry = outfit.items.some((item) => item.id === 'bottom-2');
  assert(!includesLaundry, 'Excludes items in laundry from outfit recommendations');

  // Test 2: Category Structure (Top + Bottom + Shoes)
  console.log('\n--- Test 2: Essential Garment Balance ---');
  const hasTop = outfit.items.some((i) => i.category === 'Shirts' || i.category === 'T-shirts');
  const hasBottom = outfit.items.some((i) => ['Trousers', 'Jeans', 'Shorts'].includes(i.category));
  assert(hasTop, 'Outfit contains at least one Top');
  assert(hasBottom, 'Outfit contains at least one Bottom');

  // Test 3: Unworn Prioritization
  console.log('\n--- Test 3: Unworn Piece Prioritization ---');
  const unwornInOutfit = outfit.items.filter((i) => i.timesWorn === 0);
  assert(unwornInOutfit.length > 0, 'Prioritizes unworn items when available');
  assert(outfit.name.includes('Spotlight'), 'Outfit title highlights unworn rotation');

  // Test 4: Compatibility Score & Stylist Note
  console.log('\n--- Test 4: Score & Stylist Note Integrity ---');
  assert(outfit.compatibilityScore >= 85 && outfit.compatibilityScore <= 99, 'Compatibility score between 85% and 99%');
  assert(typeof outfit.stylistNote === 'string' && outfit.stylistNote.length > 0, 'Generates insightful stylist note');
  assert(typeof outfit.styleVibe === 'string' && outfit.styleVibe.length > 0, 'Generates a defined style vibe');

  // Test 5: Edge Cases
  console.log('\n--- Test 5: Safe Edge-Case Handling ---');
  assert(buildFallbackOutfit([]) === null, 'Returns null for empty wardrobe without throwing error');
  assert(buildFallbackOutfit([sampleWardrobe[0]]) === null, 'Returns null for single item without throwing error');

  console.log(`\n========================================`);
  console.log(`Phase 4 Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runPhase4Tests();
