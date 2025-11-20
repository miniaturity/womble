import { useCallback, useEffect, useMemo, useState } from "react";
import useLocalStorage from "./useLocalStorage";

export type LetterState = "green" | "yellow" | "gray" | "na" 
export type Letter = { c: string, state: LetterState }
export type Word = Letter[];

interface GameState {
  mode: "daily" | "any"
  words: {
    dailyWord: string | null;
    word: string | null;
    history: Word[];
  };
  score: {
    mult: Mult;
    points: number;
    lives: number;
    lost: boolean;
  };
  timer: {
    maxTime: number;
    time: number;
    penalty: number;
    shouldApplyPenalty: boolean;
    running: boolean;
  };
  info: {
    solved: boolean;
    guesses: number;
    greens: number;
    yellows: number;
    grays: number;
    keys: Key[][];
  };
}

const defaultState: GameState = {
  mode: "any",
  words: {
    dailyWord: null,
    word: null,
    history: []
  },
  score: {
    mult: {
      combo: 0,
      mult: 1,
      color: "#787c7f"
    },
    points: 0,
    lives: 3,
    lost: false,
  },
  timer: {
    maxTime: 20,
    time: 20,
    penalty: 4,
    running: false,
    shouldApplyPenalty: false
  },
  info: {
    solved: false,
    guesses: 0,
    greens: 0,
    yellows: 0,
    grays: 0,
    keys: [
          [
        { c: "q", col: "na" },
        { c: "w", col: "na" },
        { c: "e", col: "na" },
        { c: "r", col: "na" },
        { c: "t", col: "na" },
        { c: "y", col: "na" },
        { c: "u", col: "na" },
        { c: "i", col: "na" },
        { c: "o", col: "na" },
        { c: "p", col: "na" }
      ],
      [
        { c: "a", col: "na" },
        { c: "s", col: "na" },
        { c: "d", col: "na" },
        { c: "f", col: "na" },
        { c: "g", col: "na" },
        { c: "h", col: "na" },
        { c: "j", col: "na" },
        { c: "k", col: "na" },
        { c: "l", col: "na" }
      ],
      [
        { c: "del", col: "na" },
        { c: "z", col: "na" },
        { c: "x", col: "na" },
        { c: "c", col: "na" },
        { c: "v", col: "na" },
        { c: "b", col: "na" },
        { c: "n", col: "na" },
        { c: "m", col: "na" },
        { c: "go", col: "na" }
      ]
    ]
  }
}

type Key = { c: string, col: LetterState }

const wordsFilePath = "words/words.txt";
const xordsFilePath = "words/xords.txt";

type Mult = { combo: number, mult: number, color: string };
type Multipliers = Mult[];
const multipliers: Multipliers = [
  {
    combo: 0,
    mult: 1,
    color: "#787c7f"
  },
  {
    combo: 5,
    mult: 1.25,
    color: "#ebab34"
  },
  {
    combo: 10,
    mult: 1.5,
    color: "#eb8934"
  },
  {
    combo: 25,
    mult: 2,
    color: "#eb4934"
  },
  {
    combo: 50,
    mult: 2.25,
    color: "#eb3434"
  },
  {
    combo: 100,
    mult: 3,
    color: "#34d0eb"
  }
]

interface HighScore {
  hs: number;
}

