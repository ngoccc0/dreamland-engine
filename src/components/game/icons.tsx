export function PlayerIcon() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
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
    <div className="absolute bottom-1 left-1 p-0.5 bg-black/50 rounded-sm" aria-label="NPC">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
  );
}

export function ItemIcon() {
  return (
    <div className="absolute bottom-1 right-1 p-0.5 bg-black/50 rounded-sm" aria-label="Item">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3h12l4 6-10 13L2 9z"/>
        <path d="m12 22 4-13-3-6h-2L8 9l4 13"/>
        <path d="M2 9h20"/>
      </svg>
    </div>
  );
}
