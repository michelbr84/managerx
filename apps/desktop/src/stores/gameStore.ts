import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Team, Player, Staff, Fixture, MatchResult } from '@managerx/core-sim';
import type { Club, League } from '@managerx/content';

export interface GameSave {
  id: string;
  managerName: string;
  clubId: string;
  currentDate: string;
  season: number;
  createdAt: string;
  lastPlayed: string;
}

export interface CurrentGame {
  save: GameSave;
  club: Club;
  league: League;
  players: Player[];
  staff: Staff[];
  fixtures: Fixture[];
  currentDate: Date;
  season: number;
}

export interface GameState {
  // Game saves
  saves: GameSave[];
  currentGame: CurrentGame | null;
  
  // UI state
  isLoading: boolean;
  currentScreen: string;
  
  // Actions
  createNewGame: (managerName: string, clubId: string) => Promise<void>;
  loadGame: (saveId: string) => Promise<void>;
  saveGame: () => Promise<void>;
  deleteGame: (saveId: string) => Promise<void>;
  
  // Navigation
  setCurrentScreen: (screen: string) => void;
  
  // Game progression
  advanceDate: (days: number) => void;
  simulateMatch: (fixtureId: string) => Promise<MatchResult>;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      saves: [],
      currentGame: null,
      isLoading: false,
      currentScreen: 'menu',
      
      createNewGame: async (managerName: string, clubId: string) => {
        set({ isLoading: true });
        
        try {
          // Create new game save
          const newSave: GameSave = {
            id: `save_${Date.now()}`,
            managerName,
            clubId,
            currentDate: '2024-08-01',
            season: 2024,
            createdAt: new Date().toISOString(),
            lastPlayed: new Date().toISOString(),
          };
          
          // TODO: Load club data from @managerx/content
          // TODO: Initialize database with @managerx/db
          
          set(state => ({
            saves: [...state.saves, newSave],
            currentGame: null, // Will be loaded after initialization
            isLoading: false,
            currentScreen: 'calendar',
          }));
          
        } catch (error) {
          console.error('Failed to create new game:', error);
          set({ isLoading: false });
        }
      },
      
      loadGame: async (saveId: string) => {
        set({ isLoading: true });
        
        try {
          const save = get().saves.find(s => s.id === saveId);
          if (!save) {
            throw new Error('Save not found');
          }
          
          // TODO: Load game data from database
          // TODO: Restore game state
          
          set({
            currentGame: null, // Will be loaded from database
            isLoading: false,
            currentScreen: 'calendar',
          });
          
        } catch (error) {
          console.error('Failed to load game:', error);
          set({ isLoading: false });
        }
      },
      
      saveGame: async () => {
        const { currentGame } = get();
        if (!currentGame) return;
        
        try {
          // TODO: Save game state to database
          // TODO: Update save metadata
          
          set(state => ({
            saves: state.saves.map(save =>
              save.id === currentGame.save.id
                ? { ...save, lastPlayed: new Date().toISOString() }
                : save
            ),
          }));
          
        } catch (error) {
          console.error('Failed to save game:', error);
        }
      },
      
      deleteGame: async (saveId: string) => {
        try {
          // TODO: Delete from database
          
          set(state => ({
            saves: state.saves.filter(save => save.id !== saveId),
            currentGame: state.currentGame?.save.id === saveId ? null : state.currentGame,
          }));
          
        } catch (error) {
          console.error('Failed to delete game:', error);
        }
      },
      
      setCurrentScreen: (screen: string) => {
        set({ currentScreen: screen });
      },
      
      advanceDate: (days: number) => {
        set(state => {
          if (!state.currentGame) return state;
          
          const newDate = new Date(state.currentGame.currentDate);
          newDate.setDate(newDate.getDate() + days);
          
          return {
            currentGame: {
              ...state.currentGame,
              currentDate: newDate,
            },
          };
        });
      },
      
      simulateMatch: async (fixtureId: string) => {
        const { currentGame } = get();
        if (!currentGame) {
          throw new Error('No current game');
        }
        
        // TODO: Implement match simulation using @managerx/core-sim
        // This should be done in a web worker to avoid blocking the main thread
        
        const mockResult: MatchResult = {
          homeScore: 2,
          awayScore: 1,
          stats: {
            possession: { home: 58, away: 42 },
            shots: { home: 12, away: 8 },
            shotsOnTarget: { home: 6, away: 3 },
            xG: { home: 1.8, away: 0.9 },
            passes: { home: 445, away: 312 },
            passAccuracy: { home: 84, away: 79 },
            fouls: { home: 12, away: 15 },
            corners: { home: 6, away: 4 },
            yellowCards: { home: 2, away: 3 },
            redCards: { home: 0, away: 0 },
          },
          events: [
            {
              minute: 23,
              type: 'goal',
              team: 'home',
              player: 'João Silva',
              description: 'GOAL! João Silva scores for Home FC',
              xG: 0.24,
            },
          ],
          duration: 94,
        };
        
        return mockResult;
      },
    }),
    {
      name: 'managerx-game-store',
      partialize: (state) => ({
        saves: state.saves,
        currentScreen: state.currentScreen,
      }),
    }
  )
);
