import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  return (
    <main className="container">
      <h1>Welcome to isideload</h1>
      <p>App made in tauri. Sideloader code written fully in rust.</p>
      <div className="button-container">
        <button>Import Pairing File</button>
        <button>Sideload!</button>
      </div>
      <div className="credits">
        <p>Written by nab138</p>
      </div>
    </main>
  );
}

export default App;
