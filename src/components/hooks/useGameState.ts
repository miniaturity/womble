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
  // combo: mult
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

  useEffect(() => {
    const a = async () => {
      await getWords(wordsFilePath)
      .then(setWords)
      .catch(console.error);
      await getWords(xordsFilePath)
        .then(setXords)
        .catch(console.error);
      setLoading(false);
      setWord();
    }
    
    a();
  }, []);

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
    if (!words) return;
    const w = words[Math.floor(Math.random() * words.length)];
    setGs({ ...gs, words: { ...gs.words, word: w } });
  }, []);

  // ==

  const setHistory = useCallback((w: Word[]) => {
    setGs({ ...gs, words: { ...gs.words, history: w }})
  }, []);

  const appendHistory = useCallback((w: Word) => {
    setHistory([...gs.words.history, w]);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // ==

  const setCombo = useCallback((n: number) => {
    autoMult();
    setGs({ ...gs, score: { ...gs.score, mult: { ...gs.score.mult, combo: n } }});
  }, []);

  const incrementCombo = useCallback(() => {
    setCombo(gs.score.mult.combo + 1);
  }, []);

  const resetCombo = useCallback(() => {
    setCombo(0);
  }, []);

  // ==

  const setMult = useCallback((n: number) => {
    setGs({ ...gs, score: { ...gs.score, mult: { ...gs.score.mult, mult: n } }});
  }, []);

  const setMultCol = useCallback((c: string) => {
    setGs({ ...gs, score: { ...gs.score, mult: { ...gs.score.mult, color: c }}})
  }, []);

  const autoMult = useCallback(() => {
    const sortedMults = [...multipliers].sort((a, b) => a.combo - b.combo)
    
    sortedMults.forEach(m => {
      if (m.combo > gs.score.mult.combo) {
        setMult(m.mult);
        setMultCol(m.color);
        return;
      }
    })
  }, []);

  // ==

  const setPoints = useCallback((n: number) => {
    setGs({ ...gs, score: { ...gs.score, points: n }});
  }, []);

  // ==

  const setStreak = useCallback((n: number) => {
    setGs({ ...gs, score: { ...gs.score, streak: n }});
  }, []);

  // ==

  const setLives = useCallback((n: number) => {
    setGs({ ...gs, score: { ...gs.score, lives: n }});
  }, []);

  const decrementLives = useCallback(() => {
    setLives(gs.score.lives - 1);
  }, []);

  const willDie = useMemo(() => gs.score.lives === 1, [gs.score.lives]);

  // ==

  const setSolved = useCallback((b: boolean) => {
    setGs({ ...gs, info: { ...gs.info, solved: b }});
  }, []);

  // ==

  const setSquareCount = useCallback(
    (t: 'green' | 'yellow' | 'gray', n: number) => {
      setGs({ ...gs, info: {
        ...gs.info,
        greens: t === 'green' ? n : gs.info.greens,
        yellows: t === 'yellow' ? n : gs.info.yellows,
        grays: t === 'gray' ? n : gs.info.grays
      }});
  }, []);

  const incrementSquareCount = useCallback(
    (t: 'green' | 'yellow' | 'gray', x: number) => {
      switch (t) {
        case 'green':
          setSquareCount(t, gs.info.greens + x);
          break;
        case 'yellow':
          setSquareCount(t, gs.info.yellows + x);
          break;
        case 'gray':
          setSquareCount(t, gs.info.grays + x);
          break;
        default:
          break;
      }
  }, []);

  // ==

  const setGuesses = useCallback((n: number) => {
    setGs({ ...gs, info: { ...gs.info, guesses: n }});
  }, []);

  const guess = useCallback((g: Word) => {
    appendHistory(g);
    setGuesses(gs.info.guesses + 1);
    
    const word = g.map(w => w.c).join("");
    if (word === gs.words.word) setSolved(true);
  }, []);

  return {
    gs,
    loading,

    incrementCombo,
    resetCombo,

    decrementLives,
    willDie,

    incrementSquareCount,

    guess,
    
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
      setHistory
    },

    util: {
      appendHistory,
      clearHistory
    }
  };
}