import { useCallback } from "react";
import { Letter, Word } from "./useGameState";

interface BonusesProps {
  history: Word[];
}

export function useBonuses({ history }: BonusesProps) {


  const findSquare = useCallback((size: number, state: string) => {
    var indices: number[] = [];
    // Iterate through each history entry, starting at the end.
    for (let i = history.length - 1; i > history.length - size; i--) {

      // Iterate through each letter.
      for (let j = 0; i < history[i].length; i++) {

        if (history[i][j].state === state) {
          indices.push(j);
        }

      }
    }

    // Check for repeated indices?
    


  }, []);


}