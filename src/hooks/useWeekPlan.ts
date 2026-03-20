import { useState, useCallback, useEffect } from 'react';
import { DAYS } from '../types';
import type { Dish, DayOfWeek, MealType, WeekPlan, WeeklyOrderPayload, SlotAssignment } from '../types';

// ─── Date helpers (local time only, never UTC) ────────────────────────────────

export function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getMondayOf(date: Date): string {
  const d = new Date(date);
  const dow = d.getDay(); // 0 = Sun
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return localDateStr(d);
}

function addWeeks(monday: string, n: number): string {
  const d = new Date(monday + 'T00:00:00');
  d.setDate(d.getDate() + n * 7);
  return localDateStr(d);
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY     = 'mealie-week-plan';
const LEGACY_KEYS     = ['melier-week-plan', 'melier-multi-plan'] as const;

function buildEmptyPlan(): WeekPlan {
  return Object.fromEntries(
    DAYS.map((day) => [day, { lunch: null, dinner: null }])
  ) as WeekPlan;
}

function loadPlan(): WeekPlan {
  try {
    // Try current key first
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as WeekPlan;
      if (parsed && typeof parsed === 'object') return parsed;
    }

    // Migrate from any legacy key
    for (const legacyKey of LEGACY_KEYS) {
      const legacy = localStorage.getItem(legacyKey);
      if (!legacy) continue;
      const parsed = JSON.parse(legacy);
      if (!parsed || typeof parsed !== 'object') continue;
      const keys = Object.keys(parsed);
      // Multi-plan format (keyed by YYYY-MM-DD) → extract this week
      if (keys.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(keys[0])) {
        const todayMonday = getMondayOf(new Date());
        return (parsed[todayMonday] as WeekPlan) ?? buildEmptyPlan();
      }
      // Direct WeekPlan format
      return parsed as WeekPlan;
    }
  } catch {}
  return buildEmptyPlan();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWeekPlan() {
  const [plan, setPlan] = useState<WeekPlan>(loadPlan);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  }, [plan]);

  const assignDish = useCallback(
    (day: DayOfWeek, meal: MealType, dish: Dish) =>
      setPlan((prev) => ({ ...prev, [day]: { ...prev[day], [meal]: dish } })),
    []
  );

  const removeDish = useCallback(
    (day: DayOfWeek, meal: MealType) =>
      setPlan((prev) => ({ ...prev, [day]: { ...prev[day], [meal]: null } })),
    []
  );

  const moveDish = useCallback(
    (fromDay: DayOfWeek, fromMeal: MealType, toDay: DayOfWeek, toMeal: MealType) =>
      setPlan((prev) => {
        const dish = prev[fromDay][fromMeal];
        if (!dish) return prev;
        const next = { ...prev };
        next[fromDay] = { ...next[fromDay], [fromMeal]: null };
        next[toDay]   = { ...next[toDay],   [toMeal]:   dish };
        return next;
      }),
    []
  );

  const clearPlan = useCallback(() => setPlan(buildEmptyPlan), []);

  /** Collect filled slots from current plan */
  const buildSlots = useCallback((): SlotAssignment[] => {
    const slots: SlotAssignment[] = [];
    for (const day of DAYS) {
      for (const meal of ['lunch', 'dinner'] as MealType[]) {
        const dish = plan[day]?.[meal];
        if (dish) slots.push({ day, meal, dishId: dish.id, dishName: dish.name });
      }
    }
    return slots;
  }, [plan]);

  /** Single-week payload (for "Confirm Order") */
  const buildPayload = useCallback((): WeeklyOrderPayload => ({
    weekOf: getMondayOf(new Date()),
    slots:  buildSlots(),
  }), [buildSlots]);

  /**
   * 13 payloads covering weeks 0–12 from today's Monday (~3 months).
   * All weeks carry the same slots — same recipes, different dates.
   */
  const buildPayloads3Months = useCallback((): WeeklyOrderPayload[] => {
    const todayMonday = getMondayOf(new Date());
    const slots = buildSlots();
    return Array.from({ length: 13 }, (_, i) => ({
      weekOf: addWeeks(todayMonday, i),
      slots,
    }));
  }, [buildSlots]);

  const filledCount = DAYS.reduce((acc, day) => {
    if (plan[day]?.lunch)  acc++;
    if (plan[day]?.dinner) acc++;
    return acc;
  }, 0);

  return {
    plan,
    assignDish, removeDish, moveDish, clearPlan,
    buildPayload, buildPayloads3Months,
    filledCount,
  };
}
