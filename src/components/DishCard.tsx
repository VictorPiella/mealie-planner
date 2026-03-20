import { useDraggable } from '@dnd-kit/core';
import type { Dish } from '../types';

// ─── Image placeholder (shown when imageUrl is absent or broken) ─────────────

function DishImage({ dish, size }: { dish: Dish; size: 'card' | 'thumb' }) {
  if (!dish.imageUrl) return null;

  return (
    <img
      className={`dish-img dish-img--${size}`}
      src={dish.imageUrl}
      alt={dish.name}
      loading="lazy"
      draggable="false"
      onError={(e) => {
        const img = e.currentTarget as HTMLImageElement;
        // Hide the whole image wrapper, not just the img, so no empty box shows
        const wrap = img.closest('.dish-card__image-wrap') ?? img.parentElement;
        if (wrap) (wrap as HTMLElement).style.display = 'none';
      }}
    />
  );
}

// ─── Pure visual card (no drag, safe inside DragOverlay) ────────────────────

interface DishCardDisplayProps {
  dish: Dish;
  inSlot?: boolean;
  onRemove?: () => void;
  compact?: boolean;
}

export function DishCardDisplay({ dish, inSlot = false, onRemove, compact }: DishCardDisplayProps) {
  if (inSlot) {
    return (
      <div className={`dish-card dish-card--slot${compact ? ' dish-card--compact' : ''}`}>
        {dish.imageUrl && (
          <div className="dish-card__image-wrap">
            <DishImage dish={dish} size="card" />
            <span className="dish-card__category-badge">{dish.category}</span>
          </div>
        )}
        <div className="dish-card__body">
          {!dish.imageUrl && <span className="dish-card__category">{dish.category}</span>}
          <span className="dish-card__name">{dish.name}</span>
        </div>
        {onRemove && (
          <button
            className="dish-card__remove dish-card__remove--abs"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            aria-label={`Remove ${dish.name}`}
          >
            ×
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`dish-card${compact ? ' dish-card--compact' : ''}`}>
      {dish.imageUrl && (
        <div className="dish-card__image-wrap">
          <DishImage dish={dish} size="card" />
          <span className="dish-card__category-badge">{dish.category}</span>
        </div>
      )}
      <div className="dish-card__body">
        {!dish.imageUrl && (
          <span className="dish-card__category">{dish.category}</span>
        )}
        <span className="dish-card__name">{dish.name}</span>
        {!compact && dish.description && (
          <p className="dish-card__desc">{dish.description}</p>
        )}
        {dish.tags.length > 0 && !compact && (
          <div className="dish-card__tags">
            {dish.tags.map((tag) => (
              <span key={tag} className="dish-card__tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Draggable wrapper ───────────────────────────────────────────────────────

interface DishCardProps extends DishCardDisplayProps {
  dragIdPrefix: string;
  dragData?: Record<string, unknown>;
}

export function DishCard({ dish, inSlot, onRemove, dragIdPrefix, dragData }: DishCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${dragIdPrefix}-${dish.id}`,
    data: { dish, ...dragData },
  });

  // No transform applied — DragOverlay handles visual movement so the source stays put.
  return (
    <div
      ref={setNodeRef}
      className={isDragging ? 'dish-card-drag-source' : undefined}
      {...listeners}
      {...attributes}
    >
      <DishCardDisplay dish={dish} inSlot={inSlot} onRemove={onRemove} />
    </div>
  );
}
