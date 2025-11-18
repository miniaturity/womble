import './App.css';
import Game from './components/Game';
import { useModal } from './components/hooks/useModal';
import { Modal } from './components/Modal';
import Squares from './components/SquareBg';
import { X } from 'lucide-react';

export type ModalType = ReturnType<typeof useModal>;

function App() {
  const m = useModal();

  return (
    <div className="app">
      <Modal
        onClose={m.closeModal}
        isOpen={m.isModalOpen}
      >
        <div id="tut_modal">
          <header className="n">
            <span>how to play</span>
            <div onClick={m.closeModal}><X size={16}/></div>
          </header>
          <div className="divider"></div>
          <h3>
            get the highest score possible by keeping your combo and not dying.
          </h3>
          
          <p>
            <span className="g b">green squares</span>&nbsp;are worth 4 points<br />
            <span className="y b">yellow squares</span>&nbsp;are worth 2 points<br />
            <span className="gr b">gray squares</span>&nbsp;arent worth anything.<br /><br />
            to keep your combo, you <span className="b">cannot</span> repeat a word and 
            the word must have at least 2 <span className="g b">green squares.</span> if the bar
            runs out, you lose a life and you lose your combo. you also lose a life for repeating
            a word.<br /><br />
            <span className="g b">solving</span>&nbsp;the word grants you <span className="b">40</span>
            &nbsp;points and an extra life.
          </p>
        </div>
      </Modal>
      <Squares 
        direction={"diagonal"}
        speed={0.5}
        borderColor={"#ebebeb"}
        hoverFillColor={"#ebebeb"}
      />
      
      <Game m={m}/>
    </div>
  );
}

export default App;
