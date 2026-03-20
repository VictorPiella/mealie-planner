import { useState, useMemo } from 'react';
import { DishCard } from './DishCard';
import type { Dish } from '../types';

interface MenuPanelProps {
  dishes: Dish[];
  loading: boolean;
  error: string | null;
  filledCount: number;
  onSubmit: () => void;
  onSubmit3Months: () => void;
  onClear: () => void;
  submitting: boolean;
  submitProgress: string | null;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  assignedDishIds: Set<string>;
}

export function MenuPanel({
  dishes,
  loading,
  error,
  filledCount,
  onSubmit,
  onSubmit3Months,
  onClear,
  submitting,
  submitProgress,
  theme,
  onToggleTheme,
  assignedDishIds,
}: MenuPanelProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [hideAssigned, setHideAssigned] = useState(false);

  // Derive categories from actual dishes
  const categories = useMemo(() => {
    const seen = new Set<string>();
    dishes.forEach((d) => seen.add(d.category));
    return ['All', ...Array.from(seen).sort()];
  }, [dishes]);

  const filtered = useMemo(() => {
    return dishes.filter((d) => {
      if (hideAssigned && assignedDishIds.has(d.id)) return false;
      const matchCat = category === 'All' || d.category === category;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [dishes, search, category, hideAssigned, assignedDishIds]);

  // Cap rendered cards to keep the DOM lean; search narrows the list further
  const DISPLAY_LIMIT = 80;
  const visible = filtered.slice(0, DISPLAY_LIMIT);
  const hidden  = filtered.length - visible.length;

  const totalSlots = 14;

  return (
    <aside className="menu-panel">
      {/* Header */}
      <div className="menu-panel__header">
        <div className="menu-panel__logo">
          <span className="menu-panel__logo-icon">🍽</span>
          <span className="menu-panel__logo-text">Mealie Planner</span>
        </div>
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      {/* Search + category filter */}
      <div className="menu-panel__filters">
        <input
          className="menu-panel__search"
          type="search"
          placeholder="Search recipes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="menu-panel__cats">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`cat-btn${category === cat ? ' cat-btn--active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <label className="toggle-hide-assigned">
          <input
            type="checkbox"
            checked={hideAssigned}
            onChange={(e) => setHideAssigned(e.target.checked)}
          />
          Hide already assigned
        </label>
      </div>

      {/* Dish list */}
      <div className="menu-panel__list">
        {loading && <div className="menu-panel__state">Loading recipes…</div>}
        {error && <div className="menu-panel__state menu-panel__state--error">{error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="menu-panel__state">No recipes match your search.</div>
        )}
        {!loading &&
          !error &&
          visible.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              dragIdPrefix="panel"
              dragData={{ origin: 'panel' }}
            />
          ))}
        {!loading && !error && hidden > 0 && (
          <div className="menu-panel__overflow">
            +{hidden} more — search or filter to narrow results
          </div>
        )}
      </div>

      {/* Footer: progress + actions */}
      <div className="menu-panel__footer">
        <div className="menu-panel__progress">
          <div className="progress-bar">
            <div
              className="progress-bar__fill"
              style={{ width: `${(filledCount / totalSlots) * 100}%` }}
            />
          </div>
          <span className="progress-label">{filledCount} / {totalSlots} slots filled</span>
        </div>
        <div className="menu-panel__actions">
          <button
            className="btn btn--ghost"
            onClick={onClear}
            disabled={submitting || filledCount === 0}
          >
            Clear
          </button>
          <button
            className="btn btn--primary"
            onClick={onSubmit}
            disabled={submitting || filledCount === 0}
            title="Send this week's plan to Mealie"
          >
            {submitting && !submitProgress ? 'Submitting…' : 'This week'}
          </button>
          <button
            className="btn btn--accent"
            onClick={onSubmit3Months}
            disabled={submitting || filledCount === 0}
            title="Repeat this week's plan for 3 months (13 weeks) in Mealie"
          >
            {submitProgress ?? '3 months'}
          </button>
        </div>
      </div>
    </aside>
  );
}
