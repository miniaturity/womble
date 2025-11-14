import React, { useCallback, useEffect, useState } from "react";
import { LetterState, useGameState, Word } from "./hooks/useGameState";

type GameStateType = ReturnType<typeof useGameState>



const Game: React.FC = () => {
  const g = useGameState();
  const [inputWord, setInputWord] = useState<string>("");

  const handleSubmit = useCallback(() => {
      if (inputWord.length !== 5) return;
      if (!g.words.words || !g.words.xords) return;
      
      const upperInput = inputWord.toUpperCase();
      
      const isValid = g.words.words.includes(upperInput) || g.words.xords.includes(upperInput);
      
      if (!isValid) {
        console.log("Invalid word:", upperInput);
        return;
      }
      
      const correctWord = g.gs.words.word;
      if (!correctWord) return;
      
      const guessAsWord: Word = [];
      const remainingLetters: { [key: string]: number } = {};
      
      for (let i = 0; i < correctWord.length; i++) {
        remainingLetters[correctWord[i]] = (remainingLetters[correctWord[i]] || 0) + 1;
      }
      
      for (let i = 0; i < upperInput.length; i++) {
        if (correctWord[i] === upperInput[i]) {
          guessAsWord.push({ c: upperInput[i], state: "green" });
          remainingLetters[upperInput[i]]--;
        } else {
          guessAsWord.push({ c: upperInput[i], state: "gray" }); 
        }
      }
      
      for (let i = 0; i < upperInput.length; i++) {
        if (guessAsWord[i].state === "gray") { 
          if (remainingLetters[upperInput[i]] && remainingLetters[upperInput[i]] > 0) {
            guessAsWord[i] = { c: upperInput[i], state: "yellow" };
            remainingLetters[upperInput[i]]--;
          }
        }
      }
      
      g.guess(guessAsWord);
      setInputWord("");
    }, [g, inputWord]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[a-zA-Z]$/.test(e.key)) {
        setInputWord(prev => prev.length < 5 ? prev + e.key.toUpperCase() : prev);
      }
      if (e.key === "Backspace") {
        setInputWord(prev => prev.slice(0, -1));
      }
      if (e.key === "Enter") {
        handleSubmit();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [inputWord, g, handleSubmit]);

  return (
    <div className="main" style={{ visibility: g.loading ? "hidden" : "visible" }}>
      <aside id="l"></aside>

      
      
      <center>
        <header>
          <div id="header_upper">
            womble
          </div>
          <div id="header_under">
            by miniaturity
          </div>
        </header>
        
        <div id="words">
          <div id="history">
            {g.gs.words.history.map((w, index) => (
              <HistoryWord word={w} key={index} gs={g} />
            ))}
          </div>
          <div id="input">
            <InputWord input={inputWord} />
          </div>
        </div>
        <div id="keyboard">
          <div className="k__row">
            {g.gs.info.keys[0].map((k, index) =>
                <Key 
                key={index} 
                c={k.c}
                color={k.col}
                handlers={{ handleSubmit, setInputWord }}
                />
              )
            }
          </div>
          <div className="k__row">
            {g.gs.info.keys[1].map((k, index) =>
                <Key 
                key={index} 
                c={k.c}
                color={k.col}
                handlers={{ handleSubmit, setInputWord }}
                />
              )
            }
          </div>
          <div className="k__row">
            {g.gs.info.keys[2].map((k, index) =>
                <Key 
                key={index} 
                c={k.c}
                color={k.col}
                handlers={{ handleSubmit, setInputWord }}
                />
              )
            }
          </div>
        </div>
      </center>

      <aside id="r"></aside>
    </div>
  );
};

interface KeyProps {
  c: string;
  color: LetterState;
  handlers: {
    setInputWord: React.Dispatch<React.SetStateAction<string>>;
    handleSubmit: () => void;
  }
  
}

const Key: React.FC<KeyProps> = ({ c, handlers, color }) => {
  const { setInputWord, handleSubmit } = handlers;

  const handleClick = (k: string) => {
    if (k === "del") {
      setInputWord(prev => prev.slice(0, -1));
    } else if (k === "go") {
      handleSubmit();
    } else {
      setInputWord(prev => prev.length < 5 ? prev + k.toUpperCase() : prev);
    }
  }

  return (
    <button className={`key k_${color}`} id={`key_${c}`} onClick={() => handleClick(c)}>
      {c}
    </button>
  )
}

interface InputWordProps {
  input: string;
}

const InputWord: React.FC<InputWordProps> = ({ input }) => {
  return (
    <>
      {[0, 1, 2, 3, 4].map(i => (
        <div className="i__letter" id={`i${i}`} key={i}>
          {input[i] || ""}
        </div>
      ))}
    </>
  );
};

interface HistoryWordProps {
  word: Word;
  gs: GameStateType
}

const HistoryWord: React.FC<HistoryWordProps> = ({ word, gs }) => {
  const combo = gs.gs.score.mult.combo;
  const baseDelay = 0.25; 
  const minDelay = 0.05;  
  const delayMultiplier = Math.max(minDelay, baseDelay - (combo * 0.002));
  
  return (
    <div className="h__word">
      {word.map((w, index) => { 
      var col = w.state === "green" ? "var(--green)" :
        w.state === "yellow" ? "var(--yellow)" : "var(--gray)";
      var bor = w.state === "green" ? "var(--greenborder)" :
        w.state === "yellow" ? "var(--yellowborder)" : "var(--grayborder)";
      return (
        <div
          key={index}
          className={`hw__letter`}
          style={{ "--i": `${index * delayMultiplier}s`, "--col": col, "--bor": bor } as React.CSSProperties}
        >
          {w.c}
        </div>
      )})}
    </div>
  );
};

export default Game;