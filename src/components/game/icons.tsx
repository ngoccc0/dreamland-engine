export function PlayerIcon() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-1">
      <svg
        className="w-full h-full drop-shadow-lg"
        viewBox="0 0 100 100"
        aria-label="Player"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="#DC143C"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="5"
        />
      </svg>
    </div>
  );
}

export function EnemyIcon() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-1">
      <svg
        className="w-full h-full drop-shadow-lg"
        viewBox="0 0 100 100"
        aria-label="Enemy"
      >
        <rect
          x="15"
          y="15"
          width="70"
          height="70"
          fill="#FF6347"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="5"
          transform="rotate(45 50 50)"
        />
      </svg>
    </div>
  );
}