export function useGameState() {
  const [gs, setGs] = useState<GameState>(defaultState);
  const [highScore, setHighScore] = useLocalStorage<HighScore>('hs', { hs: 0 });
  const [words, setWords] = useState<string[]>();
  const [xords, setXords] =   useState<string[]>();
  const [loading, setLoading] = useState<boolean>(true);
  const [dwLoading, setDwLoading] = useState<boolean>(true);

  const handleSetHighscore = useCallback((n: number) => {
    setHighScore({ hs: n });
  }, [setHighScore]);

  const resetGameState = useCallback(() => {
    setGs(defaultState);
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
    if (!words || words.length === 0) return;
    const w = words[Math.floor(Math.random() * words.length)];
    setGs(prev => ({ 
      ...prev, 
      words: { ...prev.words, word: w }
    }));
  }, [words]);

  const setLost = useCallback((b?: boolean) => {
    setGs(prev => ({
      ...prev,
      score: {
        ...prev.score,
        lost: b ? b : !prev.score.lost
      }
    }));
  }, []);

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
    setCombo(0);
  }, [setCombo]);

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

  const addPoints = useCallback((n: number) => {
    if (gs.score.points + n > highScore.hs) {
      handleSetHighscore(gs.score.points + (n * gs.score.mult.mult));
    }
    setGs(prev => ({
      ...prev,
      score: { ...prev.score, points: prev.score.points + (n * prev.score.mult.mult) }
    }));
  }, [gs.score.points, highScore, handleSetHighscore, gs.score.mult.mult]);

  // ==

  const setLives = useCallback((n: number) => {
    setGs(prev => ({ 
      ...prev, 
      score: { ...prev.score, lives: n }
    }));
  }, []);

  const willDie = useMemo(() => gs.score.lives === 1, [gs.score.lives]);

  const decrementLives = useCallback(() => {
    if (willDie) setLost(true);
    setGs(prev => ({ 
      ...prev, 
      score: { ...prev.score, lives: prev.score.lives - 1 }
    }));
  }, [willDie, setLost]);

  const incrementLives = useCallback(() => {
    setGs(prev => ({
      ...prev,
      score: { ...prev.score, lives: prev.score.lives + 1}
    }));
  }, []);

  const applyTimePenalty = useCallback(() => {
    decrementLives();
    setCombo(0);
  }, [setCombo, decrementLives]);

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

  const setTimerRunning = useCallback((b?: boolean) => {
    setGs(prev => ({
      ...prev,
      timer: {
        ...prev.timer,
        running: b ? b : !prev.timer.running
      }
    }))
  }, []);

  const setGuesses = useCallback((n: number) => {
    setGs(prev => ({ 
      ...prev, 
      info: { ...prev.info, guesses: n }
    }));
  }, []);

  const guess = useCallback((g: Word) => {
    if (!gs.timer.running) setTimerRunning(true);
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
  }, [gs.timer.running, setTimerRunning]);

  // ==

  const setLetterCol = useCallback((n: string, c: LetterState) => {
    setGs(prev => ({
      ...prev,
      info: {
        ...prev.info,
        keys: [
          ...prev.info.keys.map(j => 
            j.map(k => k.c === n ? { ...k, col: c } : k )
          )
        ]
      }
    }))
  }, []);

  // ==

  const setTime = useCallback((n: number) => {
    setGs(prev => ({
      ...prev,
      timer: {
        ...prev.timer,
        time: n
      }
    }));
  }, []);

  const setMaxTime = useCallback((n: number) => {
    setGs(prev => ({
      ...prev,
      timer: {
        ...prev.timer,
        maxTime: n
      }
    }));
  }, []);

  const setTimePenalty = useCallback((n: number) => {
    setGs(prev => ({
      ...prev,
      timer: {
        ...prev.timer,
        penalty: n
      }
    }));
  }, []);

  const resetTime = useCallback(() => {
    setGs(prev => ({
      ...prev,
      timer: {
        ...prev.timer,
        time: prev.timer.maxTime
      }
    }));
  }, []);

  const decrementTime = useCallback((n?: number) => {
    setGs(prev => {
      const newTime = prev.timer.time - (n || 1);
      
      if (newTime <= 0) {
        return {
          ...prev,
          timer: {
            ...prev.timer,
            time: prev.timer.maxTime,
            shouldApplyPenalty: true
          }
        };
      }
      
      return {
        ...prev,
        timer: {
          ...prev.timer,
          time: newTime
        }
      };
    });
  }, []);

  // ==

  const setMode = useCallback((m: "any" | "daily") => {
    if (dwLoading) return;
    setGs(prev => ({
      ...prev,
      mode: m
    }));
  }, [dwLoading]);

  const toggleMode = useCallback(() => {
    if (dwLoading) return;
    setGs(prev => ({
      ...prev,
      mode: prev.mode === "any" ? "daily" : "any"
    }));
  }, [dwLoading]);

  useEffect(() => {
    if (!gs.timer.running) return;

    const timer = setInterval(() => {
      decrementTime();
    }, 1000);

    return () => clearInterval(timer);
  }, [decrementTime, gs.timer.running]);

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
    if (gs.timer.shouldApplyPenalty) {
      applyTimePenalty();
      setGs(prev => ({
        ...prev,
        timer: {
          ...prev.timer,
          shouldApplyPenalty: false
        }
      }));
    }
  }, [gs.timer.shouldApplyPenalty, applyTimePenalty]);

  useEffect(() => {
    if (words && words.length > 0 && !gs.words.word) {
      setWord();
    }
  }, [words, gs.words.word, setWord]);

  useEffect(() => {
    const gdw = async () => {
      try {
        const res = await fetch("/api/words");
        console.log(res);
        const rows = await res.json();
        const words: {date: string, word: string}[] = rows.map(([date, word]: [string, string]) => ({
          date,
          word
        }))

        const today = new Date();
        const month = (today.getMonth() + 1).toString().padStart(2, '0'); 
        const day = today.getDate().toString().padStart(2, '0'); 
        const year = today.getFullYear();

        const formattedDate = `${month}/${day}/${year}`;
        const todaysWord = words.find((word: {date: string, word: string}) => word.date === formattedDate);

        if (todaysWord) {
          setGs(prev => ({
            ...prev,
            words: {
              ...prev.words,
              dailyWord: todaysWord.word
            }
          }));
          setDwLoading(false);
        } else {
          console.error("Could not find the daily word for today. Defaulting.");
          setGs(prev => ({
            ...prev,
            words: {
              ...prev.words,
              dailyWord: "WORDY"
            }
          }));
        }
      } catch (err: any) {
        console.error(err);
      }
    }

    gdw();
  }, []);

  useEffect(() => {
    if (gs.mode === "daily") {
      setGs(prev => ({
        ...prev,
        words: {
          ...prev.words,
          word: prev.words.dailyWord
        }
      }))
    }
  }, [gs.mode]);

  return {
    gs,
    loading,

    toggleMode,

    resetGameState,

    incrementCombo,
    resetCombo,

    decrementLives,
    incrementLives,
    willDie,

    incrementSquareCount,

    guess,

    appendHistory,
    clearHistory,

    addPoints,

    decrementTime,
    resetTime,

    highScore,

    words: {
      words,
      xords
    },

    setters: {
      setCombo,
      setPoints,
      setLives,
      setSolved,
      setSquareCount,
      setGuesses,
      setMult,
      setWord,
      setHistory,
      setLetterCol,
      setTime,
      setMaxTime,
      setTimePenalty,
      setTimerRunning,
      setMode
    },
  };
}