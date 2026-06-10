import {
  Landmark,
  TrendingUp,
  Globe2,
  Clapperboard,
  Cpu,
  Trophy,
  ShieldAlert,
  History,
  CircleDot,
  type LucideIcon,
} from 'lucide-react';

/** Map a category id → lucide icon. Kept separate from categories.ts so the
 *  data module stays framework-free for Node scripts. */
const ICONS: Record<string, LucideIcon> = {
  politics: Landmark,
  economy: TrendingUp,
  foreign: Globe2,
  culture: Clapperboard,
  science: Cpu,
  sport: Trophy,
  security: ShieldAlert,
  overview: History,
};

export function getCategoryIcon(categoryId: string): LucideIcon {
  return ICONS[categoryId] ?? CircleDot;
}
