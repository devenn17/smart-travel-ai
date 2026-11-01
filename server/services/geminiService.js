import { GoogleGenerativeAI } from '@google/generative-ai';
import { normalizeStringArray, formatStringList } from '../utils/normalize.js';

export { normalizeStringArray, formatStringList };

export class GeminiConfigurationError extends Error {
  constructor(message = 'Gemini API key is not configured.') {
    super(message);
    this.name = 'GeminiConfigurationError';
    this.statusCode = 503;
    this.code = 'GEMINI_NOT_CONFIGURED';
  }
}

export class GeminiServiceUnavailableError extends Error {
  constructor(message = 'Google AI is currently experiencing high demand. Please retry in a few moments.') {
    super(message);
    this.name = 'GeminiServiceUnavailableError';
    this.statusCode = 503;
    this.code = 'GEMINI_PROVIDER_OVERLOADED';
  }
}

export class GeminiQuotaError extends Error {
  constructor(message = 'Google AI generation quota limit temporarily reached. Please wait a moment and try again.') {
    super(message);
    this.name = 'GeminiQuotaError';
    this.statusCode = 429;
    this.code = 'GEMINI_QUOTA_EXCEEDED';
  }
}

export class GeminiTimeoutError extends Error {
  constructor(message = 'AI itinerary synthesis timed out while coordinating with Google AI. Please try again.') {
    super(message);
    this.name = 'GeminiTimeoutError';
    this.statusCode = 504;
    this.code = 'GEMINI_TIMEOUT';
  }
}

export class GeminiGenerationError extends Error {
  constructor(message = 'Failed to generate itinerary with Gemini AI.', statusCode = 502, code = 'GEMINI_GENERATION_FAILED') {
    super(message);
    this.name = 'GeminiGenerationError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

// Test Provider Hook for deterministic automated testing
let testProvider = null;
export function setTestGeminiProvider(fn) {
  testProvider = fn;
}
export function resetTestGeminiProvider() {
  testProvider = null;
}

/**
 * Promise wrapper with explicit timeout and cleanup
 */
export async function withTimeout(promise, ms, operationName = 'Operation', signal = null) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error(`${operationName} timed out after ${ms}ms`);
      err.name = 'TimeoutError';
      err.statusCode = 504;
      err.status = 504;
      reject(err);
    }, ms);
  });

  let abortPromise = null;
  let abortListener = null;
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      const err = new Error(`${operationName} aborted via cancellation signal`);
      err.name = 'AbortError';
      err.statusCode = 504;
      err.status = 504;
      throw err;
    }
    abortPromise = new Promise((_, reject) => {
      abortListener = () => {
        const err = new Error(`${operationName} cancelled via AbortSignal`);
        err.name = 'AbortError';
        err.statusCode = 504;
        err.status = 504;
        reject(err);
      };
      signal.addEventListener('abort', abortListener, { once: true });
    });
  }

  try {
    const raceTargets = [promise, timeoutPromise];
    if (abortPromise) raceTargets.push(abortPromise);
    return await Promise.race(raceTargets);
  } finally {
    clearTimeout(timeoutId);
    if (signal && abortListener) {
      signal.removeEventListener('abort', abortListener);
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBackoff(attempt, baseDelayMs = 800, maxDelayMs = 2500) {
  const exp = baseDelayMs * Math.pow(2, attempt - 1);
  const jitter = Math.floor(Math.random() * 200);
  return Math.min(exp + jitter, maxDelayMs);
}

function extractStatusCode(err) {
  if (typeof err?.status === 'number') return err.status;
  if (typeof err?.statusCode === 'number') return err.statusCode;
  const msg = err?.message || '';
  const match = msg.match(/\[(\d{3})\s+[^\]]+\]/);
  if (match) return parseInt(match[1], 10);
  if (msg.includes('503') || msg.includes('high demand') || msg.includes('Service Unavailable')) return 503;
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') || msg.includes('rate limit')) return 429;
  if (msg.includes('404') || msg.includes('not found') || msg.includes('no longer available')) return 404;
  if (msg.includes('400') || msg.includes('API_KEY_INVALID') || msg.includes('not valid')) return 400;
  if (msg.includes('401') || msg.includes('403')) return 403;
  if (
    msg.includes('504') ||
    msg.includes('timed out') ||
    msg.includes('aborted') ||
    msg.includes('AbortError') ||
    err?.name === 'TimeoutError' ||
    err?.name === 'AbortError'
  ) return 504;
  return 500;
}

function isRetryable(statusCode, err) {
  if ([429, 500, 502, 503, 504].includes(statusCode)) return true;
  if (err?.name === 'TimeoutError' || err?.name === 'AbortError' || err?.code === 'ECONNRESET' || err?.code === 'ETIMEDOUT') return true;
  return false;
}

function isAuthOrConfigError(statusCode, err) {
  if (statusCode === 401 || statusCode === 403) return true;
  if (statusCode === 400 && (err?.message?.includes('API_KEY_INVALID') || err?.message?.includes('API key not valid'))) return true;
  return false;
}

// Dynamic Model Discovery & Cache
let cachedModels = null;
let lastModelFetch = 0;
const MODEL_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const DEFAULT_PRIORITY_MODELS = [
  'gemini-3.1-flash-lite-preview',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-latest',
];

export async function getVerifiedModels(apiKey) {
  const now = Date.now();
  if (cachedModels && now - lastModelFetch < MODEL_CACHE_TTL) {
    return cachedModels;
  }

  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      signal: ctrl.signal,
    });
    clearTimeout(tid);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.models)) {
        const supported = data.models
          .filter((m) => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
          .map((m) => m.name.replace(/^models\//, ''))
          .filter((name) => {
            // Exclude non-text and specialized media models
            if (name.includes('tts') || name.includes('audio') || name.includes('transcribe')) return false;
            if (name.includes('image') || name.includes('clip') || name.includes('banana')) return false;
            if (name.includes('robotics') || name.includes('computer-use')) return false;
            // Exclude models with known 0 free-tier quota
            if (name.includes('pro')) return false;
            // Exclude retired 2.5 series returning 404
            if (name.includes('2.5-')) return false;
            return true;
          });

        // Order prioritized models first
        const verified = DEFAULT_PRIORITY_MODELS.filter((m) => supported.includes(m));
        supported.forEach((m) => {
          if (!verified.includes(m)) {
            verified.push(m);
          }
        });

        // Prepend custom environment override if set
        if (process.env.GEMINI_MODEL && !verified.includes(process.env.GEMINI_MODEL)) {
          verified.unshift(process.env.GEMINI_MODEL);
        }

        if (verified.length > 0) {
          cachedModels = verified;
          lastModelFetch = now;
          return verified;
        }
      }
    }
  } catch (err) {
    // Discovery failed or timed out; safely use defaults
  }

  cachedModels = DEFAULT_PRIORITY_MODELS;
  lastModelFetch = now;
  return DEFAULT_PRIORITY_MODELS;
}

