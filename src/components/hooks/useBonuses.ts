import { useCallback } from "react";
import { Letter, Word } from "./useGameState";

interface BonusesProps {
  history: Word[];
}

export function useBonuses({ history }: BonusesProps) {

  const findSquare = useCallback(
    (size: number, targetState: string) => {
      const results: { cells: { row: number; col: number }[] }[] = [];

      if (history.length < size) return results;

      for (let row = 0; row <= history.length - size; row++) {
        const wordLength = history[row].length;
        if (wordLength < size) continue;

        for (let col = 0; col <= wordLength - size; col++) {
          let allMatch = true;
          const cells: { row: number; col: number }[] = [];

          // check the square block
          for (let dy = 0; dy < size && allMatch; dy++) {
            for (let dx = 0; dx < size; dx++) {
              if (history[row + dy][col + dx].state !== targetState) {
                allMatch = false;
                break;
              }
              cells.push({ row: row + dy, col: col + dx });
            }
          }

          if (allMatch) {
            results.push({ cells });
          }
        }
      }

      return results; // empty [] if no squares found
    },
    [history]
  );

  return {
    findSquare
  }



}