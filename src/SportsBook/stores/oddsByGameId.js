import { create } from 'zustand';

export const useOddsByGameIdStore = create((set) => ({
  byGameId: {},

  setOdds: (gameId, payload) =>
    set((s) => ({
      byGameId: { ...s.byGameId, [gameId]: payload },
    })),

  mergeOdds: (gameId, updater) =>
    set((s) => {
      const prev = s.byGameId[gameId] ?? null;
      const next = updater(prev);
      return { byGameId: { ...s.byGameId, [gameId]: next } };
    }),

  clearGame: (gameId) =>
    set((s) => {
      const next = { ...s.byGameId };
      delete next[gameId];
      return { byGameId: next };
    }),

  reset: () => set({ byGameId: {} }),
}));

export function selectOdds(gameId) {
  return (s) => s.byGameId[gameId] ?? null;
}
