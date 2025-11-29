import React from 'react';

// Helper: render emoji or image file (dùng lại cho mọi thành phần)
export function renderItemEmoji(emoji: any, size: number = 20) {
  if (emoji === null || emoji === undefined) return null;

  // If it's a React element, return as-is
  if (React.isValidElement(emoji)) return emoji;

  // If it's an object that describes an image, try common fields
  if (typeof emoji === 'object') {
    const src = (emoji.src || emoji.url || emoji.file || emoji.path || emoji.image) as string | undefined;
    if (src) {
      const href = typeof src === 'string' && src.startsWith('/') ? src : `/asset/${String(src)}`;
      return <img src={href} alt="icon" style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle' }} />;
    }
    // fallback to nested string like { emoji: '🪙' }
    if (typeof (emoji as any).emoji === 'string') return renderItemEmoji((emoji as any).emoji, size);
    return null;
  }

  // If it's a string short token, render inline; otherwise treat as asset path
  if (typeof emoji === 'string') {
    if (/^[^./\\]{1,3}$/.test(emoji)) {
      return <span>{emoji}</span>;
    }
    const href = emoji.startsWith('/') ? emoji : `/asset/${emoji}`;
    return <img src={href} alt="icon" style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle' }} />;
  }

  // Fallback: stringify
  return <span>{String(emoji)}</span>;
}
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
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Map,
  BaggageClaim,
  ListTodo,
  Beef,
  Search,
} from 'lucide-react';


// Custom or specific icons
export function PlayerIcon() {
  return (
    <span className="text-base drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]" role="img" aria-label="Player">🧑</span>
  );
}

export function EnemyIcon({ emoji, size = 20 }: { emoji: string, size?: number }) {
  return (
    <span className="text-sm drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]" role="img" aria-label="Enemy">{renderItemEmoji(emoji, size)}</span>
  );
}

export function SwordIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 17.5l-8-8" />
      <path d="M5 3l16 16" />
      <path d="M17 3l4 4" />
      <path d="M3 17l4 4" />
    </svg>
  );
}

export function NpcIcon() {
  return (
    <span className="text-xs drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]" role="img" aria-label="NPC">🗣️</span>
  );
}

export function ItemIcon({ emoji, size = 18 }: { emoji: string, size?: number }) {
  return (
    <span className="text-xs drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]" role="img" aria-label="Item">{renderItemEmoji(emoji, size)}</span>
  );
}
