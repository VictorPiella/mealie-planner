import { useEffect, useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { MenuPanel } from './components/MenuPanel';
import { WeekBoard } from './components/WeekBoard';
import { DishCardDisplay } from './components/DishCard';
import { useWeekPlan } from './hooks/useWeekPlan';
import { fetchDishes, submitWeeklyOrder, submit3MonthsPlan } from './api/mealie';
import type { Dish, DayOfWeek, MealType } from './types';
import './App.css';

type ToastState = { message: string; type: 'success' | 'error' } | null;
type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Drag overlay state
  const [activeDish, setActiveDish] = useState<Dish | null>(null);
  const [activeOrigin, setActiveOrigin] = useState<'panel' | 'slot' | null>(null);

  const {
    plan,
    assignDish, removeDish, moveDish, clearPlan,
    buildPayload, buildPayloads3Months,
    filledCount,
  } = useWeekPlan();

  const assignedDishIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(plan).forEach(({ lunch, dinner }) => {
      if (lunch)  ids.add(lunch.id);
      if (dinner) ids.add(dinner.id);
    });
    return ids;
  }, [plan]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const controller = new AbortController();
    fetchDishes(controller.signal)
      .then(setDishes)
      .catch((e) => {
        if ((e as Error).name !== 'AbortError') {
          setError((e as Error).message ?? 'Failed to load recipes');
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current ?? {};
    setActiveDish(data.dish ?? null);
    setActiveOrigin(data.origin ?? 'panel');
  }

  function handleDragEnd(event: DragEndEvent) {
    const { over, active } = event;
    setActiveDish(null);
    setActiveOrigin(null);

    if (!over) return;

    const activeData = active.data.current ?? {};
    const overData   = over.data.current   ?? {};

    const dish: Dish         = activeData.dish;
    const origin             = activeData.origin as 'panel' | 'slot';
    const toDay: DayOfWeek   = overData.day;
    const toMeal: MealType   = overData.meal;

    if (!dish || !toDay || !toMeal) return;

    if (origin === 'panel') {
      assignDish(toDay, toMeal, dish);
    } else if (origin === 'slot') {
      const fromDay: DayOfWeek = activeData.day;
      const fromMeal: MealType = activeData.meal;
      if (fromDay && fromMeal && (fromDay !== toDay || fromMeal !== toMeal)) {
        moveDish(fromDay, fromMeal, toDay, toMeal);
      }
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSubmit() {
    if (filledCount === 0) return;
    setSubmitting(true);
    try {
      await submitWeeklyOrder(buildPayload());
      showToast('Meal plan saved to Mealie!', 'success');
    } catch (e) {
      showToast((e as Error).message ?? 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit3Months() {
    if (filledCount === 0) return;
    setSubmitting(true);
    setSubmitProgress('Preparing…');
    try {
      const payloads = buildPayloads3Months();
      await submit3MonthsPlan(payloads, (current, total) => {
        setSubmitProgress(`Week ${current} / ${total}`);
      });
      showToast(`3-month plan saved to Mealie! (13 weeks)`, 'success');
    } catch (e) {
      showToast((e as Error).message ?? 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
      setSubmitProgress(null);
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="app-layout">
        <MenuPanel
          dishes={dishes}
          loading={loading}
          error={error}
          filledCount={filledCount}
          onSubmit={handleSubmit}
          onSubmit3Months={handleSubmit3Months}
          onClear={clearPlan}
          submitting={submitting}
          submitProgress={submitProgress}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          assignedDishIds={assignedDishIds}
        />
        <main className="board-area">
          <WeekBoard plan={plan} onRemove={removeDish} />
        </main>

        {toast && (
          <div className={`toast toast--${toast.type}`} role="status">
            {toast.message}
          </div>
        )}

        <button className="print-fab" onClick={() => window.print()} title="Print week plan">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Print week
        </button>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDish && (
          <DishCardDisplay
            dish={activeDish}
            inSlot={activeOrigin === 'slot'}
            compact
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
