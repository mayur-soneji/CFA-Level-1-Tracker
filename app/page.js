'use client';

import { useEffect, useMemo, useState } from 'react';

const roadmap = [
  { dates:'Sep 1–21', topic:'Quant Methods', focus:'Rates, TVM, Stats, Regression, Big Data & Machine Learning', hours:32, milestone:'Quant Complete' },
  { dates:'Sep 22–Oct 12', topic:'FSA Part 1', focus:'Standards, Income Statement, Balance Sheet, Cash Flow', hours:26, milestone:'Core FSA Concepts' },
  { dates:'Oct 13–27', topic:'FSA Part 2', focus:'Inventories, Long-Lived Assets, Taxes, Non-Current Liabilities', hours:26, milestone:'FSA Complete' },
  { dates:'Oct 28–Nov 10', topic:'Fixed Income 1', focus:'Bond Features, Markets, Yield Measures', hours:23, milestone:'Pricing foundation' },
  { dates:'Nov 11–24', topic:'Fixed Income 2', focus:'Duration, Convexity, Credit Risk & Spread Analysis', hours:23, milestone:'FI Complete' },
  { dates:'Nov 25–Dec 15', topic:'Corporate Issuers', focus:'Governance, Capital Budgeting, WACC, Leverage', hours:26, milestone:'CI Complete' },
  { dates:'Dec 16–Jan 12', topic:'Equity', focus:'Market Org, Indices, Efficiency, Valuation Models', hours:44, milestone:'Equity Complete' },
  { dates:'Jan 13–Feb 2', topic:'Economics', focus:'Micro/Macro, Business Cycles, Monetary/Fiscal, FX', hours:32, milestone:'Econ Complete' },
  { dates:'Feb 3–23', topic:'Portfolio Mgmt', focus:'Risk & Return, CAPM, Capital Allocation Line', hours:32, milestone:'PM Complete' },
  { dates:'Feb 24–Mar 9', topic:'Derivatives', focus:'Forwards, Futures, Options, Swaps Basics', hours:26, milestone:'Deriv Complete' },
  { dates:'Mar 10–23', topic:'Alternatives', focus:'Private Equity, Real Estate, Infrastructure, Hedge Funds', hours:22, milestone:'Alts Complete' },
  { dates:'Mar 24–Apr 7', topic:'Ethics', focus:'Code of Ethics & Standards (I–VII), GIPS Overview', hours:48, milestone:'First Pass Ethics' },
  { dates:'Apr 8–15', topic:'Buffer Week', focus:'Close reading gaps and resolve outstanding difficult concepts', hours:10, milestone:'100% Syllabus Done' },
];

const revision = [
  { dates:'Apr 16–30', phase:'Pass 2: High Weight', focus:'Heavy question practice on FSA, Equity, and Ethics.', target:'14 hrs/wk', milestone:'>72% in LES' },
  { dates:'May 1–15', phase:'Pass 2: Core Focus', focus:'Targeted sets for Fixed Income, Quant, and Corp Issuers.', target:'14 hrs/wk', milestone:'Formula recall' },
  { dates:'May 16–31', phase:'Pass 2: Applied', focus:'Question sets for Economics, Derivatives, PM, and Alts.', target:'15 hrs/wk', milestone:'Close gaps' },
  { dates:'Jun 1–15', phase:'Mixed Practice', focus:'Full 90-question mixed sets and deep review of weak areas.', target:'15 hrs/wk', milestone:'Exam endurance' },
];

const mockWindows = [
  { range:'Jun 16–30', mocks:'Mocks 1, 2 & 3', target:'18 hrs/wk', milestone:'Identify pitfalls' },
  { range:'Jul 1–15', mocks:'Mocks 4, 5 & 6', target:'18 hrs/wk', milestone:'Refine strategy' },
  { range:'Jul 16–31', mocks:'Mocks 7, 8 & 9', target:'18 hrs/wk', milestone:'Eradicate errors' },
  { range:'Aug 1–10', mocks:'Mocks 10, 11 & 12', target:'18 hrs/wk', milestone:'Peak performance' },
  { range:'Aug 11–15', mocks:'Final Polish & Rest', target:'8 hrs total', milestone:'Exam Readiness' },
];

