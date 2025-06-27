"use client";

import { useState } from 'react';
import GameLayout from '@/components/game/game-layout';
import { WorldSetup } from '@/components/game/world-setup';
import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';

export default function Home() {
  const [worldSetup, setWorldSetup] = useState<GenerateWorldSetupOutput | null>(null);

  if (!worldSetup) {
    return <WorldSetup onWorldCreated={setWorldSetup} />;
  }
  
  return (
    <main>
      <GameLayout worldSetup={worldSetup} />
    </main>
  );
}
