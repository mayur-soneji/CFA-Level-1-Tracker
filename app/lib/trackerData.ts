export const TRACKER_STORAGE_KEY = "cfa-l1-tracker-v10";
export const TRACKER_APP = "cfa-level-1-tracker";
export const TRACKER_SCHEMA_VERSION = 2;

export interface MockRecord { id: number; date: string; score: string; done: boolean; completedAt: string; }
export interface StudyLog { id: string | number; date: string; hours: number; topic: string; focus: string; readingNumber?: number; readingTitle?: string; readingStatus?: "completed" | "incomplete"; }
export interface RevisionTask { taskId: string; readingId: string; topicId: string; readingNumber: number; readingTitle: string; completionDate: string; reviewNumber: number; reviewType: "Day 1" | "Day 7" | "Day 21" | "Retention review"; dueDate: string; status: "pending" | "completed"; completedAt: string; rewardCredit: number; }
export interface RevisionHistory extends RevisionTask { earnedCredit: number; }
export interface ReadingDone { [topicId: string]: number[]; }
export interface ReadingAttempt { status?: string; credit?: number; at?: string; }
export interface ReadingProgressEntry { status?: string; incompleteCount?: number; credit?: number; history?: ReadingAttempt[]; }
export interface ReadingProgress { [topicId: string]: { [readingNumber: string]: ReadingProgressEntry }; }
export interface TrackerState { schemaVersion: number; readDone: string[]; revDone: string[]; mocks: MockRecord[]; logs: StudyLog[]; rest: string[]; readingDone?: ReadingDone; readingProgress?: ReadingProgress; completionDates?: Record<string, string>; revisionTasks?: RevisionTask[]; revisionHistory?: RevisionHistory[]; revisionReadinessCredit?: number; }
export interface TrackerExport { schemaVersion: number; app: typeof TRACKER_APP; exportedAt: string; data: TrackerState; }

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isMockRecord = (value: unknown): value is MockRecord => isObject(value) && typeof value.id === "number" && typeof value.date === "string" && typeof value.score === "string" && typeof value.done === "boolean" && typeof value.completedAt === "string";
const isStudyLog = (value: unknown): value is StudyLog => isObject(value) && (typeof value.id === "string" || typeof value.id === "number") && typeof value.date === "string" && typeof value.hours === "number" && Number.isFinite(value.hours) && typeof value.topic === "string" && typeof value.focus === "string" && (value.readingNumber === undefined || (typeof value.readingNumber === "number" && Number.isInteger(value.readingNumber))) && (value.readingTitle === undefined || typeof value.readingTitle === "string") && (value.readingStatus === undefined || value.readingStatus === "completed" || value.readingStatus === "incomplete");
const isRevisionTask = (value: unknown): value is RevisionTask => isObject(value) && typeof value.taskId === "string" && typeof value.readingId === "string" && typeof value.topicId === "string" && typeof value.readingNumber === "number" && typeof value.readingTitle === "string" && typeof value.completionDate === "string" && typeof value.reviewNumber === "number" && typeof value.reviewType === "string" && typeof value.dueDate === "string" && (value.status === "pending" || value.status === "completed") && typeof value.completedAt === "string" && typeof value.rewardCredit === "number" && Number.isFinite(value.rewardCredit);
const isRevisionHistory = (value: unknown): value is RevisionHistory => isRevisionTask(value) && isObject(value) && typeof value.earnedCredit === "number" && Number.isFinite(value.earnedCredit);
const isReadingDone = (value: unknown): value is ReadingDone => isObject(value) && Object.values(value).every(items => Array.isArray(items) && items.every(item => typeof item === "number" && Number.isInteger(item) && item > 0));
const isReadingProgress = (value: unknown): value is ReadingProgress => isObject(value) && Object.values(value).every(topic => isObject(topic) && Object.values(topic).every(entry => isObject(entry) && (entry.status === undefined || typeof entry.status === "string") && (entry.incompleteCount === undefined || (typeof entry.incompleteCount === "number" && Number.isInteger(entry.incompleteCount) && entry.incompleteCount >= 0)) && (entry.credit === undefined || (typeof entry.credit === "number" && Number.isFinite(entry.credit))) && (entry.history === undefined || (Array.isArray(entry.history) && entry.history.every(item => isObject(item) && (item.status === undefined || typeof item.status === "string") && (item.credit === undefined || (typeof item.credit === "number" && Number.isFinite(item.credit))) && (item.at === undefined || typeof item.at === "string"))))));

