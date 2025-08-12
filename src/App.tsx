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
      <p>App made in tauri. Sideloader code written fully in rust.</p>
      <p>Pairing: {pairing}</p>
      <div className="button-container">
        <button
          onClick={async () => {
            let pairing = await open({
              multiple: false,
              directory: false,
              filters: [
                {
                  name: "Pairing File",
                  extensions: ["plist", "mobiledevicepairing"],
                },
              ],
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
      <div className="credits">
        <p>Written by nab138</p>
      </div>
    </main>
  );
}

export default App;
