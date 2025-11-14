import { useCallback, useEffect, useMemo, useState } from "react";

export type LetterState = "green" | "yellow" | "gray" 
export type Letter = { c: string, state: LetterState }
export type Word = Letter[];

interface GameState {
  words: {
    word: string | null;
    history: Word[];
  }
  score: {
    mult: Mult;
    points: number;
    streak: number;
    lives: number;
  }
  info: {
    solved: boolean;
    guesses: number;
    greens: number;
    yellows: number;
    grays: number;
  }
}

const defaultState: GameState = {
  words: {
    word: null,
    history: []
  },
  score: {
    mult: {
      combo: 0,
      mult: 1,
      color: "#000"
    },
    points: 0,
    streak: 0,
    lives: 0,
  },
  info: {
    solved: false,
    guesses: 0,
    greens: 0,
    yellows: 0,
    grays: 0
  }
}

const wordsFilePath = "words/words.txt";
const xordsFilePath = "words/xords.txt";

type Mult = { combo: number, mult: number, color: string };
type Multipliers = Mult[];
const multipliers: Multipliers = [
  {
    combo: 10,
    mult: 1.25,
    color: "#fff"
  },
  {
    combo: 20,
    mult: 1.5,
    color: "#fff"
  },
  {
    combo: 50,
    mult: 2,
    color: "#fff"
  },
  {
    combo: 100,
    mult: 2.25,
    color: "#fff"
  },
  {
    combo: 150,
    mult: 3,
    color: "#fff"
  }
]

