'use client';

import { useEffect, useMemo, useState } from 'react';
import { curriculumReadings, readingRanges, totalLearningModules } from './lib/curriculumReadings';

const STORE = 'cfa-l1-tracker-v10';
const LEGACY_STORES = ['cfa-l1-tracker-v9', 'cfa-l1-tracker-v8'];
const SCHEMA_VERSION = 2;
const TOTAL_READINGS = totalLearningModules; // 102
const REVISION_WEIGHT = 20;
const REVISION_CREDIT_PER_READING = REVISION_WEIGHT / TOTAL_READINGS;
const REWARDED_REVIEW_CREDIT = REVISION_CREDIT_PER_READING / 3;

const TOPICS = [
  ['quantitativeMethods', 'Quantitative Methods', 'Sep 1–21', 32, 12.5],
  ['financialStatementAnalysis', 'Financial Statement Analysis', 'Sep 22–Oct 27', 52, 12.5],
  ['fixedIncome', 'Fixed Income', 'Oct 28–Nov 24', 46, 12.5],
  ['corporateFinance', 'Corporate Finance', 'Nov 25–Dec 15', 26, 7.5],
  ['equities', 'Equities', 'Dec 16–Jan 12', 44, 12.5],
  ['economics', 'Economics', 'Jan 13–Feb 2', 32, 7.5],
  ['portfolioConstruction', 'Portfolio Construction', 'Feb 3–23', 32, 10],
  ['derivativesAndRiskManagement', 'Derivatives and Risk Management', 'Feb 24–Mar 9', 26, 7.5],
  ['alternativeInvestments', 'Alternative Investments', 'Mar 10–23', 22, 7.5],
  ['ethics', 'Ethical and Professional Standards', 'Mar 24–Apr 7', 48, 12.5],
];

const TOPIC_NAMES = Object.fromEntries(TOPICS.map(([id, name]) => [id, name]));
const TODAY = () => new Date().toISOString().slice(0, 10);
const parseDate = value => new Date(`${String(value)}T12:00:00`);
const formatDate = value => {
  const d = parseDate(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const addDays = (value, amount) => {
  const d = parseDate(value);
  d.setDate(d.getDate() + amount);
  return d.toISOString().slice(0, 10);
};
const daysLate = (due, today) => Math.max(0, Math.floor((parseDate(today) - parseDate(due)) / 86400000));
const readingList = topicId => {
  const [start] = readingRanges[topicId] || [1];
  return (curriculumReadings[topicId] || []).map((title, index) => ({
    topicId,
    number: start + index,
    title,
    id: `${topicId}:${start + index}`,
  }));
};

const ALL_READINGS = TOPICS.flatMap(([topicId]) => readingList(topicId));
const READING_BY_ID = Object.fromEntries(ALL_READINGS.map(item => [item.id, item]));
const readingIdFor = (topicId, number) => `${topicId}:${number}`;

const freshMocks = () =>
  ['2027-06-16','2027-06-21','2027-06-26','2027-07-01','2027-07-06','2027-07-11','2027-07-16','2027-07-21','2027-07-26','2027-08-01','2027-08-05','2027-08-10']
    .map((date, index) => ({ id: index + 1, date, score: '', done: false, completedAt: '' }));

function emptyState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    readDone: [],
    revDone: [],
    mocks: freshMocks(),
    logs: [],
    rest: [],
    readingDone: {},
    readingProgress: {},
    completionDates: {},
    revisionTasks: [],
    revisionHistory: [],
    revisionReadinessCredit: 0,
  };
}

const normalizeTopic = value => {
  const aliases = {
    quant: 'quantitativeMethods', fsa1: 'financialStatementAnalysis', fsa2: 'financialStatementAnalysis',
    fi1: 'fixedIncome', fi2: 'fixedIncome', ci: 'corporateFinance', equity: 'equities',
    econ: 'economics', pm: 'portfolioConstruction', deriv: 'derivativesAndRiskManagement',
    alts: 'alternativeInvestments', ethics: 'ethics',
  };
  return aliases[value] || value;
};

function buildSchedule(topicId, readingNumber, completionDate) {
  const reading = READING_BY_ID[readingIdFor(topicId, readingNumber)];
  if (!reading || !completionDate) return [];
  return [
    { taskId: `${reading.id}:d1`, readingId: reading.id, topicId, readingNumber, readingTitle: reading.title, completionDate, reviewNumber: 1, reviewType: 'Day 1', dueDate: addDays(completionDate, 1), status: 'pending', completedAt: '', rewardCredit: REWARDED_REVIEW_CREDIT },
    { taskId: `${reading.id}:d7`, readingId: reading.id, topicId, readingNumber, readingTitle: reading.title, completionDate, reviewNumber: 2, reviewType: 'Day 7', dueDate: addDays(completionDate, 7), status: 'pending', completedAt: '', rewardCredit: REWARDED_REVIEW_CREDIT },
    { taskId: `${reading.id}:d21`, readingId: reading.id, topicId, readingNumber, readingTitle: reading.title, completionDate, reviewNumber: 3, reviewType: 'Day 21', dueDate: addDays(completionDate, 21), status: 'pending', completedAt: '', rewardCredit: REWARDED_REVIEW_CREDIT },
    { taskId: `${reading.id}:r:${addDays(completionDate, 42)}`, readingId: reading.id, topicId, readingNumber, readingTitle: reading.title, completionDate, reviewNumber: 4, reviewType: 'Retention review', dueDate: addDays(completionDate, 42), status: 'pending', completedAt: '', rewardCredit: 0 },
  ];
}

function cleanLogs(value) {
  return Array.isArray(value)
    ? value.filter(Boolean).map((item, index) => ({
        id: item.id ?? `${Date.now()}-${index}`,
        date: typeof item.date === 'string' ? item.date : TODAY(),
        hours: Number(item.hours) || 0,
        topic: normalizeTopic(item.topic),
        focus: typeof item.focus === 'string' ? item.focus : '',
        readingNumber: Number.isInteger(Number(item.readingNumber)) ? Number(item.readingNumber) : undefined,
        readingTitle: typeof item.readingTitle === 'string' ? item.readingTitle : undefined,
        readingStatus: item.readingStatus === 'completed' || item.readingStatus === 'incomplete' ? item.readingStatus : undefined,
      })).filter(item => item.hours > 0)
    : [];
}

