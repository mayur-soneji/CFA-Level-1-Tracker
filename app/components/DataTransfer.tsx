"use client";

import { ChangeEvent, useRef, useState } from "react";
import { exportTrackerData, importTrackerData, isTrackerState, readTrackerStateFromStorage, saveTrackerStateToStorage } from "../lib/trackerData";

export default function DataTransfer() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const notify = (text: string, isError = false) => { setMessage(text); setError(isError); };

  const handleExport = () => {
    try { exportTrackerData(readTrackerStateFromStorage()); notify("Backup exported. Keep the JSON file somewhere safe."); }
    catch (err) { notify(err instanceof Error ? err.message : "Export failed.", true); }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true); setMessage(""); setError(false);
    try {
      const imported = await importTrackerData(file);
      if (!isTrackerState(imported)) throw new Error("The selected backup is invalid.");
      const confirmed = window.confirm("Import this backup? Your current tracker data on this browser will be replaced.");
      if (!confirmed) { notify("Import cancelled."); return; }
      saveTrackerStateToStorage(imported);
      notify("Backup restored. Reloading tracker…");
      window.setTimeout(() => window.location.reload(), 500);
    } catch (err) { notify(err instanceof Error ? err.message : "Import failed.", true); }
    finally { setBusy(false); }
  };

  return (
    <section className="dataTransfer">
      <div className="dataTransferHead">
        <div>
          <span className="sectionLabel">BACKUP & RESTORE</span>
          <h3>Protect your year-long progress</h3>
          <p>Export a portable JSON backup before changing devices or clearing browser data. Importing restores the saved tracker state.</p>
        </div>
        <div className="dataTransferActions">
          <button type="button" className="ghost" onClick={handleExport}>Export Data</button>
          <button type="button" className="primary" onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? "Importing…" : "Import Data"}</button>
          <input ref={inputRef} type="file" accept=".json,application/json" onChange={handleImport} hidden />
        </div>
      </div>
      {message && <div className={`dataTransferMessage ${error ? "error" : ""}`}>{message}</div>}
    </section>
  );
}
