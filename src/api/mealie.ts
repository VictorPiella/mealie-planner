import type { Dish, WeeklyOrderPayload } from '../types';

const BASE_URL = (import.meta.env.VITE_MEALIE_URL ?? '').replace(/\/$/, '');
const TOKEN    = import.meta.env.VITE_MEALIE_TOKEN ?? '';

// During Vite dev the proxy rewrites /api/* → BASE_URL/api/* server-side,
// so we call relative paths and avoid CORS entirely.
// In Docker/production builds VITE_MEALIE_URL is baked in and used directly.
const API_ROOT = import.meta.env.DEV ? '' : BASE_URL;

// ─── Mock data ──────────────────────────────────────────────────────────────
// Used automatically when no Mealie URL / token is configured (e.g. the demo).

const MOCK_DISHES: Dish[] = [
  { id: 'd1',  slug: 'grilled-salmon',   name: 'Grilled Salmon',      description: 'Atlantic salmon fillet with lemon herb butter',        category: 'Fish',       tags: ['gluten-free', 'high-protein'], imageUrl: '' },
  { id: 'd2',  slug: 'beef-bourguignon', name: 'Beef Bourguignon',    description: 'Slow-braised beef in red wine with mushrooms',          category: 'Meat',       tags: ['hearty', 'classic'], imageUrl: '' },
  { id: 'd3',  slug: 'ratatouille',      name: 'Ratatouille',         description: 'Provençal vegetable stew with tomatoes and herbs',      category: 'Vegetarian', tags: ['vegan', 'gluten-free'], imageUrl: '' },
  { id: 'd4',  slug: 'chicken-caesar',   name: 'Chicken Caesar',      description: 'Grilled chicken, romaine, parmesan, croutons',         category: 'Poultry',    tags: ['classic'], imageUrl: '' },
  { id: 'd5',  slug: 'pasta-carbonara',  name: 'Pasta Carbonara',     description: 'Spaghetti with guanciale, egg, pecorino and pepper',   category: 'Pasta',      tags: ['italian', 'rich'], imageUrl: '' },
  { id: 'd6',  slug: 'mushroom-risotto', name: 'Mushroom Risotto',    description: 'Arborio rice with wild mushrooms and truffle oil',      category: 'Vegetarian', tags: ['gluten-free', 'umami'], imageUrl: '' },
  { id: 'd7',  slug: 'duck-confit',      name: 'Duck Confit',         description: 'Slow-cooked duck leg with cherry gastrique',            category: 'Poultry',    tags: ['french', 'rich'], imageUrl: '' },
  { id: 'd8',  slug: 'lobster-bisque',   name: 'Lobster Bisque',      description: 'Creamy bisque with cognac and fresh lobster',           category: 'Fish',       tags: ['seafood', 'premium'], imageUrl: '' },
  { id: 'd9',  slug: 'lamb-tagine',      name: 'Lamb Tagine',         description: 'Moroccan spiced lamb with apricots and almonds',        category: 'Meat',       tags: ['spiced', 'hearty'], imageUrl: '' },
  { id: 'd10', slug: 'vegetable-curry',  name: 'Vegetable Curry',     description: 'Coconut milk curry with seasonal vegetables',           category: 'Vegetarian', tags: ['vegan', 'spiced'], imageUrl: '' },
  { id: 'd11', slug: 'tuna-tartare',     name: 'Tuna Tartare',        description: 'Fresh yellowfin tuna with avocado and sesame',         category: 'Fish',       tags: ['raw', 'light'], imageUrl: '' },
  { id: 'd12', slug: 'beef-tenderloin',  name: 'Beef Tenderloin',     description: 'Pan-seared fillet with truffle jus and potato gratin', category: 'Meat',       tags: ['premium', 'classic'], imageUrl: '' },
];

// ─── Mealie API types ────────────────────────────────────────────────────────

interface MealieCategory { id: string; name: string; slug: string }
interface MealieTag       { id: string; name: string; slug: string }

interface MealieRecipeSummary {
  id:             string;
  name:           string;
  slug:           string;
  description:    string | null;
  recipeCategory: MealieCategory[];
  tags:           MealieTag[];
}

interface MealiePage<T> {
  items:      T[];
  total:      number;
  page:       number;
  perPage:    number;
  totalPages: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Mock mode when no real Mealie URL/token is configured. */
const USE_MOCK = !TOKEN || !BASE_URL || BASE_URL === 'http://localhost:3000';

function apiHeaders(): HeadersInit {
  return TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};
}

