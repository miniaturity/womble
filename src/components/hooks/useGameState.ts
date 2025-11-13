import { useState } from "react";


interface GameState {
  word: string | null;
  combo: number;
  score: {
    mult: number;
    points: number;
    streak: number;
  }
  info: {
    solved: boolean;
    greens: number;
    yellows: number;
    grays: number;
  }
}

const defaultState: GameState = {
  word: null,
  combo: 0,
  score: {
    mult: 1,
    points: 0,
    streak: 0
  },
  info: {
    solved: false,
    greens: 0,
    yellows: 0,
    grays: 0
  }
}

export function useGameState() {
  const [gs, setGs] = useState<GameState>();


}