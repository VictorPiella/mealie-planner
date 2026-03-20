export type MealType = 'lunch' | 'dinner';

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

export interface Dish {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  imageUrl?: string;
}

export interface SlotId {
  day: DayOfWeek;
  meal: MealType;
}

export interface Slot extends SlotId {
  dish: Dish | null;
}

export type WeekPlan = Record<DayOfWeek, Record<MealType, Dish | null>>;

export interface SlotAssignment {
  day: DayOfWeek;
  meal: MealType;
  dishId: string;
  dishName: string;
}

export interface WeeklyOrderPayload {
  weekOf: string;
  slots: SlotAssignment[];
}
