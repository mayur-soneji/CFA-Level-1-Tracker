export const TRACKER_STORAGE_KEY = "cfa-l1-tracker-v10";
export const TRACKER_APP = "cfa-level-1-tracker";
export const TRACKER_SCHEMA_VERSION = 1;

export interface MockRecord { id: number; date: string; score: string; done: boolean; completedAt: string; }
export interface StudyLog { id: string | number; date: string; hours: number; topic: string; focus: string; }
export interface ReadingDone { [topicId: string]: number[]; }
export interface ReadingAttempt { status?: string; credit?: number; at?: string; }
export interface ReadingProgressEntry { status?: string; incompleteCount?: number; credit?: number; history?: ReadingAttempt[]; }
export interface ReadingProgress { [topicId: string]: { [readingNumber: string]: ReadingProgressEntry }; }
export interface TrackerState { readDone: string[]; revDone: string[]; mocks: MockRecord[]; logs: StudyLog[]; rest: string[]; readingDone?: ReadingDone; readingProgress?: ReadingProgress; }
export interface TrackerExport { schemaVersion: number; app: typeof TRACKER_APP; exportedAt: string; data: TrackerState; }

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
function isMockRecord(value: unknown): value is MockRecord { if (!isObject(value)) return false; return typeof value.id === "number" && typeof value.date === "string" && typeof value.score === "string" && typeof value.done === "boolean" && typeof value.completedAt === "string"; }
function isStudyLog(value: unknown): value is StudyLog { if (!isObject(value)) return false; return (typeof value.id === "string" || typeof value.id === "number") && typeof value.date === "string" && typeof value.hours === "number" && Number.isFinite(value.hours) && typeof value.topic === "string" && typeof value.focus === "string"; }
function isReadingDone(value: unknown): value is ReadingDone {
  return isObject(value) && Object.values(value).every((items) => Array.isArray(items) && items.every((item) => typeof item === "number" && Number.isInteger(item) && item > 0));
}
function isReadingAttempt(value: unknown): value is ReadingAttempt {
  return isObject(value) && (value.status === undefined || typeof value.status === "string") && (value.credit === undefined || (typeof value.credit === "number" && Number.isFinite(value.credit))) && (value.at === undefined || typeof value.at === "string");
}
function isReadingProgress(value: unknown): value is ReadingProgress {
  return isObject(value) && Object.values(value).every((topic) => isObject(topic) && Object.values(topic).every((entry) => isObject(entry) && (entry.status === undefined || typeof entry.status === "string") && (entry.incompleteCount === undefined || (typeof entry.incompleteCount === "number" && Number.isInteger(entry.incompleteCount) && entry.incompleteCount >= 0)) && (entry.credit === undefined || (typeof entry.credit === "number" && Number.isFinite(entry.credit))) && (entry.history === undefined || (Array.isArray(entry.history) && entry.history.every(isReadingAttempt)))));
}
export function isTrackerState(value: unknown): value is TrackerState { if (!isObject(value)) return false; return Array.isArray(value.readDone) && value.readDone.every((item) => typeof item === "string") && Array.isArray(value.revDone) && value.revDone.every((item) => typeof item === "string") && Array.isArray(value.mocks) && value.mocks.every(isMockRecord) && Array.isArray(value.logs) && value.logs.every(isStudyLog) && Array.isArray(value.rest) && value.rest.every((item) => typeof item === "string") && (value.readingDone === undefined || isReadingDone(value.readingDone)) && (value.readingProgress === undefined || isReadingProgress(value.readingProgress)); }

export function readTrackerStateFromStorage(): TrackerState {
  if (typeof window === "undefined") throw new Error("Tracker data is only available in the browser.");
  const raw = window.localStorage.getItem(TRACKER_STORAGE_KEY) || window.localStorage.getItem("cfa-l1-tracker-v9") || window.localStorage.getItem("cfa-l1-tracker-v8");
  if (!raw) return { readDone: [], revDone: [], mocks: [], logs: [], rest: [], readingDone: {}, readingProgress: {} };
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("The saved tracker data is not valid JSON."); }
  if (!isTrackerState(parsed)) throw new Error("The saved tracker data is invalid or corrupted.");
  return { ...parsed, readingDone: parsed.readingDone || {}, readingProgress: parsed.readingProgress || {} };
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
  return { ...parsed.data, readingDone: parsed.data.readingDone || {}, readingProgress: parsed.data.readingProgress || {} };
}

export function saveTrackerStateToStorage(state: TrackerState): void {
  if (typeof window === "undefined") throw new Error("Tracker data is only available in the browser.");
  if (!isTrackerState(state)) throw new Error("Cannot save invalid tracker data.");
  window.localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(state));
}
