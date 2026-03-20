import { useDroppable } from '@dnd-kit/core';
import { DishCard } from './DishCard';
import type { DayOfWeek, Dish, MealType } from '../types';
import { DAY_LABELS } from '../types';

interface SlotProps {
  day: DayOfWeek;
  meal: MealType;
  dish: Dish | null;
  onRemove: () => void;
}

function MealSlot({ day, meal, dish, onRemove }: SlotProps) {
  const slotId = `${day}__${meal}`;
  const { isOver, setNodeRef } = useDroppable({ id: slotId, data: { day, meal } });

  return (
    <div
      ref={setNodeRef}
      className={`meal-slot${isOver ? ' meal-slot--over' : ''}${dish ? ' meal-slot--filled' : ''}`}
    >
      <span className="meal-slot__label">{meal}</span>
      {dish ? (
        <DishCard
          dish={dish}
          inSlot
          onRemove={onRemove}
          dragIdPrefix={`slot-${day}-${meal}`}
          dragData={{ origin: 'slot', day, meal }}
        />
      ) : (
        <div className="meal-slot__empty">Drop a dish here</div>
      )}
    </div>
  );
}

interface DayColumnProps {
  day: DayOfWeek;
  lunch: Dish | null;
  dinner: Dish | null;
  onRemove: (meal: MealType) => void;
}

export function DayColumn({ day, lunch, dinner, onRemove }: DayColumnProps) {
  return (
    <div className="day-column">
      <div className="day-column__header">
        <span className="day-column__abbr">{day}</span>
        <span className="day-column__full">{DAY_LABELS[day]}</span>
      </div>
      <MealSlot day={day} meal="lunch" dish={lunch} onRemove={() => onRemove('lunch')} />
      <MealSlot day={day} meal="dinner" dish={dinner} onRemove={() => onRemove('dinner')} />
    </div>
  );
}
