"use client";

import { useState } from 'react';
import GameLayout from '@/components/game/game-layout';
import { WorldSetup } from '@/components/game/world-setup';
import type { WorldConcept } from '@/ai/flows/generate-world-setup';
import { LanguageSelector } from '@/components/game/language-selector';

export default function Home() {
  const [languageSelected, setLanguageSelected] = useState(false);
  const [worldSetup, setWorldSetup] = useState<WorldConcept | null>(null);

  if (!languageSelected) {
    return <LanguageSelector onLanguageSelected={() => setLanguageSelected(true)} />;
  }
  
  if (!worldSetup) {
    return <WorldSetup onWorldCreated={setWorldSetup} />;
  }
  
  return (
    <main>
      <GameLayout worldSetup={worldSetup} />
    </main>
  );
}