function recipeImageUrl(id: string): string {
  // Mealie stores images keyed by recipe UUID, not slug.
  return `${API_ROOT}/api/media/recipes/${id}/images/original.webp`;
}

function toDishe(r: MealieRecipeSummary): Dish {
  return {
    id:          r.id,
    slug:        r.slug,
    name:        r.name,
    description: r.description ?? '',
    category:    r.recipeCategory[0]?.name ?? 'Other',
    tags:        r.tags.map((t) => t.name),
    imageUrl:    recipeImageUrl(r.id),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

function recipesUrl(page: number) {
  return `${API_ROOT}/api/recipes?page=${page}&perPage=100&orderBy=name&orderDirection=asc`;
}

export async function fetchDishes(signal?: AbortSignal): Promise<Dish[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return MOCK_DISHES;
  }

  const opts: RequestInit = { headers: apiHeaders(), signal };

  // Fetch page 1 to discover totalPages
  const first = await fetch(recipesUrl(1), opts);
  if (!first.ok) throw new Error(`Mealie ${first.status}: ${first.statusText}`);
  const firstData: MealiePage<MealieRecipeSummary> = await first.json();

  const { totalPages } = firstData;
  let all = [...firstData.items];

  // Fetch all remaining pages in parallel
  if (totalPages > 1) {
    const pages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const rest = await Promise.all(
      pages.map((p) =>
        fetch(recipesUrl(p), opts)
          .then((r) => {
            if (!r.ok) throw new Error(`Mealie ${r.status} on page ${p}`);
            return r.json() as Promise<MealiePage<MealieRecipeSummary>>;
          })
          .then((d) => d.items),
      ),
    );
    all = all.concat(rest.flat());
  }

  return all.map(toDishe);
}

const DAY_OFFSET: Record<string, number> = {
  Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6,
};

/** Returns YYYY-MM-DD using LOCAL time (no UTC shift). */
function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function slotDate(weekOf: string, day: string): string {
  const base = new Date(weekOf + 'T00:00:00');
  base.setDate(base.getDate() + (DAY_OFFSET[day] ?? 0));
  return localDateStr(base); // local time, not UTC
}

interface MealieMealPlanEntry { id: string }

/** Delete all existing Mealie meal plan entries for a Mon–Sun week. */
async function clearMealiePlanWeek(weekOf: string): Promise<void> {
  const sun = new Date(weekOf + 'T00:00:00');
  sun.setDate(sun.getDate() + 6);
  const url =
    `${API_ROOT}/api/households/mealplans?start_date=${weekOf}&end_date=${localDateStr(sun)}&page=1&perPage=100`;

  const res = await fetch(url, { headers: apiHeaders() });
  if (!res.ok) return; // tolerate read failures
  const data = await res.json() as { items: MealieMealPlanEntry[] };

  await Promise.all(
    data.items.map((entry) =>
      fetch(`${API_ROOT}/api/households/mealplans/${entry.id}`, {
        method: 'DELETE',
        headers: apiHeaders(),
      })
    )
  );
}

/**
 * Submit the same week plan for 13 consecutive weeks (~3 months).
 * Runs sequentially (one week at a time) to avoid hammering Mealie.
 * `onProgress(current, total)` is called before each week so the UI can update.
 */
export async function submit3MonthsPlan(
  payloads: WeeklyOrderPayload[],
  onProgress: (current: number, total: number) => void,
): Promise<void> {
  for (let i = 0; i < payloads.length; i++) {
    onProgress(i + 1, payloads.length);
    await submitWeeklyOrder(payloads[i]);
  }
}

export async function submitWeeklyOrder(payload: WeeklyOrderPayload): Promise<void> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    console.info('[mock] Meal plans:', payload);
    return;
  }

  // 1. Clear any existing entries for this week in Mealie
  await clearMealiePlanWeek(payload.weekOf);

  // 2. Create new entries (one per filled slot)
  await Promise.all(
    payload.slots.map((slot) =>
      fetch(`${API_ROOT}/api/households/mealplans`, {
        method:  'POST',
        headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          date:      slotDate(payload.weekOf, slot.day),
          entryType: slot.meal,
          recipeId:  slot.dishId,
          title:     '',
        }),
      }).then(async (r) => {
        if (!r.ok) {
          const body = await r.text().catch(() => '');
          throw new Error(`Meal plan failed (${slot.day} ${slot.meal}): HTTP ${r.status}${body ? ` — ${body.slice(0, 120)}` : ''}`);
        }
      })
    )
  );
}
