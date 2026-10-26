import {
  ClothingCategory,
  ClothingPattern,
  ClothingSeason,
  ClothingStyle,
} from '@/types/wardrobe';

export interface DetectedClothingMetadata {
  name: string;
  category: ClothingCategory;
  subcategory?: string | null;
  primaryColor: string;
  secondaryColors?: string[];
  pattern: ClothingPattern;
  style: ClothingStyle;
  season: ClothingSeason;
  formality: number; // 1 to 5
  brand?: string | null;
  confidence?: number;
  provider?: string;
  rawAnalysis?: string;
}

export interface VisionAnalysisResult {
  success: boolean;
  data?: DetectedClothingMetadata;
  error?: string;
  isUnavailable?: boolean;
}

// -----------------------------------------------------------------------------
// Normalization & Validation against Database Constraints
// -----------------------------------------------------------------------------

export const VALID_CATEGORIES: ClothingCategory[] = [
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

export const VALID_PATTERNS: ClothingPattern[] = [
  'plain',
  'striped',
  'checked',
  'printed',
  'other',
];

export const VALID_STYLES: ClothingStyle[] = [
  'casual',
  'formal',
  'sporty',
  'ethnic',
  'other',
];

export const VALID_SEASONS: ClothingSeason[] = [
  'summer',
  'winter',
  'monsoon',
  'all-season',
  'other',
];

export function normalizeCategory(val: unknown): ClothingCategory {
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

  // Exact match attempt
  const found = VALID_CATEGORIES.find((cat) => cat.toLowerCase() === c);
  return found || 'Shirts';
}

export function normalizePattern(val: unknown): ClothingPattern {
  if (typeof val !== 'string') return 'plain';
  const p = val.toLowerCase().trim();

  if (p.includes('stripe') || p.includes('strip')) return 'striped';
  if (p.includes('check') || p.includes('plaid') || p.includes('gingham') || p.includes('tartan') || p.includes('houndstooth')) {
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

export function normalizeStyle(val: unknown): ClothingStyle {
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

export function normalizeSeason(val: unknown): ClothingSeason {
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

export function normalizeFormality(val: unknown): number {
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

export function formatColorLabel(val: unknown): string {
  if (typeof val !== 'string' || !val.trim()) return 'Neutral';
  const trimmed = val.trim();
  // Capitalize words
  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// -----------------------------------------------------------------------------
// Vision AI Provider Config & Detection
// -----------------------------------------------------------------------------

export function getVisionAIConfig(): {
  isConfigured: boolean;
  provider: 'gemini' | 'openai' | 'none';
  apiKey: string;
} {
  const geminiKey =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    process.env.EXPO_PUBLIC_VISION_API_KEY ||
    '';

  if (geminiKey && !geminiKey.includes('your-') && !geminiKey.includes('placeholder')) {
    return { isConfigured: true, provider: 'gemini', apiKey: geminiKey.trim() };
  }

  const openaiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
  if (openaiKey && !openaiKey.includes('your-') && !openaiKey.includes('placeholder')) {
    return { isConfigured: true, provider: 'openai', apiKey: openaiKey.trim() };
  }

  return { isConfigured: false, provider: 'none', apiKey: '' };
}

export function isVisionAIAvailable(): boolean {
  return getVisionAIConfig().isConfigured;
}

// -----------------------------------------------------------------------------
// Vision Analysis Core Function
// -----------------------------------------------------------------------------

const VISION_SYSTEM_PROMPT = `Precision fashion classifier. Analyze the garment in the photo.
Respond with ONLY valid JSON matching this schema:
{
  "name": "Concise natural title (e.g. 'Crisp White Oxford Shirt', 'Indigo Slim Jeans', 'Grey Crewneck')",
  "category": "One of: 'Shirts', 'T-shirts', 'Trousers', 'Jeans', 'Shorts', 'Jackets and outerwear', 'Dresses and ethnic wear', 'Shoes and footwear', 'Accessories'",
  "subcategory": "Specific garment type (e.g. 'Button-Down', 'Graphic Tee', 'Chinos', 'Bomber Jacket')",
  "primaryColor": "Dominant color name (e.g. 'Navy Blue', 'White', 'Charcoal Grey', 'Beige', 'Black')",
  "secondaryColors": ["Accent colors if any"],
  "pattern": "One of: 'plain', 'striped', 'checked', 'printed', 'other'",
  "style": "One of: 'casual', 'formal', 'sporty', 'ethnic', 'other'",
  "season": "One of: 'summer', 'winter', 'monsoon', 'all-season', 'other'",
  "formality": Integer from 1 to 5 (1: lounge, 2: casual, 3: smart casual, 4: formal, 5: black tie),
  "brand": "Visible brand name or null",
  "confidence": Float 0.0 to 1.0
}`;

/**
 * Strip data:image/...;base64, header if present
 */
function cleanBase64(base64: string): string {
  const commaIdx = base64.indexOf(',');
  if (commaIdx !== -1) {
    return base64.slice(commaIdx + 1);
  }
  return base64.trim();
}

/**
 * Robust JSON parser that handles markdown code fences if model wraps output
 */
function parseJsonFromText(rawText: string): Record<string, unknown> {
  const trimmed = rawText.trim();

  // Try direct parse
  try {
    return JSON.parse(trimmed);
  } catch {
    // Try extracting JSON from markdown code fence
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch && fenceMatch[1]) {
      return JSON.parse(fenceMatch[1].trim());
    }

    // Try finding first '{' and last '}'
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extracted = trimmed.slice(firstBrace, lastBrace + 1);
      return JSON.parse(extracted);
    }

    throw new Error('Could not parse JSON from model response.');
  }
}

/**
 * Call Google Gemini Vision API using fastest available models and strict timeouts
 */
async function callGeminiVision(
  base64Data: string,
  apiKey: string,
  signal: AbortSignal
): Promise<Record<string, unknown>> {
  // Ordered by lowest latency: 3.1-flash-lite delivers ~2s response time
  const models = [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
  ];
  let lastError: Error | null = null;

  for (const model of models) {
    if (signal.aborted) {
      throw new Error('Vision AI request was cancelled or timed out.');
    }

    // Snappy 4.5s per-model abort timer: never hang the user
    const perModelController = new AbortController();
    const perModelTimeout = setTimeout(() => perModelController.abort(), 4500);

    const onExternalAbort = () => perModelController.abort();
    signal.addEventListener('abort', onExternalAbort, { once: true });

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const payload = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Data,
                },
              },
              {
                text: VISION_SYSTEM_PROMPT,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          maxOutputTokens: 250,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: perModelController.signal,
      });

      clearTimeout(perModelTimeout);
      signal.removeEventListener('abort', onExternalAbort);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `Gemini API HTTP ${response.status} (${model}): ${errorText || response.statusText}`
        );
      }

      const resJson = await response.json();
      const rawText =
        resJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!rawText) {
        throw new Error(`Gemini (${model}) returned an empty response.`);
      }

      return parseJsonFromText(rawText);
    } catch (err: unknown) {
      clearTimeout(perModelTimeout);
      signal.removeEventListener('abort', onExternalAbort);

      if (signal.aborted) {
        throw new Error('Vision AI request was cancelled or timed out.');
      }

      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[visionService] Model ${model} failed, trying next:`, lastError.message);
      continue;
    }
  }

  throw lastError || new Error('All Gemini model endpoints failed.');
}

/**
 * Call OpenAI Vision API (GPT-4o-mini)
 */
async function callOpenAIVision(
  base64Data: string,
  apiKey: string,
  signal: AbortSignal
): Promise<Record<string, unknown>> {
  const url = 'https://api.openai.com/v1/chat/completions';

  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: VISION_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this garment image and return the structured JSON metadata.',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Data}`,
            },
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenAI API HTTP ${response.status}: ${errorText || response.statusText}`);
  }

  const resJson = await response.json();
  const rawText = resJson?.choices?.[0]?.message?.content || '';

  if (!rawText) {
    throw new Error('OpenAI returned an empty response.');
  }

  return parseJsonFromText(rawText);
}

/**
 * Primary Vision Analysis entry point
 * Accepts base64 image data or URI. If API is not configured or fails,
 * returns useful diagnostic info without crashing so user can enter manually.
 */
export async function analyzeClothingWithVision(params: {
  base64?: string;
  uri?: string;
  timeoutMs?: number;
}): Promise<VisionAnalysisResult> {
  const config = getVisionAIConfig();

  if (!config.isConfigured) {
    return {
      success: false,
      isUnavailable: true,
      error:
        'Vision AI API key is not configured. Add EXPO_PUBLIC_GEMINI_API_KEY in your .env file to enable automatic AI clothing detection. You can enter all details manually below.',
    };
  }

  let base64Payload = params.base64 ? cleanBase64(params.base64) : '';

  // If base64 was not provided, attempt to fetch and convert if URI exists
  if (!base64Payload && params.uri) {
    try {
      const resp = await fetch(params.uri);
      const blob = await resp.blob();
      base64Payload = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          resolve(cleanBase64(res));
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return {
        success: false,
        error: 'Could not read image file data for AI vision analysis. You can enter details manually.',
      };
    }
  }

  if (!base64Payload) {
    return {
      success: false,
      error: 'No image data available to analyze. Please capture or select a photo.',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    params.timeoutMs || 8000 // 8 seconds maximum total: fast response or manual fallback
  );

  try {
    let rawParsed: Record<string, unknown>;

    if (config.provider === 'gemini') {
      rawParsed = await callGeminiVision(base64Payload, config.apiKey, controller.signal);
    } else if (config.provider === 'openai') {
      rawParsed = await callOpenAIVision(base64Payload, config.apiKey, controller.signal);
    } else {
      throw new Error('No supported vision AI provider configured.');
    }

    clearTimeout(timeoutId);

    // Normalize and sanitize values strictly matching DB constraints
    const category = normalizeCategory(rawParsed.category);
    const pattern = normalizePattern(rawParsed.pattern);
    const style = normalizeStyle(rawParsed.style);
    const season = normalizeSeason(rawParsed.season);
    const formality = normalizeFormality(rawParsed.formality);
    const primaryColor = formatColorLabel(rawParsed.primaryColor);

    const name =
      typeof rawParsed.name === 'string' && rawParsed.name.trim()
        ? rawParsed.name.trim()
        : `${primaryColor} ${category.slice(0, -1)}`;

    const subcategory =
      typeof rawParsed.subcategory === 'string' && rawParsed.subcategory.trim()
        ? rawParsed.subcategory.trim()
        : null;

    const brand =
      typeof rawParsed.brand === 'string' && rawParsed.brand.trim()
        ? rawParsed.brand.trim()
        : null;

    const secondaryColors = Array.isArray(rawParsed.secondaryColors)
      ? rawParsed.secondaryColors.filter((c): c is string => typeof c === 'string')
      : [];

    const confidence =
      typeof rawParsed.confidence === 'number' ? rawParsed.confidence : 0.9;

    return {
      success: true,
      data: {
        name,
        category,
        subcategory,
        primaryColor,
        secondaryColors,
        pattern,
        style,
        season,
        formality,
        brand,
        confidence,
        provider: config.provider,
      },
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    const message = err instanceof Error ? err.message : String(err);
    if (
      (err instanceof Error && err.name === 'AbortError') ||
      message.toLowerCase().includes('canceled') ||
      message.toLowerCase().includes('cancelled')
    ) {
      return {
        success: false,
        error: 'Vision AI request was cancelled or timed out. You can enter details manually below.',
      };
    }

    console.warn('[visionService] AI recognition error:', message);

    return {
      success: false,
      error: `AI recognition failed: ${message}. You can enter details manually below.`,
    };
  }
}