const defaultMocks = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, score: '', done: false }));
const STORAGE = 'cfa-l1-tracker-v2';

function phaseForDate(date) {
  const d = new Date(date); const y = d.getFullYear(); const m = d.getMonth() + 1; const day = d.getDate();
  if (y < 2027 || (y === 2027 && (m < 4 || (m === 4 && day <= 15)))) return { name:'Phase 1 · First Pass', target:9, detail:'8–10 hrs/wk baseline' };
  if (y === 2027 && (m < 6 || (m === 6 && day <= 15))) return { name:'Phase 2 · Consolidation & Revision', target:15, detail:'14–18 hrs/wk' };
  if (y === 2027 && (m < 8 || (m === 8 && day <= 10))) return { name:'Phase 3 · 12-Mock Gauntlet', target:18, detail:'18 hrs/wk' };
  return { name:'Final Polish & Rest', target:8, detail:'8 hrs total' };
}

function isoToday() { return new Date().toISOString().slice(0, 10); }
function mondayOf(date) { const d = new Date(date); const day = d.getDay(); d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); d.setHours(0,0,0,0); return d; }

export default function Home() {
  const [tab, setTab] = useState('Dashboard');
  const [completed, setCompleted] = useState([]);
  const [mocks, setMocks] = useState(defaultMocks);
  const [logs, setLogs] = useState([]);
  const [logDate, setLogDate] = useState(isoToday());
  const [logHours, setLogHours] = useState('');
  const [logFocus, setLogFocus] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE) || '{}');
      if (Array.isArray(saved.completed)) setCompleted(saved.completed);
      if (Array.isArray(saved.mocks)) setMocks(saved.mocks);
      if (Array.isArray(saved.logs)) setLogs(saved.logs);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE, JSON.stringify({ completed, mocks, logs }));
  }, [completed, mocks, logs, ready]);

  const today = new Date();
  const exam = new Date('2027-08-15T00:00:00');
  const days = Math.max(0, Math.ceil((exam - today) / 86400000));
  const phase = phaseForDate(today);
  const plannedHours = roadmap.reduce((sum, r) => sum + r.hours, 0);
  const syllabusProgress = Math.round(completed.reduce((sum, i) => sum + (roadmap[i]?.hours || 0), 0) / plannedHours * 100);
  const studyHours = logs.reduce((sum, x) => sum + Number(x.hours || 0), 0);
  const weekStart = mondayOf(today);
  const weekHours = logs.filter(x => new Date(`${x.date}T12:00:00`) >= weekStart).reduce((sum, x) => sum + Number(x.hours || 0), 0);
  const mockDone = mocks.filter(m => m.done).length;
  const scored = mocks.map(m => Number(m.score)).filter(Number.isFinite);
  const average = scored.length ? Math.round(scored.reduce((a,b) => a+b, 0) / scored.length) : null;
  const nextIndex = completed.length < roadmap.length ? completed.length : roadmap.length - 1;

  const toggleBlock = (i) => setCompleted(c => c.includes(i) ? c.filter(x => x !== i) : [...c, i]);
  const updateMock = (id, patch) => setMocks(ms => ms.map(m => m.id === id ? { ...m, ...patch } : m));
  const addLog = (e) => {
    e.preventDefault(); const h = Number(logHours);
    if (!logDate || !Number.isFinite(h) || h <= 0) return;
    setLogs(ls => [{ id: Date.now(), date: logDate, hours: h, focus: logFocus.trim() }, ...ls]);
    setLogHours(''); setLogFocus('');
  };
  const deleteLog = id => setLogs(ls => ls.filter(x => x.id !== id));

  return <main className="shell">
    <header className="topbar">
      <div><div className="eyebrow">CFA LEVEL I · AUGUST 2027</div><h1>Study Tracker</h1><p>From first pass to exam-day readiness.</p></div>
      <div className="count"><strong>{days}</strong><span>days to exam</span></div>
    </header>

    <nav className="nav">{['Dashboard','Roadmap','Topics','Study Log','Mocks'].map(x => <button key={x} className={tab === x ? 'active' : ''} onClick={() => setTab(x)}>{x}</button>)}</nav>

    {tab === 'Dashboard' && <>
      <section className="hero"><div><span className="pill">{phase.name}</span><h2>Make the plan measurable.</h2><p>Target ~400 total hours, with active practice from Day 1 and at least one full rest day each week.</p></div><div className="ring"><b>{syllabusProgress}%</b><span>first pass</span></div></section>
      <div className="grid four">
        <Card label="Study hours" value={`${studyHours}h`} sub="logged total · ~400h target" />
        <Card label="This week" value={`${weekHours}h`} sub={`${phase.target}h target · ${phase.detail}`} />
        <Card label="Syllabus" value={`${syllabusProgress}%`} sub={`${completed.length}/${roadmap.length} blocks complete`} />
        <Card label="Mocks" value={`${mockDone}/12`} sub={average !== null ? `Average score ${average}%` : 'No scores yet'} />
      </div>
      <section className="panel focusPanel"><div className="panelHead"><div><span className="sectionLabel">NEXT UP</span><h3>{roadmap[nextIndex].topic}</h3><p>{roadmap[nextIndex].focus}</p></div><button className="primary" onClick={() => setTab('Study Log')}>Log study time</button></div><div className="focusMeta"><span>{roadmap[nextIndex].dates}</span><span>{roadmap[nextIndex].hours}h planned</span><span>{roadmap[nextIndex].milestone}</span></div></section>
      <section className="panel"><div className="panelHead"><div><span className="sectionLabel">ROADMAP ARC</span><h3>Three phases</h3></div></div><div className="phaseGrid"><Phase title="01" name="First Pass" dates="Sep 1, 2026 – Apr 15, 2027" text="Cover all 10 topics steadily with EOMQs, QBank sets and CFA LES." /><Phase title="02" name="Consolidation & Revision" dates="Apr 16 – Jun 15, 2027" text="High-volume targeted practice, formulas and weak-area remediation." /><Phase title="03" name="12-Mock Gauntlet" dates="Jun 16 – Aug 15, 2027" text="Twelve full-length mocks, exhaustive review, pacing and final readiness." /></div></section>
    </>}

    {tab === 'Roadmap' && <section className="panel"><div className="panelHead"><div><span className="sectionLabel">PHASE 1</span><h2>First Pass</h2><p>September 1, 2026 → April 15, 2027</p></div><span className="pill">{syllabusProgress}% complete</span></div><div className="roadmapList">{roadmap.map((r,i) => <div className={`road ${completed.includes(i) ? 'isDone' : ''}`} key={r.topic}><button className="check" onClick={() => toggleBlock(i)}>{completed.includes(i) ? '✓' : ''}</button><div className="roadDate">{r.dates}</div><div className="roadMain"><strong>{r.topic}</strong><span>{r.focus}</span></div><div className="roadHours"><b>{r.hours}h</b><small>{r.milestone}</small></div></div>)}</div><div className="subsection"><div className="panelHead"><div><span className="sectionLabel">PHASE 2</span><h3>Expanded Revision</h3><p>April 16 → June 15, 2027</p></div></div>{revision.map(r => <div className="revision" key={r.dates}><div><strong>{r.dates}</strong><span>{r.phase}</span></div><p>{r.focus}</p><b>{r.target}</b><small>{r.milestone}</small></div>)}</div></section>}

    {tab === 'Topics' && <section className="panel"><div className="panelHead"><div><span className="sectionLabel">10 TOPICS + BUFFER</span><h2>Topic progress</h2><p>Completion is based on the Phase 1 roadmap blocks.</p></div></div><div className="topicGrid">{roadmap.map((r,i) => <div className="topic" key={r.topic}><div className="topicTop"><div><strong>{r.topic}</strong><span>{r.hours}h planned</span></div><span className={completed.includes(i) ? 'status doneText' : 'status'}>{completed.includes(i) ? 'Complete' : 'In progress'}</span></div><div className="bar"><i style={{ width: completed.includes(i) ? '100%' : '0%' }} /></div><button onClick={() => toggleBlock(i)}>{completed.includes(i) ? 'Mark incomplete' : 'Mark complete'}</button></div>)}</div></section>}

    {tab === 'Study Log' && <section className="panel"><div className="panelHead"><div><span className="sectionLabel">DAILY TRACKING</span><h2>Study log</h2><p>Log actual study time and what you worked on. Data is saved in this browser.</p></div><div className="statMini"><b>{weekHours}h</b><span>this week</span></div></div><form className="logForm" onSubmit={addLog}><label>Date<input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} /></label><label>Hours<input type="number" min="0.25" step="0.25" value={logHours} onChange={e => setLogHours(e.target.value)} placeholder="e.g. 2.5" /></label><label className="wide">Focus / notes<input value={logFocus} onChange={e => setLogFocus(e.target.value)} placeholder="Quant TVM, FSA questions, Ethics review…" /></label><button className="primary" type="submit">Add session</button></form><div className="weekBar"><div><span>This week</span><strong>{weekHours} / {phase.target}h</strong></div><div className="bar"><i style={{width:`${Math.min(100, weekHours / phase.target * 100)}%`}} /></div></div><div className="logList">{logs.length === 0 ? <div className="empty">No study sessions logged yet.</div> : logs.slice(0,20).map(x => <div className="logRow" key={x.id}><strong>{new Date(`${x.date}T12:00:00`).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</strong><b>{x.hours}h</b><span>{x.focus || 'Study session'}</span><button onClick={() => deleteLog(x.id)} aria-label="Delete study session">×</button></div>)}</div></section>}

    {tab === 'Mocks' && <><section className="panel"><div className="panelHead"><div><span className="sectionLabel">PHASE 3</span><h2>12-Mock Gauntlet</h2><p>June 16 → August 15, 2027</p></div><span className="pill">{mockDone}/12 complete</span></div><div className="mockGrid">{mocks.map(m => <div className="mock" key={m.id}><div className="mockTop"><div><span>MOCK</span><strong>{m.id}</strong></div><button className={`check ${m.done ? 'done' : ''}`} onClick={() => updateMock(m.id,{done:!m.done})}>{m.done ? '✓' : ''}</button></div><label>Score %<input type="number" min="0" max="100" value={m.score} placeholder="—" onChange={e => updateMock(m.id,{score:e.target.value})} /></label></div>)}</div>{average !== null && <div className="average"><span>Average across scored mocks</span><strong>{average}%</strong></div>}</section><section className="panel"><div className="panelHead"><div><span className="sectionLabel">SCHEDULE</span><h3>Gauntlet windows</h3></div></div>{mockWindows.map(w => <div className="revision" key={w.range}><div><strong>{w.range}</strong><span>{w.mocks}</span></div><p>{w.mocks.includes('Final') ? 'Ethics reread, light review and rest before exam day.' : 'Full-length mock work with exhaustive review and targeted remediation.'}</p><b>{w.target}</b><small>{w.milestone}</small></div>)}</section></>}
  </main>;
}

function Card({label,value,sub}) { return <div className="card"><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>; }
function Phase({title,name,dates,text}) { return <div className="phase"><span>{title}</span><strong>{name}</strong><small>{dates}</small><p>{text}</p></div>; }