/**
 * Clean & extract JSON from Gemini text response (handling markdown fences, preambles, etc.)
 */
function extractJSON(text) {
  if (!text || typeof text !== 'string') return null;

  // 1. If fenced with ```json ... ``` or ``` ... ```
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch (e) {
      // Continue to next heuristic
    }
  }

  // 2. Look for outermost { ... }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {
      // Continue
    }
  }

  // 3. Direct JSON parse
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    return null;
  }
}

/**
 * Generate a complete, day-by-day travel itinerary using Google Gemini AI,
 * grounded in real destination and attraction data from MongoDB.
 */
export async function generateItineraryWithGemini({
  destination,
  destinationInfo = null,
  verifiedAttractions = [],
  startDate,
  endDate,
  duration = 4,
  travelers = 2,
  travelGroup = 'Couple',
  budget = 40000,
  travelStyle = 'Balanced',
  interests = ['Culture and heritage', 'Nature'],
  _timeoutMs = 40000,
  _modelTimeoutMs = 18000,
  _backoffBaseMs = 800,
  _maxRetriesPerModel = 1,
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!testProvider && (!apiKey || !apiKey.trim() || apiKey.trim() === 'replace_with_your_gemini_api_key')) {
    throw new GeminiConfigurationError(
      'Gemini API key is not configured on the server. Please add GEMINI_API_KEY to your .env file to enable dynamic AI itinerary generation.'
    );
  }

  const genAI = apiKey && apiKey.trim() ? new GoogleGenerativeAI(apiKey.trim()) : null;

  // Prepare lean, bounded database grounding text
  let groundingContext = `DESTINATION PROFILE:\nName: ${destination}\n`;
  if (destinationInfo) {
    if (destinationInfo.region) groundingContext += `Region: ${destinationInfo.region}\n`;
    if (destinationInfo.headline) groundingContext += `Headline: ${destinationInfo.headline}\n`;
    if (destinationInfo.description) groundingContext += `Description: ${destinationInfo.description.slice(0, 160)}\n`;
    if (destinationInfo.bestTime || destinationInfo.bestSeason) {
      groundingContext += `Best Season: ${destinationInfo.bestTime || destinationInfo.bestSeason}\n`;
    }

    const categories = normalizeStringArray(destinationInfo.category);
    if (categories.length > 0) {
      groundingContext += `Categories: ${categories.slice(0, 4).join(', ')}\n`;
    }

    const tags = normalizeStringArray(destinationInfo.tags);
    if (tags.length > 0) {
      groundingContext += `Tags: ${tags.slice(0, 5).join(', ')}\n`;
    }
  }

  if (verifiedAttractions && verifiedAttractions.length > 0) {
    groundingContext += `\nVERIFIED LOCAL ATTRACTIONS (Prioritize into daily schedule):\n`;
    // Bound to top 6 landmarks to keep context lean and prevent generation latency
    const topLandmarks = verifiedAttractions.slice(0, 6);
    topLandmarks.forEach((attr, idx) => {
      const catText = formatStringList(attr.category, { fallback: 'Landmark' });
      const price = attr.estimatedPriceINR ?? attr.estimatedPrice ?? 0;
      groundingContext += `${idx + 1}. ${attr.name} [${catText}] - Est. Entry: ₹${price} - Est. Duration: ${
        attr.estimatedDuration || '2 hours'
      } - Location: ${attr.location || ''}\n`;
    });
  } else {
    groundingContext += `\nNote: Use verified, authentic landmarks and cultural experiences for ${destination}, India.\n`;
  }

  const cleanInterests = normalizeStringArray(interests);
  const interestsText = cleanInterests.length > 0
    ? cleanInterests.slice(0, 5).join(', ')
    : 'Culture and heritage, Nature';

  const prompt = `You are a master travel cartographer and budget optimization AI for "SmartTravel", an elite Indian luxury travel planner.
Generate a rich, realistic, day-by-day travel itinerary strictly matching the user's preferences, grounded in authentic Indian experiences and respecting their total budget.

USER PREFERENCES:
- Destination: ${destination}
- Duration: ${duration} Days (${Math.max(1, duration - 1)} Nights)
- Dates: ${startDate || 'Flexible'} to ${endDate || 'Flexible'}
- Travelers: ${travelers} (${travelGroup})
- Total Budget: ₹${Number(budget).toLocaleString('en-IN')} INR
- Travel Style: ${travelStyle}
- Selected Interests: ${interestsText}

${groundingContext}

REQUIREMENTS & BUDGET OPTIMIZATION:
1. Provide exactly ${duration} days in the "days" array, numbered from 1 to ${duration}.
2. Each day must feature distinct Morning, Afternoon, and Evening activities with realistic start and end times (e.g. "09:30 AM - 12:30 PM"), realistic locations, evocative descriptions, and estimated costs in INR.
3. Where verified landmarks from the database are provided above, weave them organically into appropriate time slots.
4. Meals: Provide authentic breakfast, lunch, and dinner recommendations featuring real regional culinary specialties in ${destination}.
5. Total Budget Optimization: The sum of all expenses (Accommodation + Activities + Food + Local Transport + Miscellaneous) should fit within or close to the user's budget of ₹${budget} INR.
6. Return ONLY valid JSON adhering strictly to the JSON schema below. Do not wrap in markdown or add conversational preamble.

JSON SCHEMA:
{
  "title": "Evocative title for this journey (e.g. Royal Echoes: A 4-Day Journey Through Udaipur)",
  "summary": "2-sentence overview describing the atmosphere, rhythm, and character of the trip.",
  "estimatedTotalCost": 38500,
  "budgetBreakdown": {
    "accommodation": 15000,
    "activities": 6500,
    "food": 9000,
    "transport": 5000,
    "miscellaneous": 3000
  },
  "days": [
    {
      "dayNumber": 1,
      "title": "Title for Day 1",
      "theme": "Theme for Day 1",
      "morning": {
        "time": "09:30 AM - 12:30 PM",
        "activity": "Detailed activity name",
        "location": "Neighborhood or monument area",
        "description": "Evocative 2-sentence description of the morning experience.",
        "estimatedCost": 400
      },
      "afternoon": {
        "time": "02:00 PM - 04:30 PM",
        "activity": "Detailed activity name",
        "location": "Neighborhood or monument area",
        "description": "Evocative 2-sentence description of the afternoon experience.",
        "estimatedCost": 250
      },
      "evening": {
        "time": "05:30 PM - 08:00 PM",
        "activity": "Detailed activity name",
        "location": "Sunset or scenic spot",
        "description": "Evocative 2-sentence description of the evening experience.",
        "estimatedCost": 500
      },
      "meals": {
        "breakfast": "Authentic local breakfast suggestion",
        "lunch": "Authentic regional lunch suggestion",
        "dinner": "Evening dining recommendation"
      },
      "dailyEstimatedCost": 3200,
      "notes": "Practical tip or transportation recommendation for Day 1"
    }
  ],
  "practicalTips": [
    "Practical advice on local transport.",
    "Dress code or cultural etiquette for monuments."
  ]
}`;

  const overallStart = Date.now();
  const overallTimeoutMs = _timeoutMs || 40000;
  const overallDeadline = overallStart + overallTimeoutMs;
  const modelTimeoutMs = _modelTimeoutMs || 18000;
  const maxRetriesPerModel = _maxRetriesPerModel !== undefined ? _maxRetriesPerModel : 1;

  // Real overall deadline enforcement with cancellation propagation
  const overallAbortController = new AbortController();
  const overallTimerId = setTimeout(() => {
    overallAbortController.abort(new Error(`AI generation hard deadline (${overallTimeoutMs}ms) exceeded.`));
  }, overallTimeoutMs);

  let modelsToAttempt;
  if (testProvider) {
    modelsToAttempt = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];
  } else {
    modelsToAttempt = await getVerifiedModels(apiKey);
  }

  const errorsCollected = [];

  try {
    for (const modelName of modelsToAttempt) {
      const remainingOverallMs = overallDeadline - Date.now();
      if (remainingOverallMs <= 3000 || overallAbortController.signal.aborted) {
        console.warn(`[GeminiService] Overall deadline (${overallTimeoutMs}ms) expiring in ${remainingOverallMs}ms. Stopping cascade.`);
        break;
      }

      const maxAttempts = maxRetriesPerModel + 1;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const attemptRemainingMs = overallDeadline - Date.now();
        if (attemptRemainingMs <= 3000 || overallAbortController.signal.aborted) {
          console.warn(`[GeminiService] Overall deadline expiring. Skipping attempt ${attempt} for "${modelName}".`);
          break;
        }

        // Bound individual attempt by remaining overall time
        const thisAttemptTimeoutMs = Math.min(modelTimeoutMs, attemptRemainingMs - 1000);
        if (thisAttemptTimeoutMs < 2500) {
          console.warn(`[GeminiService] Remaining time (${thisAttemptTimeoutMs}ms) insufficient for attempt. Stopping cascade.`);
          break;
        }

        const attemptController = new AbortController();
        const attemptTimerId = setTimeout(() => {
          attemptController.abort(new Error(`Model ${modelName} invocation timed out after ${thisAttemptTimeoutMs}ms`));
        }, thisAttemptTimeoutMs);

        const onOverallAbort = () => attemptController.abort(overallAbortController.signal.reason);
        overallAbortController.signal.addEventListener('abort', onOverallAbort);

        const attemptStart = Date.now();
        console.log(`[GeminiService] [Model: ${modelName}] Attempt ${attempt}/${maxAttempts} initiated for "${destination}" (Budgeted: ${thisAttemptTimeoutMs}ms)...`);

        try {
          let rawText;

          if (testProvider) {
            rawText = await withTimeout(
              Promise.resolve(testProvider(modelName, attempt, prompt, attemptController.signal)),
              thisAttemptTimeoutMs,
              `Model ${modelName}`,
              attemptController.signal
            );
          } else {
            const model = genAI.getGenerativeModel({
              model: modelName,
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.4,
                maxOutputTokens: 2500,
              },
            }, { timeout: thisAttemptTimeoutMs });

            const result = await model.generateContent(prompt, {
              signal: attemptController.signal,
              timeout: thisAttemptTimeoutMs,
            });
            const resp = await result.response;
            rawText = resp.text();
          }

          const parsed = extractJSON(rawText);
          if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
            const sanitized = sanitizeAndValidateItinerary(parsed, {
              duration,
              budget,
              verifiedAttractions,
            });
            sanitized.aiModelUsed = modelName;
            console.log(`[GeminiService] [Model: ${modelName}] Itinerary synthesized successfully on attempt ${attempt} (${Date.now() - attemptStart}ms).`);
            return sanitized;
          } else {
            throw new GeminiGenerationError(
              `Model ${modelName} returned malformed or unparseable JSON without a valid days array.`,
              502,
              'GEMINI_MALFORMED_OUTPUT'
            );
          }
        } catch (err) {
          const statusCode = extractStatusCode(err);
          const elapsed = Date.now() - attemptStart;
          console.warn(`[GeminiService] [Model: ${modelName}] Attempt ${attempt}/${maxAttempts} failed with HTTP ${statusCode} (${elapsed}ms): ${err.message ? err.message.slice(0, 160) : 'Unknown error'}`);

          errorsCollected.push({
            model: modelName,
            attempt,
            statusCode,
            message: err.message,
          });

          // Fast fail on auth/config errors
          if (isAuthOrConfigError(statusCode, err)) {
            throw new GeminiConfigurationError(
              'Gemini API key is invalid or unauthorized. Please verify your GEMINI_API_KEY.'
            );
          }

          // If model retired/not found (404), do not retry this model
          if (statusCode === 404) {
            console.log(`[GeminiService] Model "${modelName}" is retired or not available (HTTP 404). Switching to next supported model...`);
            break;
          }

          // If retryable and attempts remain, verify sufficient overall time
          if (isRetryable(statusCode, err) && attempt < maxAttempts) {
            const delay = getBackoff(attempt, _backoffBaseMs || 800);
            const remainingBeforeBackoff = overallDeadline - Date.now();
            if (delay + 3000 > remainingBeforeBackoff || overallAbortController.signal.aborted) {
              console.warn(`[GeminiService] Insufficient overall time remaining (${remainingBeforeBackoff}ms) for backoff (${delay}ms). Switching models.`);
              break;
            }
            console.log(`[GeminiService] [Model: ${modelName}] Retrying in ${delay}ms (exponential backoff with jitter)...`);
            await sleep(delay);
            continue;
          }

          // Attempts exhausted for this model
          console.log(`[GeminiService] Attempts exhausted for model "${modelName}". Failing over to next fallback model...`);
          break;
        } finally {
          clearTimeout(attemptTimerId);
          overallAbortController.signal.removeEventListener('abort', onOverallAbort);
        }
      }
    }
  } finally {
    clearTimeout(overallTimerId);
  }

  // All models failed: determine the primary failure category
  const has503 = errorsCollected.some((e) => e.statusCode === 503);
  const has429 = errorsCollected.some((e) => e.statusCode === 429);
  const hasTimeout = errorsCollected.some((e) => e.statusCode === 504) || overallAbortController.signal.aborted;

  if (hasTimeout) {
    throw new GeminiTimeoutError(
      'Itinerary generation timed out while coordinating with AI models. Please click "Retry Generation" to try again.'
    );
  }
  if (has503) {
    throw new GeminiServiceUnavailableError(
      'Google AI is currently experiencing high demand. Please click "Retry Generation" in a moment to resume.'
    );
  }
  if (has429) {
    throw new GeminiQuotaError(
      'Google AI generation quota limit temporarily reached. Please wait a moment before composing another itinerary.'
    );
  }

  const lastErr = errorsCollected[errorsCollected.length - 1];
  throw new GeminiGenerationError(
    `Gemini AI was unable to synthesize an itinerary across configured models: ${lastErr?.message || 'Unknown error'}. Please verify your connection and try again.`,
    502
  );
}

