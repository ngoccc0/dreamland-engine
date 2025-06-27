export function PlayerIcon() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-1">
      <div
        className="w-full h-full bg-map-player rounded-full shadow-lg ring-2 ring-white/50"
        aria-label="Player"
      />
    </div>
  );
}

export function EnemyIcon() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-1">
      <div
        className="w-full h-full bg-map-enemy transform rotate-45 shadow-lg ring-2 ring-white/50"
        aria-label="Enemy"
      />
    </div>
  );
}