function cleanReadDone(value) {
  return Array.isArray(value) ? [...new Set(value.map(normalizeTopic).filter(topicId => TOPIC_NAMES[topicId]))] : [];
}

function cleanReadingDone(value) {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value).map(([topicId, nums]) => [
    normalizeTopic(topicId),
    Array.isArray(nums) ? [...new Set(nums.map(Number).filter(Number.isInteger))] : [],
  ]));
}

function cleanReadingProgress(value) {
  if (!value || typeof value !== 'object') return {};
  return value;
}

function cleanTasks(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(item => item && typeof item === 'object' && item.taskId && item.readingId && item.dueDate).map(item => ({
    ...item,
    status: item.status === 'completed' ? 'completed' : 'pending',
    completedAt: typeof item.completedAt === 'string' ? item.completedAt : '',
    rewardCredit: Number.isFinite(Number(item.rewardCredit)) ? Number(item.rewardCredit) : 0,
  }));
}

/*
 * Migration policy:
 * older backups pre-date reading-level completion dates. When a reading is known
 * complete but has no stored base date, the first migration run uses today's date
 * as a conservative anchor and documents the choice in this code path.
 */
function migrateState(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const next = emptyState();
  next.readDone = cleanReadDone(source.readDone);
  next.mocks = Array.isArray(source.mocks) ? source.mocks : freshMocks();
  next.logs = cleanLogs(source.logs);
  next.rest = Array.isArray(source.rest) ? source.rest.filter(x => typeof x === 'string') : [];
  next.readingDone = cleanReadingDone(source.readingDone);
  next.readingProgress = cleanReadingProgress(source.readingProgress);
  next.completionDates = source.completionDates && typeof source.completionDates === 'object' ? source.completionDates : {};
  next.revisionHistory = Array.isArray(source.revisionHistory) ? source.revisionHistory : [];
  next.revisionReadinessCredit = Number(source.revisionReadinessCredit) || 0;
  next.revisionTasks = cleanTasks(source.revisionTasks);

  const derivedCompleted = {};
  TOPICS.forEach(([topicId]) => {
    const existing = Array.isArray(next.readingDone[topicId]) ? [...next.readingDone[topicId]] : [];
    const progress = next.readingProgress[topicId];
    if (progress && typeof progress === 'object') {
      Object.entries(progress).forEach(([number, entry]) => {
        if (entry?.status === 'completed') existing.push(Number(number));
      });
    }
    if (next.readDone.includes(topicId)) {
      readingList(topicId).forEach(reading => existing.push(reading.number));
    }
    derivedCompleted[topicId] = [...new Set(existing.filter(Number.isInteger))].sort((a, b) => a - b);
  });
  next.readingDone = derivedCompleted;

  ALL_READINGS.forEach(reading => {
    const completed = next.readingDone[reading.topicId]?.includes(reading.number);
    if (!completed) return;
    const key = reading.id;
    if (!next.completionDates[key]) {
      const linked = next.logs
        .filter(log => log.topic === reading.topicId && log.readingNumber === reading.number && log.readingStatus === 'completed')
        .sort((a, b) => parseDate(a.date) - parseDate(b.date))[0];
      next.completionDates[key] = linked?.date || TODAY();
    }
    if (!next.revisionTasks.some(task => task.readingId === key)) {
      next.revisionTasks.push(...buildSchedule(reading.topicId, reading.number, next.completionDates[key]));
    }
  });

  next.schemaVersion = SCHEMA_VERSION;
  next.revDone = [];
  next.revisionReadinessCredit = next.revisionTasks.reduce((sum, task) => sum + (task.status === 'completed' ? Number(task.rewardCredit || 0) : 0), 0);
  return next;
}

function dueToday(tasks, today) {
  return tasks.filter(task => task.status !== 'completed' && task.dueDate === today);
}

