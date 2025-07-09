// Re-export Lucide icons for a single point of management
export {
  Backpack,
  Shield,
  Cpu,
  Hammer,
  WandSparkles,
  Home,
  BedDouble,
  Thermometer,
  LifeBuoy,
  FlaskConical,
  Settings,
  BrainCircuit,
  Dice6,
  Bot,
  Feather,
  Languages,
  Download,
  LogIn,
  LogOut,
  UserCircle2,
  X,
  Heart,
  Loader2,
  Book,
  Star,
  Sparkles,
  Wand2,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Zap,
  Footprints,
  MapPin,
  Menu,
  Palette,
  Type,
} from 'lucide-react';


// Custom or specific icons
export function PlayerIcon() {
  return (
    <span className="text-base drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]" role="img" aria-label="Player">🧑</span>
  );
}

export function EnemyIcon({ emoji }: { emoji: string }) {
  return (
    <span className="text-sm drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]" role="img" aria-label="Enemy">{emoji}</span>
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
    <span className="text-xs drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]" role="img" aria-label="NPC">🗣️</span>
  );
}

export function ItemIcon({ emoji }: { emoji: string }) {
  return (
    <span className="text-xs drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]" role="img" aria-label="Item">{emoji}</span>
  );
}
