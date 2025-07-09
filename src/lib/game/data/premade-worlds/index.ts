import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import { floptropicaWorld } from './floptropica';
import { frozenWastelandWorld } from './frozen-wasteland';
import { mageAcademyWorld } from './mage-academy';
import { detectiveNoirWorld } from './detective-noir';
import { generationShipWorld } from './generation-ship';
import { hauntedMansionWorld } from './haunted-mansion';
import { spaceWesternWorld } from './space-western';
import { underwaterKingdomWorld } from './underwater-kingdom';

export const premadeWorlds: Record<string, GenerateWorldSetupOutput> = {
  // English Keywords
  'floptropica': floptropicaWorld,
  'frozen wasteland': frozenWastelandWorld,
  'mage academy': mageAcademyWorld,
  'detective noir': detectiveNoirWorld,
  'cyberpunk city': detectiveNoirWorld,
  'generation ship': generationShipWorld,
  'rogue ai': generationShipWorld,
  'haunted mansion': hauntedMansionWorld,
  'shifting rooms': hauntedMansionWorld,
  'underwater kingdom': underwaterKingdomWorld,
  'mysterious plague': underwaterKingdomWorld,
  'space western': spaceWesternWorld,
  'desert planet': spaceWesternWorld,

  // Vietnamese Keywords
  'tàn tích băng giá': frozenWastelandWorld,
  'học viện mây trôi': mageAcademyWorld,
  'thành phố cyberpunk': detectiveNoirWorld,
  'thám tử': detectiveNoirWorld,
  'tàu thế hệ': generationShipWorld,
  'ai nổi loạn': generationShipWorld,
  'biệt thự ma ám': hauntedMansionWorld,
  'vương quốc dưới nước': underwaterKingdomWorld,
  'viễn tây không gian': spaceWesternWorld,
};
