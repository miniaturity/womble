import React, { useCallback, useEffect, useState } from "react";
import { LetterState, useGameState, Word } from "./hooks/useGameState";
import { animated, easings, useSpring } from '@react-spring/web';

type GameStateType = ReturnType<typeof useGameState>

const scoreValues = {
  green: 4,
  yellow: 2,
  full: 40,
}

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

      const isDuplicate = g.gs.words.history.some(historyWord => 
        historyWord.map(l => l.c).join('') === upperInput
      );
      
      if (isDuplicate) {
        g.decrementLives();
        g.resetCombo();
        setInputWord("");
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

      let greenCount = 0;
      let yellowCount = 0;
      let grayCount = 0;
      
      guessAsWord.forEach(letter => {
        const currentKeyState = g.gs.info.keys.flat().find(k => k.c === letter.c.toLowerCase())?.col;
        
        if (letter.state === "green") greenCount++;
        else if (letter.state === "yellow") yellowCount++;
        else if (letter.state === "gray") grayCount++;

        if (letter.state === "green") {
          g.setters.setLetterCol(letter.c.toLowerCase(), "green");
        } else if (letter.state === "yellow" && currentKeyState !== "green") {
          g.setters.setLetterCol(letter.c.toLowerCase(), "yellow");
        } else if (letter.state === "gray" && currentKeyState === "na") {
          g.setters.setLetterCol(letter.c.toLowerCase(), "gray");
        }
      });

      g.incrementSquareCount("green", greenCount);
      g.incrementSquareCount("yellow", yellowCount);
      g.incrementSquareCount("gray", grayCount);
      
      if (greenCount === 5) g.addPoints(scoreValues.full);
      else g.addPoints((greenCount * scoreValues.green) + (yellowCount * scoreValues.yellow));

      if (greenCount >= 2) g.incrementCombo();
      else g.resetCombo();

      g.guess(guessAsWord);
      g.resetTime();
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

  useEffect(() => {
    if (g.gs.score.lost) g.resetGameState();
  }, [g.gs.score.lost, g])

  return (
    <div className="main" style={{ opacity: g.loading ? 0 : 1 }}>
      
      <aside id="l">
        <Stats g={g} />
      </aside>

      <center>
        <header>
          <div id="header_upper">
            womble
          </div>
          <div id="header_under">
            by miniaturity // ui inspired by <a href="https://vaie.art/" target="_blank" rel="noreferrer">vaie</a>
          </div>
        </header>
        
        <div id="overlay"></div>

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

      <aside id="r">
        <StatsR g={g}/>
      </aside>
      
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
    <button className={`key ${color !== "na" ? `k_${color}` : ``}`} id={`key_${c}`} onClick={() => handleClick(c)}>
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
        <div className={`i__letter ${input[i] ? `` : `il__empty`}`} id={`i${i}`} key={i}>
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
  const baseDelay = 0.15; 
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

const Stats: React.FC<{ g: GameStateType }> = ({ g }) => {

  const { score } = useSpring({
    score: g.gs.score.points,
    config: {
      duration: 400,
      easing: easings.easeOutCubic,
    },
  });

  const { highScore } = useSpring({
    highScore: g.highScore.hs,
    config: {
      duration: 400,
      easing: easings.easeOutCubic
    }
  })

  const [flash, setFlash] = useState(false);

  useEffect(() => {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 500);
      return () => clearTimeout(timer);
  }, [g.gs.score.lives]);

  const { color } = useSpring({
    color: flash ? '#ff0000' : 'var(--stext)',
    immediate: flash,
    config: {
      duration: 100,
    },
  });

  return (
    <div id="stats">
      <div className="s__container" id="score_container">
        <span className="sc__label" id="points">points</span>
        <animated.span className="counter" id="score">
          {score.to(n => `${Math.floor(n)}`)}
        </animated.span>
      </div>
      <div className="s__container" id="lives_container">
        <animated.span className="sc__label" style={{ color }}>lives</animated.span>
        <animated.span className={`counter ${flash ? `shake` : ``}`} style={{ color }}>
          {g.gs.score.lives}
        </animated.span>
      </div>
      <div className="s__container" id="guess_container">
        <span className="sc__label">guesses</span>
        <animated.span className="counter">
          {g.gs.info.guesses}
        </animated.span>
      </div>
      <div className="s__container" id="highscore_container">
        <span className="sc__label">high score</span>
        <animated.span className="counter">
          {highScore.to(n => `${Math.floor(n)}`)}
        </animated.span>
      </div>
    </div>
  )
}

const StatsR: React.FC<{ g: GameStateType }> = ({ g }) => {

  return (
    <div id="statsr">
      <div className="sr__container" id="bar_container" style={{ height: "60%" }}>
        <MultBar g={g}/>
        <div id="mult_count" style={{ color: g.gs.score.mult.color }}>
          <div id="mult">
            {g.gs.score.mult.mult.toFixed(2)}x
          </div>
          <div id="mult_under">
            mult
          </div>
          <div className="space"></div>
          <div id="combo_count" style={{ color: g.gs.score.mult.color }}>
            <div id="combo_above">
              combo
            </div>
            <div id="combo">
              x{g.gs.score.mult.combo}
            </div>
          </div>
        </div>
        <div></div>
      </div>
    </div>
  )
}

const MultBar: React.FC<{ g: GameStateType }> = ({ g }) => {
  const fraction = Math.max(0, Math.min(1, g.gs.timer.time / g.gs.timer.maxTime));
  const [prevFraction, setPrevFraction] = useState(fraction);

  const { height } = useSpring({
    from: { height: prevFraction * 100 },
    to: { height: fraction * 100 },
    config: {
      duration: fraction > prevFraction ? 0 : 1000
    },
    onRest: () => setPrevFraction(fraction)
  });


  return (
    <animated.div className={`combo_bar`} style={{
      background: `${g.gs.score.mult.color}`,
      height: height.to(h => `${h}%`),
      transformOrigin: `top`
      }}>
    </animated.div>
  )
}

export default Game;