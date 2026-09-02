"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { getDaysRemaining, isReadingOverdue } from "../lib/dateUtils";

const EXAM_DATE_STORE = "cfa-l1-exam-date-v1";
const DEFAULT_EXAM_DATE = "2027-08-15";

const READING_END_DATES: Record<string, string> = {
  "Quantitative Methods": "2026-09-21",
  "Financial Statement Analysis": "2026-10-27",
  "Fixed Income": "2026-11-24",
  "Corporate Finance": "2026-12-15",
  "Equities": "2027-01-12",
  "Economics": "2027-02-02",
  "Portfolio Construction": "2027-02-23",
  "Derivatives and Risk Management": "2027-03-09",
  "Alternative Investments": "2027-03-23",
  "Ethical and Professional Standards": "2027-04-07",
};

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime());
}

function getStoredExamDate(): string {
  if (typeof window === "undefined") return DEFAULT_EXAM_DATE;
  const saved = window.localStorage.getItem(EXAM_DATE_STORE) || DEFAULT_EXAM_DATE;
  return isValidIsoDate(saved) ? saved : DEFAULT_EXAM_DATE;
}

function formatExamWindow(examDate: string): string {
  return new Date(`${examDate}T12:00:00`)
    .toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    .toUpperCase();
}

function overdueDays(endDate: string): number {
  return Math.max(0, Math.abs(getDaysRemaining(endDate)));
}

export default function DynamicDateController() {
  const [examDate, setExamDate] = useState(DEFAULT_EXAM_DATE);
  const [countElement, setCountElement] = useState<HTMLElement | null>(null);

  const daysRemaining = useMemo(
    () => Math.max(0, getDaysRemaining(examDate)),
    [examDate]
  );

  useEffect(() => {
    setExamDate(getStoredExamDate());
    setCountElement(document.querySelector<HTMLElement>(".count"));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(EXAM_DATE_STORE, examDate);
  }, [examDate]);

  useEffect(() => {
    const patchDashboard = () => {
      const eyebrow = document.querySelector<HTMLElement>(".eyebrow");
      if (eyebrow) {
        const nextText = `CFA LEVEL I · ${formatExamWindow(examDate)}`;
        if (eyebrow.textContent !== nextText) eyebrow.textContent = nextText;
      }

      const count = document.querySelector<HTMLElement>(".count");
      if (count) {
        const value = count.querySelector<HTMLElement>("strong");
        const meta = count.querySelector<HTMLElement>(".dynamicExamMeta");

        if (value && value.textContent !== String(daysRemaining)) {
          value.textContent = String(daysRemaining);
        }

        if (meta) {
          const label = `${daysRemaining === 1 ? "day" : "days"} to exam`;
          if (meta.textContent !== label) meta.textContent = label;
        }
      }

      const nextLabel = [...document.querySelectorAll<HTMLElement>(".sectionLabel")]
        .find((element) => element.textContent?.trim() === "NEXT TOPIC");
      const panel = nextLabel?.closest<HTMLElement>(".panel");
      if (!panel) return;

      const title = panel.querySelector("h3")?.textContent?.trim() || "";
      const endDate = READING_END_DATES[title];
      const stateText = panel.querySelector(".nextState")?.textContent?.toLowerCase() || "";
      const complete = stateText.includes("complete");
      const overdue = !!endDate && isReadingOverdue(endDate, complete);
      const existing = panel.querySelector<HTMLElement>(".dynamicOverdueBadge");

      if (overdue) {
        if (!existing) {
          const badge = document.createElement("span");
          badge.className = "dynamicOverdueBadge";
          badge.setAttribute("role", "status");
          const daysLate = overdueDays(endDate);
          badge.textContent = `Overdue by ${daysLate} ${daysLate === 1 ? "day" : "days"}`;
          panel.querySelector(".panelHead")?.appendChild(badge);
        }
        panel.style.borderColor = "rgba(251,191,36,.42)";
        panel.style.background = "linear-gradient(135deg,rgba(245,158,11,.07),rgba(255,255,255,.03))";
      } else {
        existing?.remove();
        panel.style.borderColor = "";
        panel.style.background = "";
      }
    };

    patchDashboard();
    const observer = new MutationObserver(patchDashboard);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const timer = window.setInterval(patchDashboard, 60_000);

    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [examDate, daysRemaining]);

  if (!countElement) return null;

  return createPortal(
    <label className="dynamicExamControl">
      <span className="dynamicExamControlLabel">Exam date</span>
      <input
        type="date"
        value={examDate}
        aria-label="Exam date"
        onChange={(event) => {
          const value = event.target.value;
          if (isValidIsoDate(value)) setExamDate(value);
        }}
      />
    </label>,
    countElement
  );
}
