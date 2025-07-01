export function PlayerIcon() {
  return (
    <div className="absolute inset-0 flex items-center justify-center animate-jump-in">
      <span className="text-3xl drop-shadow-lg" role="img" aria-label="Player">🧑</span>
    </div>
  );
}

export function EnemyIcon() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="text-3xl drop-shadow-lg" role="img" aria-label="Enemy">👹</span>
    </div>
  );
}

export function SwordIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 17.5l-8-8"/>
        <path d="M5 3l16 16"/>
        <path d="M17 3l4 4"/>
        <path d="M3 17l4 4"/>
    </svg>
  );
}

export function NpcIcon() {
  return (
    <div className="absolute bottom-0 left-1 text-lg drop-shadow-lg" aria-label="NPC">
      <span>🗣️</span>
    </div>
  );
}

export function ItemIcon() {
  return (
    <div className="absolute bottom-0 right-1 text-lg drop-shadow-lg" aria-label="Item">
      <span>✨</span>
    </div>
  );
}
