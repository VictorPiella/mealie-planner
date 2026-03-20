import { DayColumn } from './DayColumn';
import { DAYS } from '../types';
import type { DayOfWeek, MealType, WeekPlan } from '../types';

interface WeekBoardProps {
  plan: WeekPlan;
  onRemove: (day: DayOfWeek, meal: MealType) => void;
}

export function WeekBoard({ plan, onRemove }: WeekBoardProps) {
  return (
    <div className="week-board">
      {DAYS.map((day) => (
        <DayColumn
          key={day}
          day={day}
          lunch={plan[day].lunch}
          dinner={plan[day].dinner}
          onRemove={(meal) => onRemove(day, meal)}
        />
      ))}
    </div>
  );
}
