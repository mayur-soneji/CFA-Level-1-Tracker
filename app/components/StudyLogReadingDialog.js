'use client';

import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import { curriculumReadings, readingRanges } from '../lib/curriculumReadings';

const STORE = 'cfa-l1-tracker-v10';

const TOPICS = {
  quantitativeMethods: 'Quantitative Methods',
  financialStatementAnalysis: 'Financial Statement Analysis',
  fixedIncome: 'Fixed Income',
  corporateFinance: 'Corporate Finance',
  equities: 'Equities',
  economics: 'Economics',
  portfolioConstruction: 'Portfolio Construction',
  derivativesAndRiskManagement: 'Derivatives and Risk Management',
  alternativeInvestments: 'Alternative Investments',
  ethics: 'Ethical and Professional Standards',
};

function getTopicReadings(topicId) {
  const titles = curriculumReadings[topicId] || [];
  const [start] = readingRanges[topicId] || [1];
  return titles.map((title, index) => ({ number: start + index, title }));
}

function getState() {
  try {
    const raw = window.localStorage.getItem(STORE);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getCompletedReading(topicId) {
  const values = getState().readingDone?.[topicId];
  return Array.isArray(values) ? values : [];
}

function updateReadingProgress(topicId, readingNumber, completed) {
  try {
    const state = getState();
    const readingDone = state.readingDone && typeof state.readingDone === 'object' ? { ...state.readingDone } : {};
    const current = Array.isArray(readingDone[topicId]) ? [...readingDone[topicId]] : [];
    const next = completed
      ? [...new Set([...current, readingNumber])].sort((a, b) => a - b)
      : current.filter((n) => n !== readingNumber);
    readingDone[topicId] = next;

    const topicTotal = (curriculumReadings[topicId] || []).length;
    const readDone = new Set(Array.isArray(state.readDone) ? state.readDone : []);
    if (topicTotal > 0 && next.length === topicTotal) readDone.add(topicId);
    else readDone.delete(topicId);

    window.localStorage.setItem(STORE, JSON.stringify({
      ...state,
      readDone: [...readDone],
      readingDone,
    }));
    window.dispatchEvent(new CustomEvent('cfa-reading-progress-change', {
      detail: { topicId, readingNumber, completed },
    }));
  } catch {
    // Study-session logging remains usable if storage is temporarily unavailable.
  }
}

function setNativeValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

export default function StudyLogReadingDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [topicId, setTopicId] = useState('quantitativeMethods');
  const [readingNumber, setReadingNumber] = useState(1);
  const [status, setStatus] = useState('completed');
  const readings = useMemo(() => getTopicReadings(topicId), [topicId]);
  const selectedReading = readings.find((reading) => reading.number === readingNumber) || readings[0];
  const topicName = TOPICS[topicId] || topicId;

  useEffect(() => {
    const attach = () => {
      const targetForm = document.querySelector('.logForm');
      if (!targetForm || targetForm.dataset.readingDialogBound === 'true') return;
      targetForm.dataset.readingDialogBound = 'true';

      const focusLabel = targetForm.querySelector('.wide');
      const focusInput = focusLabel?.querySelector('input');
      if (focusLabel && focusInput) {
        focusLabel.classList.add('readingDialogField');
        focusLabel.setAttribute('data-label', 'Reading');
        focusInput.dataset.readingFocusInput = 'true';
        focusInput.setAttribute('aria-hidden', 'true');
        focusInput.tabIndex = -1;
        focusInput.style.display = 'none';

        let trigger = focusLabel.querySelector('.readingDialogTrigger');
        if (!trigger) {
          trigger = document.createElement('button');
          trigger.type = 'button';
          trigger.className = 'readingDialogTrigger';
          trigger.textContent = 'Choose a reading…';
          trigger.addEventListener('click', () => openForForm(targetForm));
          focusLabel.appendChild(trigger);
        }
      }

      const onSubmit = (event) => {
        if (targetForm.dataset.readingDialogBypass === 'true') {
          delete targetForm.dataset.readingDialogBypass;
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        openForForm(targetForm);
      };

      const openForForm = (target) => {
        const select = target.querySelector('select');
        const selectedTopic = select?.value || 'quantitativeMethods';
        const selected = getTopicReadings(selectedTopic);
        const completed = getCompletedReading(selectedTopic);
        setTopicId(selectedTopic);
        setReadingNumber(selected[0]?.number || 1);
        setStatus(completed.includes(selected[0]?.number) ? 'completed' : 'incomplete');
        setForm(target);
        setOpen(true);
      };

      targetForm.addEventListener('submit', onSubmit, true);
      targetForm._readingDialogCleanup = () => targetForm.removeEventListener('submit', onSubmit, true);
    };

    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      const targetForm = document.querySelector('.logForm');
      targetForm?._readingDialogCleanup?.();
      if (targetForm) delete targetForm.dataset.readingDialogBound;
    };
  }, []);

  useEffect(() => {
    if (!readings.some((reading) => reading.number === readingNumber)) {
      setReadingNumber(readings[0]?.number || 1);
    }
  }, [readings, readingNumber]);

  if (!open || !form || typeof document === 'undefined') return null;

  const close = () => setOpen(false);
  const completed = getCompletedReading(topicId);

  const confirm = () => {
    if (!selectedReading) return;

    // Keep the main Study Log subject state synchronized with the subject selected here.
    const subjectSelect = form.querySelector('select');
    if (subjectSelect && subjectSelect.value !== topicId) setNativeValue(subjectSelect, topicId);

    updateReadingProgress(topicId, selectedReading.number, status === 'completed');

    const focusInput = form.querySelector('input[data-reading-focus-input="true"]');
    const statusLabel = status === 'completed' ? 'Completed' : 'Incomplete';
    setNativeValue(focusInput, `Reading ${String(selectedReading.number).padStart(2, '0')} — ${selectedReading.title} — ${statusLabel}`);

    form.dataset.readingDialogBypass = 'true';
    setOpen(false);
    form.requestSubmit();
  };

  return createPortal(
    <div className="modalBackdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="modal readingLogModal" role="dialog" aria-modal="true" aria-labelledby="reading-dialog-title">
        <div className="readingDialogHead">
          <div>
            <span className="sectionLabel">STUDY SESSION</span>
            <h2 id="reading-dialog-title">Which reading did you study?</h2>
            <p>{topicName} · Select the reading and whether you completed it in this session.</p>
          </div>
          <button type="button" className="modalClose" aria-label="Close" onClick={close}>×</button>
        </div>

        <div className="readingDialogFields">
          <label>
            Subject
            <select value={topicId} onChange={(event) => {
              const nextTopic = event.target.value;
              const nextReadings = getTopicReadings(nextTopic);
              const nextCompleted = getCompletedReading(nextTopic);
              setTopicId(nextTopic);
              setReadingNumber(nextReadings[0]?.number || 1);
              setStatus(nextCompleted.includes(nextReadings[0]?.number) ? 'completed' : 'incomplete');
            }}>
              {Object.entries(TOPICS).map(([id, label]) => <option value={id} key={id}>{label}</option>)}
            </select>
          </label>

          <label>
            Reading
            <select value={selectedReading?.number || ''} onChange={(event) => {
              const nextNumber = Number(event.target.value);
              setReadingNumber(nextNumber);
              setStatus(completed.includes(nextNumber) ? 'completed' : 'incomplete');
            }}>
              {readings.map((reading) => <option value={reading.number} key={reading.number}>Reading {String(reading.number).padStart(2, '0')} — {reading.title}</option>)}
            </select>
          </label>
        </div>

        <div className="readingStatusGroup" role="group" aria-label="Reading completion status">
          <span className="readingStatusLabel">Reading status</span>
          <div className="readingStatusOptions">
            <button type="button" className={status === 'completed' ? 'selected' : ''} onClick={() => setStatus('completed')}>Completed</button>
            <button type="button" className={status === 'incomplete' ? 'selected' : ''} onClick={() => setStatus('incomplete')}>Incomplete</button>
          </div>
        </div>

        <div className="readingDialogPreview">
          <span>Selected</span>
          <strong>Reading {String(selectedReading?.number || 0).padStart(2, '0')}</strong>
          <p>{selectedReading?.title || 'No reading selected'}</p>
        </div>

        <div className="modalActions">
          <button className="ghost" type="button" onClick={close}>Cancel</button>
          <button className="primary" type="button" onClick={confirm} disabled={!selectedReading}>Add study session</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
