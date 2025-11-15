import './App.css';
import Game from './components/Game';
import Squares from './components/SquareBg';

function App() {

  return (
    <div className="app">
      <Squares 
        direction={"diagonal"}
        speed={0.5}
        borderColor={"#ebebeb"}
        hoverFillColor={"#ebebeb"}
      />
      
      <Game />
    </div>
  );
}

export default App;
