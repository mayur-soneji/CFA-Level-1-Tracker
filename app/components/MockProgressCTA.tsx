"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import EmptyState from "./EmptyState";
import Modal from "./Modal";

const STORE = "cfa-l1-tracker-v10";
const LEGACY_STORE = "cfa-l1-tracker-v9";
const MOCK_DATES = [
  "2027-06-16", "2027-06-21", "2027-06-26", "2027-07-01",
  "2027-07-06", "2027-07-11", "2027-07-16", "2027-07-21",
  "2027-07-26", "2027-08-01", "2027-08-05", "2027-08-10",
];

type StoredMock = { id: number; date: string; score: string; done: boolean; completedAt: string };
type StoredState = { mocks?: StoredMock[]; [key: string]: unknown };

function freshMocks(): StoredMock[] {
  return MOCK_DATES.map((date, index) => ({ id: index + 1, date, score: "", done: false, completedAt: "" }));
}

function readMocks(): StoredMock[] {
  try {
    const raw = window.localStorage.getItem(STORE) ?? window.localStorage.getItem(LEGACY_STORE);
    const state = raw ? (JSON.parse(raw) as StoredState) : {};
    const defaults = freshMocks();
    if (!Array.isArray(state.mocks)) return defaults;
    return defaults.map((fallback, index) => {
      const value = state.mocks?.[index];
      return value && typeof value === "object"
        ? { ...fallback, date: typeof value.date === "string" ? value.date : fallback.date, score: value.score == null ? "" : String(value.score), done: Boolean(value.done), completedAt: typeof value.completedAt === "string" ? value.completedAt : "" }
        : fallback;
    });
  } catch {
    return freshMocks();
  }
}

export default function MockProgressCTA() {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState("");
  const [mockId, setMockId] = useState(1);

  useEffect(() => {
    const findTarget = () => {
      const node = document.querySelector<HTMLDivElement>(".chartEmpty");
      if (!node) {
        setTarget(null);
        return;
      }
      if (node.dataset.actionable === "true") {
        setTarget(node);
        return;
      }
      node.dataset.actionable = "true";
      node.textContent = "";
      setTarget(node);
    };

    findTarget();
    const observer = new MutationObserver(findTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const openMockForm = () => {
    const firstIncomplete = readMocks().find((mock) => !mock.done)?.id ?? 1;
    setMockId(firstIncomplete);
    setScore("");
    setOpen(true);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 100) return;

    try {
      const currentRaw = window.localStorage.getItem(STORE) ?? window.localStorage.getItem(LEGACY_STORE);
      const current = currentRaw ? (JSON.parse(currentRaw) as StoredState) : {};
      const mocks = readMocks().map((mock) => mock.id === mockId
        ? { ...mock, score: String(numericScore), done: true, completedAt: new Date().toISOString().slice(0, 10) }
        : mock);
      window.localStorage.setItem(STORE, JSON.stringify({ ...current, mocks }));
      setOpen(false);
      window.location.reload();
    } catch {
      // Keep the modal open so the user can retry if browser storage is unavailable.
    }
  };

  if (!target) return null;

  return (
    <>
      {createPortal(
        <EmptyState
          title="No completed mock scores yet"
          description="Complete a mock and enter its score to start your dated readiness trend."
          buttonText="Add mock score"
          onClick={openMockForm}
        />,
        target
      )}
      <Modal
        open={open}
        title={`Complete Mock ${mockId}`}
        description="Enter the score you earned. Today's date will be saved automatically as the completion date."
        onClose={() => setOpen(false)}
      >
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm font-semibold text-slate-700">
            Score (%)
            <input
              autoFocus
              type="number"
              min="0"
              max="100"
              step="1"
              required
              value={score}
              onChange={(event) => setScore(event.target.value)}
              placeholder="e.g. 72"
              className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            />
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >Cancel</button>
            <button
              type="submit"
              disabled={score === "" || !Number.isFinite(Number(score)) || Number(score) < 0 || Number(score) > 100}
              className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >Complete mock</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
