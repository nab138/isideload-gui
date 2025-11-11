// import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import "./App.css";
import { useEffect, useRef, useState } from "react";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";

function App() {
  let [pairing, setPairing] = useState<string | null>(null);
  let [appleId, setAppleId] = useState<string>("");
  let [applePassword, setApplePassword] = useState<string>("");
  let [tfaOpen, setTfaOpen] = useState<boolean>(false);
  let [tfaCode, setTfaCode] = useState<string>("");
  let [error, setError] = useState<string | null>(null);
  let [loading, setLoading] = useState<boolean>(false);

  const listenerAdded = useRef(false);
  const listenerAddedOutput = useRef(false);
  const unlisten2fa = useRef<() => void>(() => {});
  const unlistenOutput = useRef<() => void>(() => {});

  useEffect(() => {
    if (!listenerAdded.current) {
      (async () => {
        const unlistenFn = await listen("2fa-required", () => {
          setTfaOpen(true);
        });
        unlisten2fa.current = unlistenFn;
      })();
      listenerAdded.current = true;
    }
    return () => {
      unlisten2fa.current();
    };
  }, []);

  useEffect(() => {
    if (!listenerAddedOutput.current) {
      (async () => {
        const unlistenFn = await listen("output", (e) => {
          setError((prev) => prev + "\n" + e.payload);
        });
        unlistenOutput.current = unlistenFn;
      })();
      listenerAddedOutput.current = true;
    }
    return () => {
      unlistenOutput.current();
    };
  }, []);

  return (
    <main className="container">
      <h1>Welcome to isideload</h1>
      <p>
        Fully rust sideloader{" "}
        <span style={{ fontSize: "0.75rem", color: "lightgray" }}>
          (except for zsign)
        </span>
      </p>
      <div className="button-container">
        <input
          type="text"
          placeholder="Apple ID"
          onChange={(e) => setAppleId(e.target.value)}
        />
        <input
          type="password"
          placeholder="Apple Password"
          onChange={(e) => setApplePassword(e.target.value)}
        />
        <button
          onClick={async () => {
            let pairing = await open({
              multiple: false,
              directory: false,
            });
            let contents = await readTextFile(pairing as string);
            setPairing(contents);
          }}
          style={{
            backgroundColor: pairing != null ? "green" : "white",
          }}
        >
          Import Pairing File
        </button>
        <button
          onClick={async () => {
            setError("");
            let appPath = await open({
              multiple: false,
              directory: false,
            });
            try {
              setLoading(true);
              await invoke("install_app", {
                pairingFile: pairing,
                appPath,
                appleId: appleId,
                applePassword: applePassword,
              });
            } catch (error) {
              setError((prev) => prev + `\nError: ${error}`);
            } finally {
              setLoading(false);
            }
          }}
        >
          Sideload!
        </button>
        {tfaOpen && (
          <>
            <input
              type="text"
              placeholder="Enter 2FA Code"
              value={tfaCode}
              onChange={(e) => setTfaCode(e.target.value)}
            />
            <button
              onClick={async () => {
                await emit("2fa-recieved", tfaCode);
                setTfaOpen(false);
              }}
            >
              Submit 2FA
            </button>
          </>
        )}
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
        {error}
      </div>

      {loading && <h3>Installing...</h3>}
    </main>
  );
}

export default App;
