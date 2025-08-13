// import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import "./App.css";
import { useState } from "react";
import { readTextFile } from "@tauri-apps/plugin-fs";

function App() {
  let [pairing, setPairing] = useState<string | null>(null);
  let [contents, setContents] = useState<string | null>(null);
  return (
    <main className="container">
      <h1>Welcome to isideload</h1>
      <p>
        Fully rust sideloader{" "}
        <span style={{ fontSize: "0.75rem", color: "lightgray" }}>
          (except for zsign)
        </span>
      </p>
      <p>Pairing: {pairing}</p>
      <div className="button-container">
        <button
          onClick={async () => {
            let pairing = await open({
              multiple: false,
              directory: false,
            });
            setPairing(pairing as string);
            let contents = await readTextFile(pairing as string);
            setContents(contents);
          }}
        >
          Import Pairing File
        </button>
        <button>Sideload!</button>
      </div>
      <div
        style={{
          maxWidth: "100%",
          maxHeight: "40%",
          overflow: "auto",
          backgroundColor: "black",
          marginTop: "10px",
        }}
      >
        {contents}
      </div>
    </main>
  );
}

export default App;
