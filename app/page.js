'use client';

import { useEffect, useMemo, useState } from 'react';

const topics = [
  { topic:'Quant Methods', dates:'Sep 1–21', focus:'Rates, TVM, Stats, Regression, Big Data & Machine Learning', hours:32, milestone:'Quant Complete' },
  { topic:'FSA Part 1', dates:'Sep 22–Oct 12', focus:'Standards, Income Statement, Balance Sheet, Cash Flow', hours:26, milestone:'Core FSA Concepts' },
  { topic:'FSA Part 2', dates:'Oct 13–27', focus:'Inventories, Long-Lived Assets, Taxes, Non-Current Liabilities', hours:26, milestone:'FSA Complete' },
  { topic:'Fixed Income 1', dates:'Oct 28–Nov 10', focus:'Bond Features, Markets, Yield Measures', hours:23, milestone:'Pricing foundation' },
  { topic:'Fixed Income 2', dates:'Nov 11–24', focus:'Duration, Convexity, Credit Risk & Spread Analysis', hours:23, milestone:'FI Complete' },
  { topic:'Corporate Issuers', dates:'Nov 25–Dec 15', focus:'Governance, Capital Budgeting, WACC, Leverage', hours:26, milestone:'CI Complete' },
  { topic:'Equity', dates:'Dec 16–Jan 12', focus:'Market Org, Indices, Efficiency, Valuation Models', hours:44, milestone:'Equity Complete' },
  { topic:'Economics', dates:'Jan 13–Feb 2', focus:'Micro/Macro, Business Cycles, Monetary/Fiscal, FX', hours:32, milestone:'Econ Complete' },
  { topic:'Portfolio Management', dates:'Feb 3–23', focus:'Risk & Return, CAPM, Capital Allocation Line', hours:32, milestone:'PM Complete' },
  { topic:'Derivatives', dates:'Feb 24–Mar 9', focus:'Forwards, Futures, Options, Swaps Basics', hours:26, milestone:'Deriv Complete' },
  { topic:'Alternatives', dates:'Mar 10–23', focus:'Private Equity, Real Estate, Infrastructure, Hedge Funds', hours:22, milestone:'Alts Complete' },
  { topic:'Ethics', dates:'Mar 24–Apr 7', focus:'Code of Ethics & Standards (I–VII), GIPS Overview', hours:48, milestone:'First Pass Ethics' },
  { topic:'Buffer Week', dates:'Apr 8–15', focus:'Close all reading gaps and resolve outstanding difficult concepts', hours:10, milestone:'100% Syllabus Done' },
];

const revision = [
  { dates:'Apr 16–30', phase:'Pass 2: High Weight', focus:'Heavy question practice on FSA, Equity, and Ethics.', target:'14 hrs/wk', milestone:'>72% in LES' },
  { dates:'May 1–15', phase:'Pass 2: Core Focus', focus:'Targeted sets for Fixed Income, Quant, and Corp Issuers.', target:'14 hrs/wk', milestone:'Formula recall' },
  { dates:'May 16–31', phase:'Pass 2: Applied', focus:'Question sets for Economics, Derivatives, PM, and Alts.', target:'15 hrs/wk', milestone:'Close gaps' },
  { dates:'Jun 1–15', phase:'Mixed Practice', focus:'Full 90-question mixed sets and deep review of weak areas.', target:'15 hrs/wk', milestone:'Exam endurance' },
];

const mocksSchedule = [
  ['Mock 1','Jun 16, 2027'], ['Mock 2','Jun 21, 2027'], ['Mock 3','Jun 26, 2027'],
  ['Mock 4','Jul 1, 2027'], ['Mock 5','Jul 6, 2027'], ['Mock 6','Jul 11, 2027'],
  ['Mock 7','Jul 16, 2027'], ['Mock 8','Jul 21, 2027'], ['Mock 9','Jul 26, 2027'],
  ['Mock 10','Aug 1, 2027'], ['Mock 11','Aug 5, 2027'], ['Mock 12','Aug 10, 2027'],
].map(([name,date],i)=>({ id:i+1, name, date, score:'', done:false }));

const STORAGE = 'cfa-l1-tracker-v3';
const TOTAL_TARGET = 400;