export function useGameState() {
  const [gs, setGs] = useState<GameState>(defaultState);
  const [words, setWords] = useState<string[]>();
  const [xords, setXords] = useState<string[]>();
  const [loading, setLoading] = useState<boolean>(true);


  const getWords = useCallback(async (path: string): Promise<string[] | undefined> => {
    try {
      const res = await fetch(`${process.env.PUBLIC_URL}/${path}`);

      if (!res.ok) throw new Error(`Failed to fetch word: ${res.status}`);

      const text = await res.text();

      const textWords = text.split(/\r?\n/);
      return textWords;
    } catch (err) {
      console.error(`Error fetching word: ${err}`);
    }
  }, []);

  const setWord = useCallback(() => {
    if (!words || words.length === 0) return;
    const w = words[Math.floor(Math.random() * words.length)];
    setGs(prev => ({ 
      ...prev, 
      words: { ...prev.words, word: w } 
    }));
  }, [words]);

  // ==

  const setHistory = useCallback((w: Word[]) => {
    setGs(prev => ({ 
      ...prev, 
      words: { ...prev.words, history: w }
    }));
  }, []);

  const appendHistory = useCallback((w: Word) => {
    setGs(prev => ({ 
      ...prev, 
      words: { ...prev.words, history: [...prev.words.history, w] }
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setGs(prev => ({ 
      ...prev, 
      words: { ...prev.words, history: [] }
    }));
  }, []);

  // ==

  const autoMult = useCallback(() => {
    setGs(prev => {
      const sortedMults = [...multipliers].sort((a, b) => b.combo - a.combo);
      
      const applicableMult = sortedMults.find(m => prev.score.mult.combo >= m.combo);
      
      if (applicableMult) {
        return {
          ...prev,
          score: {
            ...prev.score,
            mult: {
              ...prev.score.mult,
              mult: applicableMult.mult,
              color: applicableMult.color
            }
          }
        };
      }
      
      return prev;
    });
  }, []);

  const setCombo = useCallback((n: number) => {
    autoMult();

    setGs(prev => {
      const newState = { 
        ...prev, 
        score: { 
          ...prev.score, 
          mult: { ...prev.score.mult, combo: n } 
        }
      };
      
      const sortedMults = [...multipliers].sort((a, b) => b.combo - a.combo);
      const applicableMult = sortedMults.find(m => n >= m.combo);
      
      if (applicableMult) {
        newState.score.mult.mult = applicableMult.mult;
        newState.score.mult.color = applicableMult.color;
      }
      
      return newState;
    });
  }, [autoMult]);

  const incrementCombo = useCallback(() => {
    setGs(prev => {
      const newCombo = prev.score.mult.combo + 1;
      const newState = { 
        ...prev, 
        score: { 
          ...prev.score, 
          mult: { ...prev.score.mult, combo: newCombo } 
        }
      };
      
      const sortedMults = [...multipliers].sort((a, b) => b.combo - a.combo);
      const applicableMult = sortedMults.find(m => newCombo >= m.combo);
      
      if (applicableMult) {
        newState.score.mult.mult = applicableMult.mult;
        newState.score.mult.color = applicableMult.color;
      }
      
      return newState;
    });
  }, []);

  const resetCombo = useCallback(() => {
    setGs(prev => ({ 
      ...prev, 
      score: { 
        ...prev.score, 
        mult: { combo: 0, mult: 1, color: "#000" } 
      }
    }));
  }, []);

  // ==

  const setMult = useCallback((n: number) => {
    setGs(prev => ({ 
      ...prev, 
      score: { 
        ...prev.score, 
        mult: { ...prev.score.mult, mult: n } 
      }
    }));
  }, []);

  // ==

  const setPoints = useCallback((n: number) => {
    setGs(prev => ({ 
      ...prev, 
      score: { ...prev.score, points: n }
    }));
  }, []);

  // ==

  const setStreak = useCallback((n: number) => {
    setGs(prev => ({ 
      ...prev, 
      score: { ...prev.score, streak: n }
    }));
  }, []);

  // ==

  const setLives = useCallback((n: number) => {
    setGs(prev => ({ 
      ...prev, 
      score: { ...prev.score, lives: n }
    }));
  }, []);

  const decrementLives = useCallback(() => {
    setGs(prev => ({ 
      ...prev, 
      score: { ...prev.score, lives: prev.score.lives - 1 }
    }));
  }, []);

  const willDie = useMemo(() => gs.score.lives === 1, [gs.score.lives]);

  // ==

  const setSolved = useCallback((b: boolean) => {
    setGs(prev => ({ 
      ...prev, 
      info: { ...prev.info, solved: b }
    }));
  }, []);

  // ==

  const setSquareCount = useCallback(
    (t: 'green' | 'yellow' | 'gray', n: number) => {
      setGs(prev => ({ 
        ...prev, 
        info: {
          ...prev.info,
          greens: t === 'green' ? n : prev.info.greens,
          yellows: t === 'yellow' ? n : prev.info.yellows,
          grays: t === 'gray' ? n : prev.info.grays
        }
      }));
  }, []);

  const incrementSquareCount = useCallback(
    (t: 'green' | 'yellow' | 'gray', x: number) => {
      setGs(prev => {
        const newInfo = { ...prev.info };
        switch (t) {
          case 'green':
            newInfo.greens += x;
            break;
          case 'yellow':
            newInfo.yellows += x;
            break;
          case 'gray':
            newInfo.grays += x;
            break;
        }
        return { ...prev, info: newInfo };
      });
  }, []);

  // ==

  const setGuesses = useCallback((n: number) => {
    setGs(prev => ({ 
      ...prev, 
      info: { ...prev.info, guesses: n }
    }));
  }, []);

  const guess = useCallback((g: Word) => {
    setGs(prev => {
      const newGuesses = prev.info.guesses + 1;
      const word = g.map(w => w.c).join("");
      const isSolved = word === prev.words.word;
      
      return {
        ...prev,
        words: {
          ...prev.words,
          history: [...prev.words.history, g]
        },
        info: {
          ...prev.info,
          guesses: newGuesses,
          solved: isSolved
        }
      };
    });
  }, []);

  useEffect(() => {
    const a = async () => {
      await getWords(wordsFilePath)
        .then(setWords)
        .catch(console.error);
      await getWords(xordsFilePath)
        .then(setXords)
        .catch(console.error);
      setLoading(false);
    }
    
    a();
  }, [getWords]);

  useEffect(() => {
    if (words && words.length > 0 && !gs.words.word) {
      setWord();
    }
  }, [words, gs.words.word, setWord]);

  return {
    gs,
    loading,

    incrementCombo,
    resetCombo,

    decrementLives,
    willDie,

    incrementSquareCount,

    guess,

    appendHistory,
    clearHistory,
    
    words: {
      words,
      xords
    },

    setters: {
      setCombo,
      setPoints,
      setStreak,
      setLives,
      setSolved,
      setSquareCount,
      setGuesses,
      setMult,
      setWord,
      setHistory
    },
    
  };
}