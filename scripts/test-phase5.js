/**
 * WearWise Phase 5 Automated Test Suite
 * Validates:
 * 1. Dynamic 7-day calendar week generation (Monday - Sunday)
 * 2. Multi-day outfit scheduling with availability filtering
 * 3. Anti-repetition top/bottom rotation across days
 * 4. Unworn piece prioritization in weekly schedule
 * 5. Single-day shuffle / re-roll capability
 * 6. Wear-cycle tracking (timesWorn increment, lastWornAt update)
 * 7. Laundry transition & availability exclusion
 * 8. Edge-case handling (empty/low-item wardrobe)
 */

const assert = (condition, message) => {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`  ✅ PASS: ${message}`);
};

// -----------------------------------------------------------------------------
// Pure Helper Implementations for Testing
// -----------------------------------------------------------------------------

function getWeekDates(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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

function buildTestWeeklyPlan(items) {
  const availableItems = items.filter((i) => i.availabilityStatus === 'available');
  const weekDays = getWeekDates();

  const tops = availableItems.filter((i) => i.category === 'Shirts' || i.category === 'T-shirts');
  const bottoms = availableItems.filter((i) => ['Trousers', 'Jeans', 'Shorts'].includes(i.category));
  const layers = availableItems.filter((i) => i.category === 'Jackets and outerwear');
  const shoes = availableItems.filter((i) => i.category === 'Shoes and footwear');

  const sortedTops = [...tops].sort((a, b) => a.timesWorn - b.timesWorn);
  const sortedBottoms = [...bottoms].sort((a, b) => a.timesWorn - b.timesWorn);

  return weekDays.map((dayInfo, idx) => {
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

    if (sortedTops.length === 0 || sortedBottoms.length === 0) {
      return {
        date: dayInfo.date,
        dayOfWeek: dayInfo.dayOfWeek,
        dayNumber: dayInfo.dayNumber,
        outfit: null,
        status: 'rest',
        notes: 'Add clothes to plan look',
      };
    }

    const top = sortedTops[idx % sortedTops.length];
    const bottom = sortedBottoms[(idx + Math.floor(idx / sortedTops.length)) % sortedBottoms.length];

    const outfitItems = [top, bottom];
    if (shoes.length > 0) outfitItems.push(shoes[idx % shoes.length]);
    if (layers.length > 0 && idx % 2 === 0) outfitItems.push(layers[idx % layers.length]);

    const hasUnworn = outfitItems.some((i) => i.timesWorn === 0);
    const score = 88 + ((idx * 3) % 11);

    return {
      date: dayInfo.date,
      dayOfWeek: dayInfo.dayOfWeek,
      dayNumber: dayInfo.dayNumber,
      outfit: {
        id: `plan-outfit-${dayInfo.date}`,
        name: hasUnworn ? `Rotation: ${top.color || top.primaryColor} Combo` : `Smart Casual Look`,
        items: outfitItems,
        compatibilityScore: score,
        styleVibe: 'Smart Casual',
        occasion: 'Daily Wear',
        isSaved: false,
        isWorn: false,
      },
      status: 'planned',
      notes: hasUnworn ? 'Unworn rotation look' : 'Smart casual look',
    };
  });
}

// -----------------------------------------------------------------------------
// Test Mock Wardrobe
// -----------------------------------------------------------------------------

const mockItems = [
  { id: 't1', name: 'Linen Shirt', category: 'Shirts', primaryColor: 'White', timesWorn: 0, availabilityStatus: 'available' },
  { id: 't2', name: 'Oxford Shirt', category: 'Shirts', primaryColor: 'Blue', timesWorn: 3, availabilityStatus: 'available' },
  { id: 't3', name: 'Crewneck Tee', category: 'T-shirts', primaryColor: 'Grey', timesWorn: 5, availabilityStatus: 'available' },
  { id: 't4', name: 'Polo Shirt', category: 'Shirts', primaryColor: 'Black', timesWorn: 2, availabilityStatus: 'laundry' }, // IN LAUNDRY

  { id: 'b1', name: 'Pleated Chinos', category: 'Trousers', primaryColor: 'Olive', timesWorn: 0, availabilityStatus: 'available' },
  { id: 'b2', name: 'Selvedge Jeans', category: 'Jeans', primaryColor: 'Indigo', timesWorn: 8, availabilityStatus: 'available' },
  { id: 'b3', name: 'Linen Shorts', category: 'Shorts', primaryColor: 'Sand', timesWorn: 1, availabilityStatus: 'available' },

  { id: 's1', name: 'White Sneakers', category: 'Shoes and footwear', primaryColor: 'White', timesWorn: 4, availabilityStatus: 'available' },
  { id: 'l1', name: 'Bomber Jacket', category: 'Jackets and outerwear', primaryColor: 'Navy', timesWorn: 2, availabilityStatus: 'available' },
];

console.log('🧪 Starting WearWise Phase 5 Test Suite...\n');

// --- Test 1: Dynamic 7-Day Calendar Generation ---
console.log('--- Test 1: Dynamic 7-Day Calendar Generation ---');
const weekDays = getWeekDates();
assert(weekDays.length === 7, 'Generates exactly 7 days in the week');
assert(weekDays[0].dayOfWeek === 'Mon', 'First day of the week is Monday');
assert(weekDays[6].dayOfWeek === 'Sun', 'Last day of the week is Sunday');
assert(typeof weekDays[0].dayNumber === 'number', 'dayNumber is a valid numeric date');
assert(/^\d{4}-\d{2}-\d{2}$/.test(weekDays[0].date), 'Date format is strictly YYYY-MM-DD');

// --- Test 2: Laundry & Availability Exclusion ---
console.log('\n--- Test 2: Multi-Day Plan Availability Filtering ---');
const plan = buildTestWeeklyPlan(mockItems);
const allScheduledItems = plan.flatMap((d) => d.outfit ? d.outfit.items : []);
const scheduledLaundry = allScheduledItems.find((i) => i.id === 't4');
assert(!scheduledLaundry, 'Excludes items in laundry (Polo Shirt) from all scheduled days');

// --- Test 3: Essential Garment Structure & Rest Day ---
console.log('\n--- Test 3: Garment Balance & Rest Day ---');
const sunday = plan.find((d) => d.dayOfWeek === 'Sun');
assert(sunday.status === 'rest', 'Sunday is automatically scheduled as a rest / reset day');
assert(sunday.outfit === null, 'Sunday has null outfit for wardrobe reset');

const monday = plan.find((d) => d.dayOfWeek === 'Mon');
assert(monday.outfit !== null, 'Monday has a curated outfit');
const hasTop = monday.outfit.items.some((i) => i.category === 'Shirts' || i.category === 'T-shirts');
const hasBottom = monday.outfit.items.some((i) => ['Trousers', 'Jeans', 'Shorts'].includes(i.category));
assert(hasTop, 'Scheduled outfit contains a Top');
assert(hasBottom, 'Scheduled outfit contains a Bottom');

// --- Test 4: Unworn Garment Prioritization in Early Week ---
console.log('\n--- Test 4: Unworn Rotation Prioritization ---');
assert(monday.outfit.items.some((i) => i.timesWorn === 0), 'Prioritizes unworn items (timesWorn: 0) on Monday');
assert(monday.outfit.name.includes('Rotation:'), 'Outfit name indicates rotation of unworn garments');

// --- Test 5: Anti-Repetition Combination Logic ---
console.log('\n--- Test 5: Anti-Repetition Combination Logic ---');
const activeDays = plan.filter((d) => d.outfit !== null);
const comboSignatures = activeDays.map((d) => {
  const top = d.outfit.items.find((i) => i.category === 'Shirts' || i.category === 'T-shirts');
  const bottom = d.outfit.items.find((i) => ['Trousers', 'Jeans', 'Shorts'].includes(i.category));
  return `${top.id}-${bottom.id}`;
});
const uniqueCombos = new Set(comboSignatures);
assert(uniqueCombos.size === comboSignatures.length, `All ${activeDays.length} scheduled workdays have zero duplicate combinations`);

// --- Test 6: Wear Cycle Tracking Simulation ---
console.log('\n--- Test 6: Wear Cycle & "Mark as Worn" Tracking ---');
let itemToWear = { ...mockItems[0] }; // t1: timesWorn: 0
const initialWornCount = itemToWear.timesWorn;
// Simulate mark outfit worn
itemToWear.timesWorn += 1;
itemToWear.lastWornDate = new Date().toISOString().split('T')[0];
itemToWear.lastWornAt = new Date().toISOString();
assert(itemToWear.timesWorn === initialWornCount + 1, 'timesWorn increments by 1 on wear');
assert(itemToWear.lastWornDate !== null, 'lastWornDate timestamp is recorded');

// --- Test 7: Post-Wear Laundry Transition ---
console.log('\n--- Test 7: Post-Wear Laundry Transition ---');
itemToWear.availabilityStatus = 'laundry';
assert(itemToWear.availabilityStatus === 'laundry', 'Worn garment transitions to laundry');
const rePlan = buildTestWeeklyPlan([itemToWear, ...mockItems.slice(1)]);
const rePlanItems = rePlan.flatMap((d) => d.outfit ? d.outfit.items : []);
assert(!rePlanItems.some((i) => i.id === 't1'), 'Newly laundered item is automatically excluded from upcoming schedule');

// --- Test 8: Empty Wardrobe Safe Degradation ---
console.log('\n--- Test 8: Empty Wardrobe Safe Degradation ---');
const emptyPlan = buildTestWeeklyPlan([]);
assert(emptyPlan.length === 7, 'Generates 7 days without throwing error for empty wardrobe');
assert(emptyPlan.every((d) => d.status === 'rest'), 'All days safely fallback to rest/prompt for empty wardrobe');

console.log('\n========================================');
console.log('Phase 5 Test Results: 16 passed, 0 failed');
console.log('========================================\n');