function isoToday() { return new Date().toISOString().slice(0,10); }
function parseDate(value) { return new Date(`${value}T12:00:00`); }
function mondayOf(date) { const d = new Date(date); const day = d.getDay(); d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); d.setHours(0,0,0,0); return d; }
function dateKey(date) { return date.toISOString().slice(0,10); }
function phaseForDate(date) {
  const d = new Date(date); const y=d.getFullYear(); const m=d.getMonth()+1; const day=d.getDate();
  if (y < 2027 || (y===2027 && (m<4 || (m===4 && day<=15)))) return { name:'Phase 1 · First Pass', target:9, detail:'8–10 hrs/wk' };
  if (y===2027 && (m<6 || (m===6 && day<=15))) return { name:'Phase 2 · Consolidation & Revision', target:15, detail:'14–18 hrs/wk' };
  if (y===2027 && (m<8 || (m===8 && day<=10))) return { name:'Phase 3 · 12-Mock Gauntlet', target:18, detail:'18 hrs/wk' };
  return { name:'Final Polish & Rest', target:8, detail:'8 hrs total' };
}
function formatDate(value) { return parseDate(value).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
function emptyMocks() { return mocksSchedule.map(m=>({...m})); }

export default function Home() {
  const [tab,setTab]=useState('Dashboard');
  const [completed,setCompleted]=useState([]);
  const [mocks,setMocks]=useState(emptyMocks);
  const [logs,setLogs]=useState([]);
  const [restDays,setRestDays]=useState([]);
  const [logDate,setLogDate]=useState(isoToday());
  const [logHours,setLogHours]=useState('');
  const [logTopic,setLogTopic]=useState('Quant Methods');
  const [logFocus,setLogFocus]=useState('');
  const [weekOffset,setWeekOffset]=useState(0);
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    try {
      const saved=JSON.parse(localStorage.getItem(STORAGE)||'{}');
      if(Array.isArray(saved.completed)) setCompleted(saved.completed);
      if(Array.isArray(saved.mocks)) setMocks(saved.mocks.length===12?saved.mocks:emptyMocks());
      if(Array.isArray(saved.logs)) setLogs(saved.logs);
      if(Array.isArray(saved.restDays)) setRestDays(saved.restDays);
    } catch {}
    setReady(true);
  },[]);

  useEffect(()=>{
    if(ready) localStorage.setItem(STORAGE,JSON.stringify({completed,mocks,logs,restDays}));
  },[completed,mocks,logs,restDays,ready]);

  const today=new Date();
  const exam=new Date('2027-08-15T00:00:00');
  const days=Math.max(0,Math.ceil((exam-today)/86400000));
  const phase=phaseForDate(today);
  const plannedFirstPass=topics.reduce((s,t)=>s+t.hours,0);
  const syllabusProgress=Math.round(completed.reduce((s,i)=>s+(topics[i]?.hours||0),0)/plannedFirstPass*100);
  const studyHours=logs.reduce((s,x)=>s+Number(x.hours||0),0);
  const hourProgress=Math.min(100,Math.round(studyHours/TOTAL_TARGET*100));
  const weekStart=mondayOf(today);
  const weekEnd=new Date(weekStart); weekEnd.setDate(weekEnd.getDate()+7);
  const weekHours=logs.filter(x=>{const d=parseDate(x.date);return d>=weekStart&&d<weekEnd;}).reduce((s,x)=>s+Number(x.hours||0),0);
  const mockDone=mocks.filter(m=>m.done).length;
  const scored=mocks.map(m=>Number(m.score)).filter(Number.isFinite);
  const average=scored.length?Math.round(scored.reduce((a,b)=>a+b,0)/scored.length):null;
  const nextIndex=completed.length<topics.length?completed.length:topics.length-1;
  const currentWeekStart=new Date(weekStart); currentWeekStart.setDate(currentWeekStart.getDate()+weekOffset*7);
  const currentWeekEnd=new Date(currentWeekStart); currentWeekEnd.setDate(currentWeekEnd.getDate()+6);
  const selectedWeekHours=logs.filter(x=>{const d=parseDate(x.date);const end=new Date(currentWeekStart);end.setDate(end.getDate()+7);return d>=currentWeekStart&&d<end;}).reduce((s,x)=>s+Number(x.hours||0),0);
  const selectedWeekRest=restDays.filter(x=>{const d=parseDate(x);const end=new Date(currentWeekStart);end.setDate(end.getDate()+7);return d>=currentWeekStart&&d<end;}).length;

  const streak=useMemo(()=>{
    const active=new Set(logs.filter(x=>Number(x.hours)>0).map(x=>x.date));
    let cursor=new Date(); cursor.setHours(12,0,0,0);
    if(!active.has(dateKey(cursor))) cursor.setDate(cursor.getDate()-1);
    let count=0;
    while(active.has(dateKey(cursor))){count++;cursor.setDate(cursor.getDate()-1);}
    return count;
  },[logs]);

  const toggleBlock=i=>setCompleted(c=>c.includes(i)?c.filter(x=>x!==i):[...c,i]);
  const updateMock=(id,patch)=>setMocks(ms=>ms.map(m=>m.id===id?{...m,...patch}:m));
  const addLog=e=>{
    e.preventDefault(); const h=Number(logHours);
    if(!logDate||!Number.isFinite(h)||h<=0)return;
    setLogs(ls=>[{id:`${Date.now()}-${Math.random()}`,date:logDate,hours:h,topic:logTopic,focus:logFocus.trim()},...ls]);
    setLogHours('');setLogFocus('');
  };
  const deleteLog=id=>setLogs(ls=>ls.filter(x=>x.id!==id));
  const toggleRest=date=>setRestDays(rs=>rs.includes(date)?rs.filter(x=>x!==date):[...rs,date]);
  const clearAll=()=>{if(window.confirm('Reset all tracker data on this browser?')){setCompleted([]);setMocks(emptyMocks());setLogs([]);setRestDays([]);}};

  return <main className="shell">
    <header className="topbar">
      <div><div className="eyebrow">CFA LEVEL I · AUGUST 2027</div><h1>Study Tracker</h1><p>From first pass to exam-day readiness.</p></div>
      <div className="count"><strong>{days}</strong><span>days to exam</span></div>
    </header>

    <nav className="nav">{['Dashboard','Roadmap','Topics','Study Log','Mocks'].map(x=><button key={x} className={tab===x?'active':''} onClick={()=>setTab(x)}>{x}</button>)}</nav>

    {tab==='Dashboard'&&<>
      <section className="hero"><div><span className="pill">{phase.name}</span><h2>Make the plan measurable.</h2><p>Track actual study time, syllabus completion, rest days and every mock in one place.</p><div className="heroActions"><button className="primary" onClick={()=>setTab('Study Log')}>Log a session</button><button className="ghost" onClick={()=>setTab('Mocks')}>Update mocks</button></div></div><div className="ring"><b>{hourProgress}%</b><span>400h target</span></div></section>
      <div className="grid four">
        <Card label="Study hours" value={`${studyHours}h`} sub={`${hourProgress}% of ~400h target`} />
        <Card label="This week" value={`${weekHours}h`} sub={`${phase.target}h target · ${phase.detail}`} />
        <Card label="Syllabus" value={`${syllabusProgress}%`} sub={`${completed.length}/${topics.length} blocks complete`} />
        <Card label="Mock average" value={average===null?'—':`${average}%`} sub={`${mockDone}/12 complete · ${streak} day streak`} />
      </div>
      <section className="panel"><div className="panelHead"><div><span className="sectionLabel">NEXT UP</span><h3>{topics[nextIndex].topic}</h3><p>{topics[nextIndex].focus}</p></div><button className="primary" onClick={()=>{setLogTopic(topics[nextIndex].topic);setTab('Study Log')}}>Log this topic</button></div><div className="focusMeta"><span>{topics[nextIndex].dates}</span><span>{topics[nextIndex].hours}h planned</span><span>{topics[nextIndex].milestone}</span></div></section>
      <section className="panel"><div className="panelHead"><div><span className="sectionLabel">WEEKLY CONTROL</span><h3>This week's execution</h3><p>One full rest day is part of the roadmap.</p></div><button className="ghost dark" onClick={()=>toggleRest(isoToday())}>{restDays.includes(isoToday())?'Today marked rest':'Mark today as rest'}</button></div><div className="weekStats"><div><strong>{weekHours}h</strong><span>study logged</span></div><div><strong>{phase.target}h</strong><span>weekly target</span></div><div><strong>{selectedWeekRest}</strong><span>rest days this view</span></div><div><strong>{streak}</strong><span>day streak</span></div></div><div className="bar"><i style={{width:`${Math.min(100,weekHours/phase.target*100)}%`}} /></div></section>
      <section className="panel"><div className="panelHead"><div><span className="sectionLabel">MOCK TREND</span><h3>12-mock progress</h3><p>{average===null?'Enter scores as you complete mocks.':'Scored mocks are shown below.'}</p></div><button className="ghost" onClick={()=>setTab('Mocks')}>Open mocks</button></div><div className="scoreTrend">{mocks.map(m=><div className="scoreItem" key={m.id}><span>M{m.id}</span><div className="scoreTrack"><i style={{width:m.score?`${Math.min(100,Number(m.score))}%`:'0%'}} /></div><b>{m.score?`${m.score}%`:'—'}</b></div>)}</div></section>
    </>}

    {tab==='Roadmap'&&<section className="panel"><div className="panelHead"><div><span className="sectionLabel">MASTER PLAN</span><h2>Roadmap</h2><p>September 1, 2026 → August 15, 2027</p></div><span className="pill">{syllabusProgress}% first pass</span></div><div className="phaseBanner"><strong>Phase 1 · First Pass</strong><span>Sep 1, 2026 – Apr 15, 2027 · 8–10 hrs/wk baseline</span></div><div className="roadmapList">{topics.map((r,i)=><div className={`road ${completed.includes(i)?'isDone':''}`} key={r.topic}><button className={`check ${completed.includes(i)?'done':''}`} onClick={()=>toggleBlock(i)}>{completed.includes(i)?'✓':''}</button><div className="roadDate">{r.dates}</div><div className="roadMain"><strong>{r.topic}</strong><span>{r.focus}</span></div><div className="roadHours"><b>{r.hours}h</b><small>{r.milestone}</small></div></div>)}</div><div className="subsection"><div className="panelHead"><div><span className="sectionLabel">PHASE 2</span><h3>Expanded Revision</h3><p>April 16 → June 15, 2027</p></div></div>{revision.map(r=><div className="revision" key={r.dates}><div><strong>{r.dates}</strong><span>{r.phase}</span></div><p>{r.focus}</p><b>{r.target}</b><small>{r.milestone}</small></div>)}</div><div className="subsection"><div className="panelHead"><div><span className="sectionLabel">PHASE 3</span><h3>12-Mock Gauntlet</h3><p>June 16 → August 15, 2027</p></div></div><div className="phaseGrid">{[['Jun 16–30','Mocks 1, 2 & 3','18 hrs/wk','Identify pitfalls'],['Jul 1–15','Mocks 4, 5 & 6','18 hrs/wk','Refine strategy'],['Jul 16–31','Mocks 7, 8 & 9','18 hrs/wk','Eradicate errors'],['Aug 1–10','Mocks 10, 11 & 12','18 hrs/wk','Peak performance'],['Aug 11–15','Final Polish & Rest','8 hrs total','Exam Readiness']].map(x=><div className="phase" key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong><small>{x[2]}</small><p>{x[3]}</p></div>)}</div></div></section>}

    {tab==='Topics'&&<section className="panel"><div className="panelHead"><div><span className="sectionLabel">FIRST PASS</span><h2>Topic progress</h2><p>Mark a block complete when you've covered the planned material and practice.</p></div></div><div className="topicGrid">{topics.map((r,i)=><div className="topic" key={r.topic}><div className="topicTop"><div><strong>{r.topic}</strong><span>{r.hours}h planned · {r.dates}</span></div><span className={completed.includes(i)?'status doneText':'status'}>{completed.includes(i)?'Complete':'Open'}</span></div><div className="bar"><i style={{width:completed.includes(i)?'100%':'0%'}} /></div><button onClick={()=>toggleBlock(i)}>{completed.includes(i)?'Mark incomplete':'Mark complete'}</button></div>)}</div></section>}

    {tab==='Study Log'&&<section className="panel"><div className="panelHead"><div><span className="sectionLabel">DAILY TRACKING</span><h2>Study log</h2><p>Log actual time by date and topic. Entries are saved in this browser.</p></div><div className="statMini"><b>{studyHours}h</b><span>total logged</span></div></div><form className="logForm" onSubmit={addLog}><label>Date<input type="date" value={logDate} onChange={e=>setLogDate(e.target.value)} /></label><label>Hours<input type="number" min="0.25" step="0.25" value={logHours} onChange={e=>setLogHours(e.target.value)} placeholder="2.5" /></label><label>Topic<select value={logTopic} onChange={e=>setLogTopic(e.target.value)}>{topics.slice(0,-1).map(t=><option key={t.topic}>{t.topic}</option>)}<option>Revision / Mixed Practice</option><option>Mock Exam</option><option>Ethics Review</option></select></label><label className="wide">Focus<input value={logFocus} onChange={e=>setLogFocus(e.target.value)} placeholder="TVM, FSA questions, formula drill…" /></label><button className="primary" type="submit">Add session</button></form><div className="weekBar"><div><span>Current week</span><strong>{weekHours} / {phase.target}h</strong></div><div className="bar"><i style={{width:`${Math.min(100,weekHours/phase.target*100)}%`}} /></div></div><div className="logControls"><button className="ghost" onClick={()=>setWeekOffset(w=>w-1)}>← Previous week</button><strong>{currentWeekStart.toLocaleDateString('en-IN',{day:'2-digit',month:'short'})} – {currentWeekEnd.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</strong><button className="ghost" onClick={()=>setWeekOffset(w=>w+1)}>Next week →</button></div><div className="weekGrid">{Array.from({length:7},(_,i)=>{const d=new Date(currentWeekStart);d.setDate(d.getDate()+i);const key=dateKey(d);const h=logs.filter(x=>x.date===key).reduce((s,x)=>s+Number(x.hours||0),0);return <div className={`dayCell ${restDays.includes(key)?'rest':''}`} key={key}><span>{d.toLocaleDateString('en-IN',{weekday:'short'})}</span><strong>{h?`${h}h`:restDays.includes(key)?'Rest':'—'}</strong><button onClick={()=>toggleRest(key)}>{restDays.includes(key)?'Unmark rest':'Rest day'}</button></div>})}</div><div className="logList">{logs.length===0?<div className="empty">No study sessions logged yet. Add your first session above.</div>:logs.slice(0,50).map(x=><div className="logRow" key={x.id}><strong>{formatDate(x.date)}</strong><b>{x.hours}h</b><span><em>{x.topic}</em>{x.focus?` · ${x.focus}`:''}</span><button onClick={()=>deleteLog(x.id)} aria-label="Delete study session">×</button></div>)}</div></section>}

    {tab==='Mocks'&&<><section className="panel"><div className="panelHead"><div><span className="sectionLabel">PHASE 3 · 12 MOCKS</span><h2>Mock tracker</h2><p>Scheduled across June 16 → August 10, with final polish and rest through August 15.</p></div><span className="pill">{mockDone}/12 complete</span></div><div className="mockGrid">{mocks.map(m=><div className={`mock ${m.done?'mockDone':''}`} key={m.id}><div className="mockTop"><div><span>{formatDate(m.date)}</span><strong>Mock {m.id}</strong></div><button className={`check ${m.done?'done':''}`} onClick={()=>updateMock(m.id,{done:!m.done})}>{m.done?'✓':''}</button></div><label>Score %<input type="number" min="0" max="100" value={m.score} placeholder="—" onChange={e=>updateMock(m.id,{score:e.target.value})} /></label><div className="mockStatus">{m.done?'Completed':m.score?'Score entered':'Not started'}</div></div>)}</div>{average!==null&&<div className="average"><span>Average across {scored.length} scored mock{scored.length===1?'':'s'}</span><strong>{average}%</strong></div>}</section><section className="panel"><div className="panelHead"><div><span className="sectionLabel">EXECUTION</span><h3>Mock windows</h3><p>Use the schedule to plan review between exams.</p></div></div>{[['Jun 16–30','Mocks 1, 2 & 3','18 hrs/wk','Identify pitfalls'],['Jul 1–15','Mocks 4, 5 & 6','18 hrs/wk','Refine strategy'],['Jul 16–31','Mocks 7, 8 & 9','18 hrs/wk','Eradicate errors'],['Aug 1–10','Mocks 10, 11 & 12','18 hrs/wk','Peak performance'],['Aug 11–15','Final Polish & Rest','8 hrs total','Exam Readiness']].map(x=><div className="revision" key={x[0]}><div><strong>{x[0]}</strong><span>{x[1]}</span></div><p>{x[1].includes('Final')?'Ethics reread, light review and rest before exam day.':'Full-length mock work with review, pacing and targeted remediation.'}</p><b>{x[2]}</b><small>{x[3]}</small></div>)}</section></>}

    <footer><button className="reset" onClick={clearAll}>Reset tracker data</button><span>Stored locally in this browser · No account or server required</span></footer>
  </main>;
}

function Card({label,value,sub}){return <div className="card"><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>;}