function overdueTasks(tasks, today) {
  return tasks.filter(task => task.status !== 'completed' && task.dueDate < today).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

function upcomingTasks(tasks, today) {
  const end = addDays(today, 7);
  return tasks.filter(task => task.status !== 'completed' && task.dueDate > today && task.dueDate <= end).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

function readinessFromState(state) {
  const first = ALL_READINGS.reduce((sum, reading) => {
    const done = state.readingDone?.[reading.topicId]?.includes(reading.number);
    const topic = TOPICS.find(item => item[0] === reading.topicId);
    const topicWeight = topic?.[4] || 0;
    const topicCount = readingList(reading.topicId).length || 1;
    return sum + (done ? (topicWeight / 100) * 50 / topicCount : 0);
  }, 0);
  const revision = Math.min(REVISION_WEIGHT, (state.revisionTasks || []).reduce((sum, task) => sum + (task.status === 'completed' ? Number(task.rewardCredit || 0) : 0), 0));
  const mockDone = (state.mocks || []).filter(mock => mock.done).length;
  return { first, revision, mocks: mockDone / 12 * 30, total: first + revision + mockDone / 12 * 30 };
}

function sameReading(log, topicId, readingNumber) {
  return log?.topic === topicId && Number(log?.readingNumber) === Number(readingNumber);
}

function createReadingProgress(existing, status, timestamp) {
  const count = Number(existing?.incompleteCount) || 0;
  if (status === 'incomplete' && count >= 2) return null;
  const nextCount = status === 'incomplete' ? count + 1 : count;
  const history = Array.isArray(existing?.history) ? [...existing.history] : [];
  if (status === 'completed') history.push({ status, credit: 1, at: timestamp });
  else if (nextCount === 1) history.push({ status, credit: 0.5, at: timestamp });
  else {
    const lastIncomplete = [...history].map((item, index) => [item, index]).reverse().find(([item]) => item?.status === 'incomplete');
    if (lastIncomplete) history[lastIncomplete[1]] = { ...history[lastIncomplete[1]], credit: 0.25 };
    history.push({ status, credit: 0.25, at: timestamp });
  }
  return { status, incompleteCount: nextCount, credit: status === 'completed' ? 1 : 0.5, history };
}

function revisionRewardFor(task) {
  return task.reviewType === 'Retention review' ? 0 : REWARDED_REVIEW_CREDIT;
}

function completionSummary(reading) {
  return `${reading.title} · ${TOPIC_NAMES[reading.topicId]}`;
}

export default function Home() {
  const [tab, setTab] = useState('Dashboard');
  const [state, setState] = useState(emptyState());
  const [ready, setReady] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [revisionFilter, setRevisionFilter] = useState('Due today');
  const [revisionSort, setRevisionSort] = useState('due');
  const [logDate, setLogDate] = useState(TODAY());
  const [logHours, setLogHours] = useState('');
  const [logTopic, setLogTopic] = useState('quantitativeMethods');
  const [logReading, setLogReading] = useState(1);
  const [logFocus, setLogFocus] = useState('');
  const [mockDialog, setMockDialog] = useState(null);
  const [mockScore, setMockScore] = useState('');

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORE) || LEGACY_STORES.map(key => window.localStorage.getItem(key)).find(Boolean);
      const parsed = raw ? JSON.parse(raw) : {};
      const migrated = migrateState(parsed);
      setState(migrated);
      window.localStorage.setItem(STORE, JSON.stringify(migrated));
    } catch {
      setState(emptyState());
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(STORE, JSON.stringify({ ...state, schemaVersion: SCHEMA_VERSION })); } catch {}
  }, [state, ready]);

  const readiness = useMemo(() => readinessFromState(state), [state]);
  const today = TODAY();
  const todayTasks = useMemo(() => dueToday(state.revisionTasks || [], today), [state.revisionTasks, today]);
  const overdue = useMemo(() => overdueTasks(state.revisionTasks || [], today), [state.revisionTasks, today]);
  const upcoming = useMemo(() => upcomingTasks(state.revisionTasks || [], today), [state.revisionTasks, today]);
  const completedHistory = useMemo(() => (state.revisionHistory || []).slice().sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt))), [state.revisionHistory]);
  const selectedRevisionTasks = useMemo(() => {
    if (revisionFilter === 'Due today') return todayTasks;
    if (revisionFilter === 'Overdue') return overdue;
    if (revisionFilter === 'Upcoming') return upcoming.slice().sort((a, b) => revisionSort === 'due' ? a.dueDate.localeCompare(b.dueDate) : a.readingTitle.localeCompare(b.readingTitle));
    return completedHistory;
  }, [revisionFilter, todayTasks, overdue, upcoming, completedHistory, revisionSort]);

  const studyHours = state.logs.reduce((sum, log) => sum + Number(log.hours || 0), 0);
  const currentTopicReading = readingList(logTopic).find(item => item.number === Number(logReading)) || readingList(logTopic)[0];
  const topicStats = useMemo(() => TOPICS.map(topic => {
    const [topicId, name, dateRange, hours, weight] = topic;
    const readings = readingList(topicId);
    const completed = readings.filter(reading => state.readingDone?.[topicId]?.includes(reading.number)).length;
    const logged = state.logs.filter(log => log.topic === topicId).reduce((sum, log) => sum + Number(log.hours || 0), 0);
    return { topicId, name, dateRange, hours, weight, readings, completed, logged };
  }), [state.readingDone, state.logs]);

  const streak = useMemo(() => {
    let count = 0;
    const cursor = new Date();
    cursor.setHours(12, 0, 0, 0);
    for (let i = 0; i < 365; i += 1) {
      const key = cursor.toISOString().slice(0, 10);
      const active = state.logs.some(log => log.date === key && Number(log.hours) > 0);
      if (!active && !state.rest.includes(key)) break;
      if (active) count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [state.logs, state.rest]);

  const openCompletionDialog = (reading, source = 'topics') => {
    const existing = state.readingProgress?.[reading.topicId]?.[reading.number];
    setDialog({
      kind: 'readingCompletion',
      source,
      reading,
      status: 'completed',
      date: source === 'topics' ? today : logDate,
      hours: source === 'studyLog' ? logHours : '',
      error: '',
      existing,
    });
  };

  const saveReadingDialog = () => {
    if (!dialog?.reading) return;
    const numericHours = Number(dialog.hours);
    if (!dialog.date || !Number.isFinite(numericHours) || numericHours <= 0) {
      setDialog(prev => ({ ...prev, error: 'Study hours must be a positive number.' }));
      return;
    }
    const { reading, status, date } = dialog;
    const timestamp = new Date().toISOString();

    setState(prev => {
      const next = migrateState(prev);
      const progressByTopic = { ...next.readingProgress, [reading.topicId]: { ...(next.readingProgress?.[reading.topicId] || {}) } };
      const existing = progressByTopic[reading.topicId]?.[reading.number] || {};
      const updatedProgress = createReadingProgress(existing, status, timestamp);
      if (!updatedProgress) return next;
      progressByTopic[reading.topicId][reading.number] = updatedProgress;

      const readingDone = { ...next.readingDone, [reading.topicId]: [...(next.readingDone?.[reading.topicId] || [])] };
      const currentDone = new Set(readingDone[reading.topicId]);
      const logs = [...next.logs];
      const session = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        date,
        hours: numericHours,
        topic: reading.topicId,
        focus: dialog.focus?.trim() || `Reading ${String(reading.number).padStart(2, '0')} — ${status === 'completed' ? 'Completed' : 'Incomplete'}`,
        readingNumber: reading.number,
        readingTitle: reading.title,
        readingStatus: status,
      };

      if (status === 'completed') {
        currentDone.add(reading.number);
        next.completionDates = { ...next.completionDates, [reading.id]: date };
        next.revisionTasks = [
          ...next.revisionTasks.filter(task => task.readingId !== reading.id),
          ...buildSchedule(reading.topicId, reading.number, date),
        ];
      } else {
        currentDone.delete(reading.number);
      }

      readingDone[reading.topicId] = [...currentDone].sort((a, b) => a - b);
      const allCompleted = readingDone[reading.topicId].length === readingList(reading.topicId).length;
      const readDone = new Set(next.readDone);
      if (allCompleted) readDone.add(reading.topicId); else readDone.delete(reading.topicId);
      logs.unshift(session);
      return { ...next, readingProgress: progressByTopic, readingDone, readDone: [...readDone], logs };
    });
    setDialog(null);
  };

  const confirmUncomplete = reading => setDialog({ kind: 'uncompleteReading', reading, error: '' });

  const doUncomplete = reading => {
    setState(prev => {
      const next = migrateState(prev);
      const logs = next.logs.filter(log => !sameReading(log, reading.topicId, reading.number));
      const readingDone = { ...next.readingDone, [reading.topicId]: (next.readingDone?.[reading.topicId] || []).filter(number => number !== reading.number) };
      const readingProgress = { ...next.readingProgress, [reading.topicId]: { ...(next.readingProgress?.[reading.topicId] || {}) } };
      delete readingProgress[reading.topicId][reading.number];
      const completionDates = { ...next.completionDates };
      delete completionDates[reading.id];
      const remainingTasks = next.revisionTasks.filter(task => task.readingId !== reading.id);
      return {
        ...next,
        logs,
        readingDone,
        readingProgress,
        completionDates,
        revisionTasks: remainingTasks,
        revisionHistory: next.revisionHistory.filter(item => item.readingId !== reading.id),
        revisionReadinessCredit: remainingTasks.reduce((sum, task) => sum + (task.status === 'completed' ? Number(task.rewardCredit || 0) : 0), 0),
        readDone: TOPICS.filter(([topicId]) => (((topicId === reading.topicId ? readingDone[topicId] : next.readingDone?.[topicId]) || []).length === readingList(topicId).length)).map(item => item[0]),
      };
    });
    setDialog(null);
  };

  const markRevisionComplete = task => {
    if (!task || task.status === 'completed' || task.dueDate > today) return;
    const completedAt = today;
    setState(prev => {
      const next = migrateState(prev);
      const completedTask = { ...task, status: 'completed', completedAt };
      const tasks = next.revisionTasks.map(item => item.taskId === task.taskId ? completedTask : item);
      const history = [{ ...completedTask, earnedCredit: revisionRewardFor(task) }, ...next.revisionHistory];
      if (task.reviewType === 'Retention review') {
        const nextDue = addDays(task.dueDate, 21);
        tasks.push({
          ...task,
          taskId: `${task.readingId}:r:${nextDue}`,
          reviewNumber: Number(task.reviewNumber || 4) + 1,
          reviewType: 'Retention review',
          dueDate: nextDue,
          status: 'pending',
          completedAt: '',
          rewardCredit: 0,
        });
      }
      const credit = tasks.reduce((sum, item) => sum + (item.status === 'completed' ? Number(item.rewardCredit || 0) : 0), 0);
      return { ...next, revisionTasks: tasks, revisionHistory: history, revisionReadinessCredit: Math.min(REVISION_WEIGHT, credit) };
    });
  };

  const addGeneralLog = event => {
    event.preventDefault();
    const numericHours = Number(logHours);
    if (!logDate || !Number.isFinite(numericHours) || numericHours <= 0 || !currentTopicReading) return;
    setState(prev => migrateState({
      ...prev,
      logs: [{
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        date: logDate,
        hours: numericHours,
        topic: logTopic,
        focus: logFocus.trim(),
        readingNumber: currentTopicReading.number,
        readingTitle: currentTopicReading.title,
        readingStatus: undefined,
      }, ...prev.logs],
    }));
    setLogHours('');
    setLogFocus('');
  };

  const deleteLog = id => setState(prev => ({ ...prev, logs: prev.logs.filter(item => item.id !== id) }));
  const toggleRest = date => setState(prev => ({ ...prev, rest: prev.rest.includes(date) ? prev.rest.filter(item => item !== date) : [...prev.rest, date] }));

  const resetStudy = () => {
    if (!window.confirm('Reset Study Data? This clears Study Log entries, reading completion/progress history, revision schedules/history/credit, and rest days.')) return;
    setState(prev => ({ ...emptyState(), mocks: prev.mocks.map(mock => ({ ...mock })) }));
  };

  const toggleMock = id => {
    const mock = state.mocks.find(item => item.id === id);
    if (!mock) return;
    if (mock.done) {
      setState(prev => ({ ...prev, mocks: prev.mocks.map(item => item.id === id ? { ...item, done: false, completedAt: '' } : item) }));
      return;
    }
    setMockScore(mock.score || '');
    setMockDialog(id);
  };

  const completeMock = () => {
    const score = Number(mockScore);
    if (mockDialog == null || !Number.isFinite(score) || score < 0 || score > 100) return;
    setState(prev => ({ ...prev, mocks: prev.mocks.map(item => item.id === mockDialog ? { ...item, score: String(score), done: true, completedAt: today } : item) }));
    setMockDialog(null);
    setMockScore('');
  };

  const selectableTopicReadings = readingList(logTopic);
  const dueOrOverdueCount = todayTasks.length + overdue.length;
  const topicCompletedReadings = ALL_READINGS.filter(reading => state.readingDone?.[reading.topicId]?.includes(reading.number)).length;

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">CFA LEVEL I · AUGUST 2027</div>
          <h1>Study Tracker</h1>
          <p>Track first-pass completion, reading-level revision, study time, and mocks in one system.</p>
        </div>
        <div className="count"><strong>{Math.max(0, Math.ceil((parseDate('2027-08-15') - parseDate(today)) / 86400000))}</strong><span>days to exam</span></div>
      </header>

      <nav className="nav" aria-label="Primary navigation">
        {['Dashboard', 'Revision', 'Topics', 'Study Log', 'Mocks'].map(item => (
          <button key={item} type="button" className={tab === item ? 'active' : ''} aria-current={tab === item ? 'page' : undefined} onClick={() => setTab(item)}>{item}</button>
        ))}
      </nav>

      {tab === 'Dashboard' && (
        <>
          <section className="hero">
            <div>
              <span className="pill">READING-LEVEL SPACED REPETITION</span>
              <h2>Build readiness by revisiting what you actually studied.</h2>
              <p>First Pass contributes 50%, reading-level Revision contributes 20%, and the 12 mocks contribute 30%.</p>
              <div className="heroSummary">
                <span><span className="legendDot first" aria-hidden="true" />First Pass <span className="heroMetric">{readiness.first.toFixed(1)}%</span><span className="heroMeta"> / 50%</span></span>
                <span><span className="legendDot rev" aria-hidden="true" />Revision <span className="heroMetric">{readiness.revision.toFixed(1)}%</span><span className="heroMeta"> / 20%</span></span>
                <span><span className="legendDot mockMetric" aria-hidden="true" />Mocks <span className="heroMetric">{readiness.mocks.toFixed(1)}%</span><span className="heroMeta"> / 30%</span></span>
              </div>
            </div>
            <div className="readinessWrap">
              <div className="weightedRing" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(readiness.total)} aria-label={`${Math.round(readiness.total)} percent exam readiness`} style={{ '--first': `${readiness.first}%`, '--revEnd': `${readiness.first + readiness.revision}%`, '--total': `${readiness.total}%` }}>
                <div><span className="ringValue">{Math.round(readiness.total)}%</span><span>readiness</span></div>
              </div>
              <div className="ringCaption">100% = exam readiness</div>
            </div>
          </section>

          <section className="readinessBreakdown" aria-labelledby="readiness-breakdown-title">
            <div className="breakHead"><div><span className="sectionLabel" id="readiness-breakdown-title">READINESS BREAKDOWN</span><h3>Credit follows the new reading-level model</h3></div><span className="breakTotal">{Math.round(readiness.total)} / 100</span></div>
            <SegmentBar count={TOTAL_READINGS} done={topicCompletedReadings} label="First Pass" weight="50%" note="Reading-level completion, weighted by official topic midpoint" />
            <SegmentBar count={TOTAL_READINGS} done={(state.revisionTasks || []).filter(task => task.status === 'completed' && Number(task.rewardCredit) > 0).length} label="Revision" weight="20%" note="Three rewarded reviews per reading; retention reviews continue without extra credit" />
            <SegmentBar count={12} done={state.mocks.filter(mock => mock.done).length} label="Mocks" weight="30%" note="12 equal mock attempts" />
          </section>

          <div className="grid four">
            <KpiCard label="Overall readiness" value={`${Math.round(readiness.total)}%`} sub="Actual readiness earned" tone="blue" />
            <KpiCard label="First Pass" value={`${topicCompletedReadings}/${TOTAL_READINGS}`} sub={`${readiness.first.toFixed(1)}% earned · reading level`} tone="cyan" />
            <KpiCard label="Revision" value={`${readiness.revision.toFixed(1)}%`} sub={`${todayTasks.length} due today · ${overdue.length} overdue`} tone="purple" />
            <KpiCard label="Mocks" value={`${state.mocks.filter(mock => mock.done).length}/12`} sub={`${readiness.mocks.toFixed(1)}% earned · mock score bank`} tone="orange" />
          </div>

          <section className="panel revisionTodayPanel" aria-labelledby="dashboard-revisions-title">
            <div className="panelHead">
              <div><span className="sectionLabel">DAILY RETENTION</span><h2 id="dashboard-revisions-title">Today’s revisions</h2><p>{upcoming.length} due in the next 7 days beyond today. Complete late tasks without moving their original due dates.</p></div>
              <button className="primary" type="button" onClick={() => { setTab('Revision'); setRevisionFilter('Due today'); }}>Open Revision</button>
            </div>
            {todayTasks.length === 0 && overdue.length === 0 ? (
              <div className="revisionEmpty"><div className="emptyIcon" aria-hidden="true">✓</div><h3>No revisions are due today.</h3><p>Keep the queue clean. Your next spaced-repetition tasks will appear here automatically.</p></div>
            ) : (
              <div className="revisionQueue">
                {overdue.length > 0 && <div className="queueGroup"><div className="queueGroupHead"><span>OVERDUE</span><strong>{overdue.length}</strong></div>{overdue.map(task => <RevisionRow key={task.taskId} task={task} today={today} onComplete={markRevisionComplete} />)}</div>}
                {todayTasks.length > 0 && <div className="queueGroup"><div className="queueGroupHead"><span>DUE TODAY</span><strong>{todayTasks.length}</strong></div>{todayTasks.map(task => <RevisionRow key={task.taskId} task={task} today={today} onComplete={markRevisionComplete} />)}</div>}
              </div>
            )}
            <div className="upcomingCompact"><span><strong>{upcoming.length}</strong> upcoming in the next 7 days</span><button type="button" className="ghost" onClick={() => { setTab('Revision'); setRevisionFilter('Upcoming'); }}>View upcoming</button></div>
          </section>

          <div className="dashboardGrid">
            <section className="panel"><div className="panelHead"><div><span className="sectionLabel">EXECUTION</span><h3>Study activity</h3><p>{studyHours.toFixed(1)}h logged · {streak} day streak</p></div></div><div className="activitySummary"><span>{state.logs.length}</span><small>study sessions</small><span>{topicCompletedReadings}</span><small>readings complete</small><span>{dueOrOverdueCount}</span><small>due or overdue</small></div></section>
            <section className="panel"><div className="panelHead"><div><span className="sectionLabel">NEXT READING</span><h3>{ALL_READINGS.find(reading => !state.readingDone?.[reading.topicId]?.includes(reading.number))?.title || 'All readings complete'}</h3><p>{ALL_READINGS.find(reading => !state.readingDone?.[reading.topicId]?.includes(reading.number)) ? TOPIC_NAMES[ALL_READINGS.find(reading => !state.readingDone?.[reading.topicId]?.includes(reading.number)).topicId] : 'Ready for retention work'}</p></div><button className="primary" type="button" onClick={() => setTab('Topics')}>Open Topics</button></div><div className="nextState"><span className="statusDot" aria-hidden="true" /><span>Reading-level completion drives first-pass credit</span></div></section>
          </div>
        </>
      )}

      {tab === 'Revision' && (
        <section className="panel revisionPage">
          <div className="panelHead revisionPageHead">
            <div><span className="sectionLabel">SPACED REPETITION</span><h2>Revision workspace</h2><p>Every completed reading is scheduled for Day 1, Day 7, Day 21, then a rolling 21-day retention cycle.</p></div>
            <div className="revisionReadinessBadge"><strong>{readiness.revision.toFixed(2)}%</strong><span>earned / 20%</span></div>
          </div>

          <div className="grid four revisionSummaryCards">
            <KpiCard label="Revision readiness" value={`${readiness.revision.toFixed(2)}%`} sub={`out of ${REVISION_WEIGHT}%`} tone="purple" />
            <KpiCard label="Due today" value={String(todayTasks.length)} sub="Ready to review now" tone="blue" />
            <KpiCard label="Overdue" value={String(overdue.length)} sub="Complete without losing the due date" tone="orange" />
            <KpiCard label="Next 7 days" value={String(upcoming.length)} sub="Upcoming revision tasks" tone="cyan" />
          </div>

          <div className="revisionControls" role="toolbar" aria-label="Revision filters">
            <div className="tabStrip" role="tablist" aria-label="Revision sections">
              {['Due today', 'Overdue', 'Upcoming', 'Completed history'].map(filter => <button key={filter} type="button" role="tab" aria-selected={revisionFilter === filter} className={revisionFilter === filter ? 'selected' : ''} onClick={() => setRevisionFilter(filter)}>{filter}</button>)}
            </div>
            {revisionFilter === 'Upcoming' && <label>Sort<select value={revisionSort} onChange={event => setRevisionSort(event.target.value)}><option value="due">Due date</option><option value="reading">Reading title</option></select></label>}
          </div>

          {selectedRevisionTasks.length === 0 ? (
            <div className="revisionEmpty large"><div className="emptyIcon" aria-hidden="true">{revisionFilter === 'Completed history' ? '↺' : '✓'}</div><h3>{revisionFilter === 'Completed history' ? 'No revision history yet.' : `No ${revisionFilter.toLowerCase()} revision tasks.`}</h3><p>{revisionFilter === 'Upcoming' ? 'As readings are completed, the next tasks will appear here in due-date order.' : 'Your spaced-repetition queue is clear for this view.'}</p></div>
          ) : (
            <div className="revisionList">{selectedRevisionTasks.map(task => <RevisionRow key={`${task.taskId}-${task.completedAt || ''}`} task={task} today={today} onComplete={markRevisionComplete} history={revisionFilter === 'Completed history'} />)}</div>
          )}
        </section>
      )}

      {tab === 'Topics' && (
        <section className="panel">
          <div className="panelHead"><div><span className="sectionLabel">READING TRACKER</span><h2>Topics & readings</h2><p>Complete readings one at a time. Each completion asks for study time, stores a reading-linked session, and starts its revision cycle.</p></div><button className="ghost" type="button" onClick={resetStudy}>Reset Study Data</button></div>
          <div className="topicGrid readingTopicGrid">
            {topicStats.map(topic => (
              <article className="topic readingTopicCard" key={topic.topicId}>
                <div className="topicTop"><div><span className="topicTitle">{topic.name}</span><span>{topic.completed}/{topic.readings.length} readings · {topic.logged.toFixed(1)}h logged · {topic.hours}h planned</span></div><span className={`status ${topic.completed === topic.readings.length ? 'doneText' : ''}`}>{topic.completed === topic.readings.length ? 'TOPIC COMPLETE' : 'IN PROGRESS'}</span></div>
                <div className="topicModuleProgress" role="progressbar" aria-label={`${topic.name} reading completion`} aria-valuemin="0" aria-valuemax={topic.readings.length} aria-valuenow={topic.completed} aria-valuetext={`${topic.completed} of ${topic.readings.length} readings complete`}><span className="topicModuleTrack"><span className="topicModuleFill" style={{ width: `${topic.completed / topic.readings.length * 100}%` }} /></span><span className="topicModuleValue">{topic.completed}/{topic.readings.length}</span></div>
                <ol className="topicReadingsList">
                  {topic.readings.map(reading => {
                    const done = state.readingDone?.[reading.topicId]?.includes(reading.number);
                    const progress = state.readingProgress?.[reading.topicId]?.[reading.number];
                    const incompleteCount = Number(progress?.incompleteCount) || 0;
                    const locked = incompleteCount >= 2 && !done;
                    return <li key={reading.id} className={done ? 'isComplete' : locked ? 'isLockedIncomplete' : ''}><label className="topicReadingCheck"><input type="checkbox" checked={done} onChange={() => done ? confirmUncomplete(reading) : openCompletionDialog(reading, 'topics')} aria-label={`Reading ${reading.number}: ${reading.title}. ${done ? 'Completed' : locked ? 'Two incomplete attempts used' : 'Open'}.`} /><span className="topicReadingCheckBox" aria-hidden="true"/><span className="topicReadingNumber">Reading {String(reading.number).padStart(2, '0')}</span><span className="topicReadingTitle">{reading.title}</span><span className="topicReadingStatus">{done ? 'Completed' : locked ? '2 incomplete attempts' : incompleteCount ? 'Incomplete · 50% credit' : 'Open'}</span></label></li>;
                  })}
                </ol>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'Study Log' && (
        <section className="panel">
          <div className="panelHead"><div><span className="sectionLabel">EXECUTION LOG</span><h2>Study Log</h2><p>Log reading-level study sessions without breaking the link between a reading and its revision schedule.</p></div><button className="ghost" type="button" onClick={resetStudy}>Reset Study Data</button></div>
          <form className="logForm" onSubmit={addGeneralLog}>
            <label>Date<input type="date" value={logDate} onChange={event => setLogDate(event.target.value)} /></label>
            <label>Hours<input type="number" min="0.25" step="0.25" value={logHours} onChange={event => setLogHours(event.target.value)} placeholder="2.5" /></label>
            <label>Topic<select value={logTopic} onChange={event => { setLogTopic(event.target.value); setLogReading(readingList(event.target.value)[0]?.number || 1); }}>{TOPICS.map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
            <label>Reading<select value={currentTopicReading?.number || ''} onChange={event => setLogReading(Number(event.target.value))}>{selectableTopicReadings.map(reading => <option key={reading.id} value={reading.number}>Reading {String(reading.number).padStart(2, '0')} — {reading.title}</option>)}</select></label>
            <label className="wide">Focus / notes<input value={logFocus} onChange={event => setLogFocus(event.target.value)} placeholder="TVM practice, question set, notes…" /></label>
            <button className="primary" type="submit">Add study session</button>
          </form>

          <div className="studyLogCompletionCta"><div><span className="sectionLabel">READING COMPLETION</span><strong>Completed or incomplete?</strong><p>Use the reading dialog to apply the incomplete-attempt rules or start/reset the spaced-repetition schedule.</p></div><button className="primary" type="button" onClick={() => openCompletionDialog(currentTopicReading, 'studyLog')}>Log reading outcome</button></div>

          <div className="logStats">
            <KpiCard label="Total study" value={`${studyHours.toFixed(1)}h`} sub={`${state.logs.length} sessions`} tone="blue" />
            <KpiCard label="Completed readings" value={String(topicCompletedReadings)} sub={`of ${TOTAL_READINGS}`} tone="cyan" />
            <KpiCard label="Revision credit" value={`${readiness.revision.toFixed(2)}%`} sub="of 20%" tone="purple" />
            <KpiCard label="Study streak" value={`${streak}`} sub="active study days" tone="orange" />
          </div>

          <div className="logList">
            {state.logs.length ? state.logs.map(log => <div className="logRow" key={log.id}><span>{formatDate(log.date)}</span><span className="logHoursValue">{Number(log.hours).toFixed(1)}h</span><span>{TOPIC_NAMES[log.topic] || log.topic}</span><span>{log.readingNumber ? `Reading ${String(log.readingNumber).padStart(2, '0')} · ${log.readingTitle || 'Reading'}` : 'General session'}</span><span>{log.focus || '—'}</span><button type="button" onClick={() => deleteLog(log.id)} aria-label={`Delete study session from ${formatDate(log.date)}`}>×</button></div>) : <div className="empty">No study sessions logged yet.</div>}
          </div>
        </section>
      )}

      {tab === 'Mocks' && (
        <section className="panel">
          <div className="panelHead"><div><span className="sectionLabel">MOCK PRACTICE · 30%</span><h2>Mock score bank</h2><p>Each completed mock contributes 2.5% of overall readiness.</p></div><button className="ghost" type="button" onClick={() => setState(prev => ({ ...prev, mocks: freshMocks() }))}>Reset mock data</button></div>
          <div className="mockGrid">{state.mocks.map(mock => <article className={`mock ${mock.done ? 'mockDone' : ''}`} key={mock.id}><div className="mockTop"><div><span>MOCK {mock.id}</span><span className="mockDate">{formatDate(mock.date)}</span></div><button type="button" className={`check ${mock.done ? 'done' : ''}`} aria-pressed={mock.done} onClick={() => toggleMock(mock.id)}>{mock.done ? '✓' : ''}</button></div><div className="mockScore">{mock.done ? <><span className="mockScoreValue">{mock.score}%</span><span>Completed {formatDate(mock.completedAt)} · +2.5% readiness</span></> : <span>Not completed · +2.5% available</span>}</div><button type="button" className="ghost mockAction" onClick={() => toggleMock(mock.id)}>{mock.done ? 'Mark incomplete' : 'Mark completed'}</button></article>)}</div>
        </section>
      )}

      {dialog?.kind === 'readingCompletion' && <ReadingDialog dialog={dialog} setDialog={setDialog} onSave={saveReadingDialog} topics={TOPICS} readingsFor={readingList} readingProgress={state.readingProgress} />}

      {dialog?.kind === 'uncompleteReading' && (
        <div className="modalBackdrop" role="presentation">
          <div className="modal glassDialog" role="alertdialog" aria-modal="true" aria-labelledby="uncomplete-title"><span className="sectionLabel">REMOVE LINKED PROGRESS</span><h2 id="uncomplete-title">Uncheck this reading?</h2><p>This removes the reading’s completion state, every Study Log session linked to Reading {String(dialog.reading.number).padStart(2, '0')}, its full revision schedule, completed revision history, and revision credit. Unrelated sessions stay untouched.</p><div className="dialogReadingSummary"><strong>Reading {String(dialog.reading.number).padStart(2, '0')}</strong><span>{completionSummary(dialog.reading)}</span></div><div className="modalActions"><button className="ghost" type="button" onClick={() => setDialog(null)}>Cancel</button><button className="danger" type="button" onClick={() => doUncomplete(dialog.reading)}>Remove linked progress</button></div></div>
        </div>
      )}

      {mockDialog != null && (
        <div className="modalBackdrop" role="presentation"><div className="modal glassDialog" role="dialog" aria-modal="true" aria-labelledby="mock-dialog-title"><span className="sectionLabel">COMPLETE MOCK {mockDialog}</span><h2 id="mock-dialog-title">Enter mock score</h2><p>The score is required. Today's date is saved as the completion date.</p><label>Score (%)<input autoFocus type="number" min="0" max="100" value={mockScore} onChange={event => setMockScore(event.target.value)} placeholder="e.g. 72" /></label><div className="modalActions"><button className="ghost" type="button" onClick={() => { setMockDialog(null); setMockScore(''); }}>Cancel</button><button className="primary" type="button" disabled={mockScore === '' || !Number.isFinite(Number(mockScore)) || Number(mockScore) < 0 || Number(mockScore) > 100} onClick={completeMock}>Complete mock</button></div></div></div>
      )}

      <footer><span>Overall readiness = weighted First Pass 50% + reading-level Revision 20% + Mocks 30%</span><span>Study data stored in this browser</span></footer>
    </main>
  );
}

function ReadingDialog({ dialog, setDialog, onSave, topics, readingsFor, readingProgress }) {
  const reading = dialog.reading;
  const readingOptions = readingsFor(reading.topicId);
  const setField = (key, value) => setDialog(prev => ({ ...prev, [key]: value, error: '' }));
  const existingCount = Number(dialog.existing?.incompleteCount) || 0;
  const close = () => setDialog(null);
  return (
    <div className="modalBackdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
      <div className="modal glassDialog readingLogModal" role="dialog" aria-modal="true" aria-labelledby="reading-dialog-title">
        <div className="readingDialogHead"><div><span className="sectionLabel">{dialog.source === 'topics' ? 'TOPICS COMPLETION' : 'STUDY LOG'}</span><h2 id="reading-dialog-title">{dialog.source === 'topics' ? 'Complete this reading' : 'Record a reading outcome'}</h2><p>{TOPIC_NAMES[reading.topicId]} · Reading {String(reading.number).padStart(2, '0')} · {reading.title}</p></div><button className="modalClose" type="button" aria-label="Close" onClick={close}>×</button></div>
        <div className="readingDialogFields">
          <label>Study date<input type="date" value={dialog.date} onChange={event => setField('date', event.target.value)} autoFocus /></label>
          <label>Study hours<input type="number" min="0.25" step="0.25" value={dialog.hours} onChange={event => setField('hours', event.target.value)} placeholder="2.5" /></label>
          <label>Topic<select value={reading.topicId} onChange={event => { const nextReadings = readingsFor(event.target.value); const nextReading = nextReadings[0]; const existing = readingProgress?.[event.target.value]?.[nextReading?.number]; setDialog(prev => ({ ...prev, reading: nextReading, existing, error: '' })); }}>{topics.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
          <label>Reading<select value={reading.number} onChange={event => { const next = readingsFor(reading.topicId).find(item => item.number === Number(event.target.value)); const existing = readingProgress?.[reading.topicId]?.[next?.number]; setDialog(prev => ({ ...prev, reading: next, existing, error: '' })); }}>{readingOptions.map(item => <option key={item.id} value={item.number}>Reading {String(item.number).padStart(2, '0')} — {item.title}</option>)}</select></label>
        </div>
        <div className="readingStatusGroup" role="group" aria-label="Reading completion status"><span className="readingStatusLabel">Reading outcome</span><div className="readingStatusOptions"><button type="button" className={dialog.status === 'completed' ? 'selected' : ''} onClick={() => setField('status', 'completed')}>Completed</button><button type="button" className={`${dialog.status === 'incomplete' ? 'selected' : ''} ${existingCount >= 2 ? 'disabled' : ''}`} disabled={existingCount >= 2} onClick={() => setField('status', 'incomplete')}>Incomplete</button></div>{existingCount === 1 && dialog.status === 'incomplete' && <p className="readingStatusHint">First incomplete attempt = 50% credit. A second incomplete attempt converts the two attempts to 25% + 25% credit.</p>}{existingCount >= 2 && dialog.status === 'completed' && <p className="readingStatusHint">Two incomplete attempts already used. Completion is still allowed.</p>}{dialog.error && <p className="readingStatusHint warning">{dialog.error}</p>}</div>
        <div className="readingDialogPreview"><span>Selected</span><strong>Reading {String(reading.number).padStart(2, '0')}</strong><p>{reading.title}</p><small>{dialog.status === 'completed' ? 'Completion date becomes the Revision base date.' : 'No revision tasks are created for an incomplete attempt.'}</small></div>
        <div className="modalActions"><button className="ghost" type="button" onClick={close}>Cancel</button><button className="primary" type="button" onClick={onSave} disabled={!dialog.date || !dialog.hours || Number(dialog.hours) <= 0 || !Number.isFinite(Number(dialog.hours))}>{dialog.status === 'completed' ? 'Save & complete reading' : 'Save incomplete attempt'}</button></div>
      </div>
    </div>
  );
}

function RevisionRow({ task, today, onComplete, history = false }) {
  const overdue = task.status !== 'completed' && task.dueDate < today;
  const earned = Number(task.rewardCredit || 0) > 0;
  const historyEarned = Number(task.earnedCredit || task.rewardCredit || 0) > 0;
  const canComplete = task.status !== 'completed' && task.dueDate <= today;
  return (
    <article className={`revisionTaskRow ${overdue ? 'isOverdue' : ''} ${task.status === 'completed' ? 'isCompleted' : ''}`}>
      <div className="revisionTaskMain"><div className="revisionTaskEyebrow"><span className={`revisionStatusDot ${task.status === 'completed' ? 'complete' : overdue ? 'overdue' : 'pending'}`} aria-hidden="true" />{task.reviewType}{task.reviewType === 'Retention review' ? <span className="retentionBadge">RETENTION</span> : null}</div><h3>Reading {String(task.readingNumber).padStart(2, '0')} · {task.readingTitle}</h3><p>{TOPIC_NAMES[task.topicId]} · Review {task.reviewNumber} · Completion base {formatDate(task.completionDate)}</p></div>
      <div className="revisionTaskMeta"><span><small>{task.status === 'completed' ? 'Completed' : 'Due date'}</small><strong>{formatDate(task.dueDate)}</strong></span>{overdue && <span><small>Overdue</small><strong>{daysLate(task.dueDate, today)}d</strong></span>}<span><small>Reward</small><strong>{(history ? historyEarned : earned) ? `+${(history ? task.earnedCredit : task.rewardCredit).toFixed(4)}%` : 'Retention only'}</strong></span></div>
      {history ? <div className="revisionCompletionState"><span className="completedCheck">✓</span><span>{formatDate(task.completedAt)}</span><small>{historyEarned ? 'Credit earned' : 'Retention review · no extra credit'}</small></div> : <button className="primary revisionCompleteButton" type="button" disabled={!canComplete} onClick={() => onComplete(task)}>{task.status === 'completed' ? 'Completed' : canComplete ? 'Mark revised' : 'Not due yet'}</button>}
    </article>
  );
}

function KpiCard({ label, value, sub, tone }) { return <article className={`card tone-${tone}`}><span>{label}</span><span className="kpiValue">{value}</span><span className="kpiSub">{sub}</span></article>; }

function SegmentBar({ count, done, label, weight, note }) {
  const pct = count ? Math.min(100, done / count * 100) : 0;
  return <div className="segmentRow"><div className="segmentLabel"><span><span className={`legendDot ${label === 'Mocks' ? 'mockMetric' : label === 'Revision' ? 'rev' : 'first'}`} aria-hidden="true" />{label}</span><span className="segmentCount">{done}/{count}</span><span className="segmentNote">{weight} · {note}</span></div><div className="segments" role="progressbar" aria-label={`${label} progress`} aria-valuemin="0" aria-valuemax={count} aria-valuenow={done} aria-valuetext={`${done} of ${count} complete`}>{Array.from({ length: Math.min(count, 102) }, (_, index) => <span key={index} className={`segment ${index < done ? 'filled' : ''} ${label === 'Mocks' ? 'mockMetric' : label === 'Revision' ? 'rev' : 'first'}`} aria-hidden="true" />)}<span className="srOnly">{done} of {count} complete ({pct.toFixed(0)}%).</span></div></div>;
}
