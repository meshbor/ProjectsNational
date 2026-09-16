"use client";

export function DigestToolbar({
  description,
  regionOn,
  onRegionToggle,
  onRefresh,
  refreshing,
}: {
  description: string;
  regionOn?: boolean;
  onRegionToggle?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <header className="topbar topbar-stack">
      <div className="topbar-row">
        <p className="eyebrow">{description}</p>
        {onRegionToggle ? (
          <button
            type="button"
            className={regionOn ? "filter-chip is-active" : "filter-chip"}
            aria-pressed={regionOn}
            onClick={onRegionToggle}
          >
            СПб · ЛО
          </button>
        ) : null}
      </div>
      {onRefresh ? (
        <button
          type="button"
          className="load-news"
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Подгружаю новости…" : "Подгрузить новости"}
        </button>
      ) : null}
    </header>
  );
}
