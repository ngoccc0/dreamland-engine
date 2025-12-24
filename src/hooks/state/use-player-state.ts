'use client';

import { useState } from "react";
import type { PlayerBehaviorProfile, PlayerStatus } from "@/core/types/game";
import { ensurePlayerStats } from '@/core/factories/statistics-factory';

export function usePlayerState() {
    const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });

    // Visual Movement State
    const [visualPlayerPosition, setVisualPlayerPosition] = useState({ x: 0, y: 0 });
    const [isAnimatingMove, setIsAnimatingMove] = useState(false);
    const [visualMoveFrom, setVisualMoveFrom] = useState<{ x: number; y: number } | null>(null);
    const [visualMoveTo, setVisualMoveTo] = useState<{ x: number; y: number } | null>(null);
    const [visualJustLanded, setVisualJustLanded] = useState(false);

    const [playerBehaviorProfile, setPlayerBehaviorProfile] = useState<PlayerBehaviorProfile>({
        name: '', description: '', quantity: 0, tier: 0, emoji: '',
        moves: 0, attacks: 0, crafts: 0, customActions: 0
    });

    const [playerStats, setPlayerStats] = useState<PlayerStatus>(ensurePlayerStats());

    // Quest & Achievement State
    const [activeQuests, setActiveQuests] = useState<any[]>([]);
    const [unlockedAchievements, setUnlockedAchievements] = useState<any[]>([]);

    return {
        playerPosition, setPlayerPosition,
        visualPlayerPosition, setVisualPlayerPosition,
        isAnimatingMove, setIsAnimatingMove,
        visualMoveFrom, setVisualMoveFrom,
        visualMoveTo, setVisualMoveTo,
        visualJustLanded, setVisualJustLanded,
        playerBehaviorProfile, setPlayerBehaviorProfile,
        playerStats, setPlayerStats,
        activeQuests, setActiveQuests,
        unlockedAchievements, setUnlockedAchievements
    };
}
