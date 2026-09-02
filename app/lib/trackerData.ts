export const TRACKER_STORAGE_KEY = "cfa-l1-tracker-v10";
export const TRACKER_APP = "cfa-level-1-tracker";
export const TRACKER_SCHEMA_VERSION = 1;

export interface MockRecord { id: number; date: string; score: string; done: boolean; completedAt: string; }
export interface StudyLog { id: string | number; date: string; hours: number; topic: string; focus: string; }
export interface TrackerState { readDone: string[]; revDone: string[]; mocks: MockRecord[]; logs: StudyLog[]; rest: string[]; }
export interface TrackerExport { schemaVersion: number; app: typeof TRACKER_APP; exportedAt: string; data: TrackerState; }

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
function isMockRecord(value: unknown): value is MockRecord { if (!isObject(value)) return false; return typeof value.id === "number" && typeof value.date === "string" && typeof value.score === "string" && typeof value.done === "boolean" && typeof value.completedAt === "string"; }
function isStudyLog(value: unknown): value is StudyLog { if (!isObject(value)) return false; return (typeof value.id === "string" || typeof value.id === "number") && typeof value.date === "string" && typeof value.hours === "number" && Number.isFinite(value.hours) && typeof value.topic === "string" && typeof value.focus === "string"; }
export function isTrackerState(value: unknown): value is TrackerState { if (!isObject(value)) return false; return Array.isArray(value.readDone) && value.readDone.every((item) => typeof item === "string") && Array.isArray(value.revDone) && value.revDone.every((item) => typeof item === "string") && Array.isArray(value.mocks) && value.mocks.every(isMockRecord) && Array.isArray(value.logs) && value.logs.every(isStudyLog) && Array.isArray(value.rest) && value.rest.every((item) => typeof item === "string"); }

export function readTrackerStateFromStorage(): TrackerState {
  if (typeof window === "undefined") throw new Error("Tracker data is only available in the browser.");
  const raw = window.localStorage.getItem(TRACKER_STORAGE_KEY) || window.localStorage.getItem("cfa-l1-tracker-v9") || window.localStorage.getItem("cfa-l1-tracker-v8");
  if (!raw) return { readDone: [], revDone: [], mocks: [], logs: [], rest: [] };
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("The saved tracker data is not valid JSON."); }
  if (!isTrackerState(parsed)) throw new Error("The saved tracker data is invalid or corrupted.");
  return parsed;
}

export function exportTrackerData(state: TrackerState): void {
  if (!isTrackerState(state)) throw new Error("Cannot export invalid tracker data.");
  const payload: TrackerExport = { schemaVersion: TRACKER_SCHEMA_VERSION, app: TRACKER_APP, exportedAt: new Date().toISOString(), data: state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `cfa-level-1-tracker-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importTrackerData(file: File): Promise<TrackerState> {
  if (!file) throw new Error("No file selected.");
  const text = await file.text(); let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error("The selected file is not valid JSON."); }
  if (!isObject(parsed)) throw new Error("Invalid tracker export.");
  if (parsed.app !== TRACKER_APP) throw new Error("This file is not a CFA Level I Tracker backup.");
  if (parsed.schemaVersion !== TRACKER_SCHEMA_VERSION) throw new Error(`Unsupported backup version: ${String(parsed.schemaVersion)}.`);
  if (!isTrackerState(parsed.data)) throw new Error("The backup contains an invalid tracker data structure.");
  return parsed.data;
}

export function saveTrackerStateToStorage(state: TrackerState): void {
  if (typeof window === "undefined") throw new Error("Tracker data is only available in the browser.");
  if (!isTrackerState(state)) throw new Error("Cannot save invalid tracker data.");
  window.localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(state));
}
