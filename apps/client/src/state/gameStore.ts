import { create } from 'zustand';
import type { GameState } from '@sam-simul/shared';

interface GameStoreState {
  gameState: GameState | null;
  hasSubmittedThisTurn: boolean;
  setGameState: (state: GameState) => void;
  markSubmitted: () => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  gameState: null,
  hasSubmittedThisTurn: false,
  setGameState: (state) =>
    set((prev) => ({
      gameState: state,
      // A fresh turn (higher turnNumber) always resets the local "submitted" flag.
      hasSubmittedThisTurn: prev.gameState?.turnNumber === state.turnNumber ? prev.hasSubmittedThisTurn : false,
    })),
  markSubmitted: () => set({ hasSubmittedThisTurn: true }),
}));