/**
 * Validate and guarantee consistent data structure, calculating accurate budget sums.
 */
function sanitizeAndValidateItinerary(raw, { duration, budget, verifiedAttractions }) {
  const days = [];
  const rawDays = Array.isArray(raw.days) ? raw.days : [];

  for (let i = 1; i <= duration; i++) {
    const rawDay = rawDays.find((d) => d.dayNumber === i) || rawDays[i - 1] || {};

    // Match attraction IDs if names match verified attractions
    const linkAttraction = (slot) => {
      if (!slot || !slot.activity) return slot;
      const matched = verifiedAttractions.find(
        (a) =>
          slot.activity.toLowerCase().includes(a.name.toLowerCase()) ||
          a.name.toLowerCase().includes(slot.activity.toLowerCase())
      );
      if (matched) {
        return {
          ...slot,
          attractionId: matched._id,
          attractionSlug: matched.slug,
          estimatedCost: slot.estimatedCost || matched.estimatedPrice || 0,
        };
      }
      return slot;
    };

    const morning = linkAttraction({
      time: rawDay.morning?.time || '09:00 AM - 12:00 PM',
      activity: rawDay.morning?.activity || 'Morning Cultural Exploration',
      location: rawDay.morning?.location || 'Central Quarter',
      description: rawDay.morning?.description || 'Discover the historic streets and architecture.',
      estimatedCost: Number(rawDay.morning?.estimatedCost) || 200,
    });

    const afternoon = linkAttraction({
      time: rawDay.afternoon?.time || '02:00 PM - 04:30 PM',
      activity: rawDay.afternoon?.activity || 'Afternoon Heritage Walk',
      location: rawDay.afternoon?.location || 'Old City Quarter',
      description: rawDay.afternoon?.description || 'Explore artisanal crafts and local markets.',
      estimatedCost: Number(rawDay.afternoon?.estimatedCost) || 150,
    });

    const evening = linkAttraction({
      time: rawDay.evening?.time || '05:30 PM - 08:00 PM',
      activity: rawDay.evening?.activity || 'Sunset Promenade & Leisure',
      location: rawDay.evening?.location || 'Scenic Viewpoint',
      description: rawDay.evening?.description || 'Witness the golden hour across the skyline.',
      estimatedCost: Number(rawDay.evening?.estimatedCost) || 300,
    });

    const dailyCost =
      (morning.estimatedCost || 0) +
      (afternoon.estimatedCost || 0) +
      (evening.estimatedCost || 0) +
      (Number(rawDay.dailyEstimatedCost) || 1200);

    days.push({
      dayNumber: i,
      title: rawDay.title || `Day ${i} Exploration`,
      theme: rawDay.theme || 'Heritage & Discovery',
      morning,
      afternoon,
      evening,
      meals: {
        breakfast: rawDay.meals?.breakfast || 'Traditional Indian breakfast with masala chai',
        lunch: rawDay.meals?.lunch || 'Regional thali and local specialties',
        dinner: rawDay.meals?.dinner || 'Atmospheric evening dining experience',
      },
      dailyEstimatedCost: dailyCost,
      notes: rawDay.notes || 'Wear comfortable walking footwear and carry drinking water.',
    });
  }

  // Calculate realistic budget breakdown
  const totalUserBudget = Number(budget) || 40000;
  const rawBreakdown = raw.budgetBreakdown || {};

  const accommodation =
    Number(rawBreakdown.accommodation) || Math.round(totalUserBudget * 0.4);
  const activities =
    Number(rawBreakdown.activities) || Math.round(totalUserBudget * 0.2);
  const food = Number(rawBreakdown.food) || Math.round(totalUserBudget * 0.22);
  const transport = Number(rawBreakdown.transport) || Math.round(totalUserBudget * 0.12);
  const miscellaneous =
    Number(rawBreakdown.miscellaneous) ||
    Math.max(1000, totalUserBudget - (accommodation + activities + food + transport));

  const calculatedTotal = accommodation + activities + food + transport + miscellaneous;

  return {
    title: raw.title || `Curated Journey Through ${duration} Days`,
    summary:
      raw.summary ||
      `An authentic ${duration}-day travel experience crafted to immerse you in local heritage and vibrant culture.`,
    estimatedTotalCost: calculatedTotal,
    budgetBreakdown: {
      accommodation,
      activities,
      food,
      transport,
      miscellaneous,
    },
    days,
    practicalTips: normalizeStringArray(raw.practicalTips).length > 0
      ? normalizeStringArray(raw.practicalTips)
      : [
          'Pre-book monument tickets online to bypass ticket window queues.',
          'Dress modestly when visiting heritage temples and holy shrines.',
          'Use licensed prepaid taxis or app-based rides for predictable fares.',
          'Carry sufficient cash in INR for local street stalls and artisan bazaars.',
        ],
    aiGenerated: true,
  };
}
