import { ClothingItem, Outfit } from '@/types/wardrobe';
import { getVisionAIConfig } from './visionService';

interface AIStylistResponse {
  selectedItemIds: string[];
  outfitName: string;
  styleVibe: string;
  compatibilityScore: number;
  stylistNote: string;
}

/**
 * Lightweight summary of garment sent to Gemini to minimize payload & latency
 */
function toGarmentSummary(item: ClothingItem) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    color: item.primaryColor || item.color || 'Neutral',
    pattern: item.pattern || 'plain',
    style: item.style || 'casual',
    timesWorn: item.timesWorn,
  };
}

/**
 * Rule-based fallback matcher when offline or without API key
 */
export function buildFallbackOutfit(items: ClothingItem[]): Outfit | null {
  const available = items.filter((i) => i.availabilityStatus === 'available');
  if (available.length < 2) return null;

  const tops = available.filter((i) => i.category === 'Shirts' || i.category === 'T-shirts');
  const bottoms = available.filter((i) => ['Trousers', 'Jeans', 'Shorts'].includes(i.category));
  const dresses = available.filter((i) => i.category === 'Dresses and ethnic wear');
  const shoes = available.filter((i) => i.category === 'Shoes and footwear');
  const layers = available.filter((i) => i.category === 'Jackets and outerwear');

  let combo: ClothingItem[] = [];
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

/**
 * Call Gemini 3.8 Flash to intelligently curate an outfit from available items
 */
async function queryGeminiStylist(items: ClothingItem[], apiKey: string): Promise<AIStylistResponse> {
  const models = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];
  const summary = items.map(toGarmentSummary);

  const prompt = `You are a world-class personal fashion stylist. 
Here are the user's available wardrobe pieces:
${JSON.stringify(summary, null, 2)}

Select 2 to 4 items from this EXACT list that together create a cohesive, aesthetically pleasing outfit.
Rules:
1. You MUST pick real "id"s from the provided items.
2. Prioritize 1 Top + 1 Bottom (+ 1 Footwear or Layer if available).
3. If an item has timesWorn: 0, favor it to help user wear unworn clothes.
4. Ensure color and style harmony.

Respond with ONLY a JSON object:
{
  "selectedItemIds": ["id1", "id2"],
  "outfitName": "Creative name for the look",
  "styleVibe": "e.g. Smart Minimalist, Casual Streetwear, Clean Monochrome",
  "compatibilityScore": Integer from 85 to 98,
  "stylistNote": "2-3 sentences explaining why these colors, cuts, and styles work well together."
}`;

  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            maxOutputTokens: 250,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed: AIStylistResponse = JSON.parse(rawText.trim());
      if (Array.isArray(parsed.selectedItemIds) && parsed.selectedItemIds.length >= 2) {
        return parsed;
      }
    } catch {
      clearTimeout(timer);
      continue;
    }
  }

  throw new Error('Gemini stylist unavailable');
}

/**
 * Main entry point: Generates an AI outfit with automated fallback
 */
export async function generateAIOutfit(items: ClothingItem[]): Promise<Outfit | null> {
  const available = items.filter((i) => i.availabilityStatus === 'available');
  if (available.length < 2) return null;

  const config = getVisionAIConfig();
  if (config.isConfigured && config.provider === 'gemini') {
    try {
      const aiResult = await queryGeminiStylist(available, config.apiKey);
      const matched = aiResult.selectedItemIds
        .map((id) => available.find((item) => item.id === id))
        .filter((item): item is ClothingItem => Boolean(item));

      if (matched.length >= 2) {
        return {
          id: `outfit-ai-${Date.now()}`,
          name: aiResult.outfitName || 'AI Curated Ensemble',
          description: `Styled ensemble featuring ${matched.map((m) => m.name).join(' & ')}.`,
          items: matched,
          compatibilityScore: Math.min(99, Math.max(85, aiResult.compatibilityScore || 92)),
          styleVibe: aiResult.styleVibe || 'Smart Casual',
          occasion: 'Everyday Versatile',
          isSaved: false,
          isWorn: false,
          stylistNote: aiResult.stylistNote,
        };
      }
    } catch (err) {
      console.warn('[aiStylistService] AI generation failed, using rule-based fallback:', err);
    }
  }

  // Graceful rule-based fallback
  return buildFallbackOutfit(available);
}