export function isTrackerState(value: unknown): value is TrackerState {
  if (!isObject(value)) return false;
  return typeof value.schemaVersion === "number" && Array.isArray(value.readDone) && value.readDone.every(item => typeof item === "string") && Array.isArray(value.revDone) && value.revDone.every(item => typeof item === "string") && Array.isArray(value.mocks) && value.mocks.every(isMockRecord) && Array.isArray(value.logs) && value.logs.every(isStudyLog) && Array.isArray(value.rest) && value.rest.every(item => typeof item === "string") && (value.readingDone === undefined || isReadingDone(value.readingDone)) && (value.readingProgress === undefined || isReadingProgress(value.readingProgress)) && (value.completionDates === undefined || (isObject(value.completionDates) && Object.values(value.completionDates).every(v => typeof v === "string"))) && (value.revisionTasks === undefined || (Array.isArray(value.revisionTasks) && value.revisionTasks.every(isRevisionTask))) && (value.revisionHistory === undefined || (Array.isArray(value.revisionHistory) && value.revisionHistory.every(isRevisionHistory))) && (value.revisionReadinessCredit === undefined || (typeof value.revisionReadinessCredit === "number" && Number.isFinite(value.revisionReadinessCredit)));
}

function normalizeLegacy(value: unknown): TrackerState {
  if (!isObject(value)) return { schemaVersion: TRACKER_SCHEMA_VERSION, readDone: [], revDone: [], mocks: [], logs: [], rest: [], readingDone: {}, readingProgress: {}, completionDates: {}, revisionTasks: [], revisionHistory: [], revisionReadinessCredit: 0 };
  return {
    schemaVersion: typeof value.schemaVersion === "number" ? value.schemaVersion : 1,
    readDone: Array.isArray(value.readDone) ? value.readDone : [],
    revDone: Array.isArray(value.revDone) ? value.revDone : [],
    mocks: Array.isArray(value.mocks) ? value.mocks : [],
    logs: Array.isArray(value.logs) ? value.logs : [],
    rest: Array.isArray(value.rest) ? value.rest : [],
    readingDone: isReadingDone(value.readingDone) ? value.readingDone : {},
    readingProgress: isReadingProgress(value.readingProgress) ? value.readingProgress : {},
    completionDates: isObject(value.completionDates) ? Object.fromEntries(Object.entries(value.completionDates).filter(([, v]) => typeof v === "string")) : {},
    revisionTasks: Array.isArray(value.revisionTasks) ? value.revisionTasks.filter(isRevisionTask) : [],
    revisionHistory: Array.isArray(value.revisionHistory) ? value.revisionHistory.filter(isRevisionHistory) : [],
    revisionReadinessCredit: typeof value.revisionReadinessCredit === "number" ? value.revisionReadinessCredit : 0,
  };
}

export function readTrackerStateFromStorage(): TrackerState {
  if (typeof window === "undefined") throw new Error("Tracker data is only available in the browser.");
  const raw = window.localStorage.getItem(TRACKER_STORAGE_KEY) || window.localStorage.getItem("cfa-l1-tracker-v9") || window.localStorage.getItem("cfa-l1-tracker-v8");
  if (!raw) return normalizeLegacy(null);
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("The saved tracker data is not valid JSON."); }
  const data = isObject(parsed) && "data" in parsed && parsed.data ? parsed.data : parsed;
  return normalizeLegacy(data);
}

export function exportTrackerData(state: TrackerState): void {
  if (!isTrackerState(state)) throw new Error("Cannot export invalid tracker data.");
  const payload: TrackerExport = { schemaVersion: TRACKER_SCHEMA_VERSION, app: TRACKER_APP, exportedAt: new Date().toISOString(), data: state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
  anchor.href = url; anchor.download = `cfa-level-1-tracker-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importTrackerData(file: File): Promise<TrackerState> {
  if (!file) throw new Error("No file selected.");
  const text = await file.text(); let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error("The selected file is not valid JSON."); }
  if (!isObject(parsed)) throw new Error("Invalid tracker export.");
  if (parsed.app !== TRACKER_APP) throw new Error("This file is not a CFA Level I Tracker backup.");
  if (parsed.schemaVersion !== TRACKER_SCHEMA_VERSION && parsed.schemaVersion !== 1) throw new Error(`Unsupported backup version: ${String(parsed.schemaVersion)}.`);
  if (!isObject(parsed.data)) throw new Error("The backup contains no tracker data.");
  return normalizeLegacy(parsed.data);
}

export function saveTrackerStateToStorage(state: TrackerState): void {
  if (typeof window === "undefined") throw new Error("Tracker data is only available in the browser.");
  if (!isTrackerState(state)) throw new Error("Cannot save invalid tracker data.");
  window.localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(state));
}
