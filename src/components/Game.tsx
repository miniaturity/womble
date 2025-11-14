import React, { useEffect, useState } from "react";
import { LetterState, useGameState, Word } from "./hooks/useGameState";
import { randomUUID } from "crypto";


const Game: React.FC = () => {
  const g = useGameState();
  const [inputWord, setInputWord] = useState<string>("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[a-zA-Z]$/.test(e.key)) appendLetter(e.key);
      if (e.key === "Backspace") backspaceLetter();
      if (e.key === "Enter") handleSubmit();
    }

    document.addEventListener("keydown", handleKeyDown);
  }, []);

  const appendLetter = (l: string) => {
    if (inputWord.length === 5) return;
    setInputWord(prev => prev + l);
  }

  const backspaceLetter = () => {
    if (inputWord.length === 0) return;
    setInputWord(prev => prev.slice(0, -1));
  }

  const parseGuess = (w: string): Word | null => {
    let guessAsWord: Word = [];
    const correctWord = g.gs.words.word;
    if (!correctWord) return null;

    for (let i = 0; i < w.length; i++) {
      let value: LetterState = "gray";
      
      
      if (correctWord[i] === w[i]) value = "green";
      else if (correctWord.includes(w[i])) value = "yellow";

      guessAsWord = [...guessAsWord, { c: w[i], state: value }];
    }

    return guessAsWord;
  }

  const handleSubmit = () => {
    if (inputWord.length !== 5) return;
    if (isValidWord(inputWord)) {
      const guess = parseGuess(inputWord);
      if (!guess) throw new Error("Invalid guess: Failed to parse as guess.");
      g.guess(guess);
    }
  }

  const isValidWord = (w: string) => {
    if (!g.words.words || !g.words.xords) return;
    if (!g.words.words.includes(w) || !g.words.xords.includes(w)) return false;
    return true;
  }

  return (
    <div className="main" style={{ visibility: g.loading ? "hidden" : "visible" }}>

      <aside id="l">

      </aside>

      <center>

        <div id="history">
          {g.gs.words.history.map(w =>
            <HistoryWord word={w} id={randomUUID()}/>
          )}
        </div>
        <div id="input">
          <InputWord input={inputWord}/>
        </div>
        <div id="keyboard">

        </div>

      </center>

      <aside id="r">

      </aside>
    </div>
  )
}

interface InputWordProps {
  input: string;
}

const InputWord: React.FC<InputWordProps> = ({ input }) => {

  return (
    <>
      <div className="i__letter" id="i0">
        {input[0] || ""}
      </div>
      <div className="i__letter" id="i1">
        {input[1] || ""}
      </div>
      <div className="i__letter" id="i2">
        {input[2] || ""}
      </div>
      <div className="i__letter" id="i3">
        {input[3] || ""}
      </div>
      <div className="i__letter" id="i4">
        {input[4] || ""}
      </div>
    </>
  )
}

interface HistoryWordProps {
  id: string,
  word: Word
}

const HistoryWord: React.FC<HistoryWordProps> = ({ id, word }) => {
  return (
    <div className="h__word" id={id}>
      {word.map((w, index) => {
        const uuid = randomUUID();
        return (
          <div id={uuid} className={w.state}
            style={{"--i": index} as React.CSSProperties}
          >
            {w.c}
          </div>
        )
      })}
    </div>
  )
}

export default Game;