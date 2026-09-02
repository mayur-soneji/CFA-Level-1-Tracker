'use client';

import { useEffect, useMemo, useState } from 'react';

const roadmap = [
  { id:'quant', dates:'Sep 1–21', topic:'Quant Methods', focus:'Rates, TVM, Stats, Regression, Big Data & Machine Learning', hours:32, milestone:'Quant Complete' },
  { id:'fsa1', dates:'Sep 22–Oct 12', topic:'FSA Part 1', focus:'Standards, Income Statement, Balance Sheet, Cash Flow', hours:26, milestone:'Core FSA Concepts' },
  { id:'fsa2', dates:'Oct 13–27', topic:'FSA Part 2', focus:'Inventories, Long-Lived Assets, Taxes, Non-Current Liabilities', hours:26, milestone:'FSA Complete' },
  { id:'fi1', dates:'Oct 28–Nov 10', topic:'Fixed Income 1', focus:'Bond Features, Markets, Yield Measures', hours:23, milestone:'Pricing foundation' },
  { id:'fi2', dates:'Nov 11–24', topic:'Fixed Income 2', focus:'Duration, Convexity, Credit Risk & Spread Analysis', hours:23, milestone:'FI Complete' },
  { id:'ci', dates:'Nov 25–Dec 15', topic:'Corporate Issuers', focus:'Governance, Capital Budgeting, WACC, Leverage', hours:26, milestone:'CI Complete' },
  { id:'equity', dates:'Dec 16–Jan 12', topic:'Equity', focus:'Market Org, Indices, Efficiency, Valuation Models', hours:44, milestone:'Equity Complete' },
  { id:'econ', dates:'Jan 13–Feb 2', topic:'Economics', focus:'Micro/Macro, Business Cycles, Monetary/Fiscal, FX', hours:32, milestone:'Econ Complete' },
  { id:'pm', dates:'Feb 3–23', topic:'Portfolio Management', focus:'Risk & Return, CAPM, Capital Allocation Line', hours:32, milestone:'PM Complete' },
  { id:'deriv', dates:'Feb 24–Mar 9', topic:'Derivatives', focus:'Forwards, Futures, Options, Swaps Basics', hours:26, milestone:'Deriv Complete' },
  { id:'alts', dates:'Mar 10–23', topic:'Alternatives', focus:'Private Equity, Real Estate, Infrastructure, Hedge Funds', hours:22, milestone:'Alts Complete' },
  { id:'ethics', dates:'Mar 24–Apr 7', topic:'Ethics', focus:'Code of Ethics & Standards (I–VII), GIPS Overview', hours:48, milestone:'First Pass Ethics' },
  { id:'buffer', dates:'Apr 8–15', topic:'Buffer Week', focus:'Close reading gaps and resolve outstanding difficult concepts', hours:10, milestone:'100% Syllabus Done' },
];

const revision = [
  { dates:'Apr 16–30', phase:'Pass 2: High Weight', focus:'Heavy question practice on FSA, Equity, and Ethics.', target:'14 hrs/wk', milestone:'>72% in LES' },
  { dates:'May 1–15', phase:'Pass 2: Core Focus', focus:'Targeted sets for Fixed Income, Quant, and Corp Issuers.', target:'14 hrs/wk', milestone:'Formula recall' },
  { dates:'May 16–31', phase:'Pass 2: Applied', focus:'Question sets for Economics, Derivatives, PM, and Alts.', target:'15 hrs/wk', milestone:'Close gaps' },
  { dates:'Jun 1–15', phase:'Mixed Practice', focus:'Full 90-question mixed sets and deep review of weak areas.', target:'15 hrs/wk', milestone:'Exam endurance' },
];

const mockDates = ['2027-06-16','2027-06-21','2027-06-26','2027-07-01','2027-07-06','2027-07-11','2027-07-16','2027-07-21','2027-07-26','2027-08-01','2027-08-05','2027-08-10'];
const defaultMocks = mockDates.map((date,i) => ({ id:i+1, date, score:'', done:false }));
const STORAGE = 'cfa-l1-tracker-v3';

function isoToday() { return new Date().toISOString().slice(0,10); }
function mondayOf(date) { const d = new Date(date); const day=d.getDay(); d.setDate(d.getDate()-(day===0?6:day-1)); d.setHours(0,0,0,0); return d; }
function dateLabel(date) { return new Date(`${date}T12:00:00`).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}); }
function phaseForDate(date) {
  const d=new Date(date); const y=d.getFullYear(), m=d.getMonth()+1, day=d.getDate();
  if (y<2027 || (y===2027 && (m<4 || (m===4 && day<=15)))) return {name:'Phase 1 · First Pass',target:9,detail:'8–10 hrs/wk'};
  if (y===2027 && (m<6 || (m===6 && day<=15))) return {name:'Phase 2 · Consolidation & Revision',target:15,detail:'14–18 hrs/wk'};
  if (y===2027 && (m<8 || (m===8 && day<=10))) return {name:'Phase 3 · 12-Mock Gauntlet',target:18,detail:'18 hrs/wk'};
  return {name:'Final Polish & Rest',target:8,detail:'8 hrs total'};
}

export default function Home() {
  const [tab,setTab]=useState('Dashboard');
  const [completed,setCompleted]=useState([]);
  const [mocks,setMocks]=useState(defaultMocks);
  const [logs,setLogs]=useState([]);
  const [restDays,setRestDays]=useState([]);
  const [logDate,setLogDate]=useState(isoToday());
  const [logHours,setLogHours]=useState('');
  const [logTopic,setLogTopic]=useState('quant');
  const [logFocus,setLogFocus]=useState('');
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    try {
      const saved=JSON.parse(localStorage.getItem(STORAGE)||'{}');
      if(Array.isArray(saved.completed)) setCompleted(saved.completed);
      if(Array.isArray(saved.mocks)) setMocks(saved.mocks.map((m,i)=>({...defaultMocks[i],...m})));
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
  const plannedHours=roadmap.reduce((s,r)=>s+r.hours,0);
  const studyHours=logs.reduce((s,x)=>s+Number(x.hours||0),0);
  const weekStart=mondayOf(today);
  const weekKey=weekStart.toISOString().slice(0,10);
  const weekLogs=logs.filter(x=>new Date(`${x.date}T12:00:00`)>=weekStart);
  const weekHours=weekLogs.reduce((s,x)=>s+Number(x.hours||0),0);
  const mockDone=mocks.filter(m=>m.done).length;
  const scored=mocks.map(m=>Number(m.score)).filter(Number.isFinite);
  const average=scored.length?Math.round(scored.reduce((a,b)=>a+b,0)/scored.length):null;

  const topicStats=useMemo(()=>roadmap.map(r=>{
    const logged=logs.filter(x=>x.topic===r.id).reduce((s,x)=>s+Number(x.hours||0),0);
    const progress=completed.includes(r.id)?100:Math.min(100,Math.round(logged/r.hours*100));
    const sessions=logs.filter(x=>x.topic===r.id).length;
    return {...r,logged,progress,sessions};
  }),[logs,completed]);
  const syllabusProgress=Math.round(topicStats.reduce((s,r)=>s+r.progress*r.hours,0)/plannedHours);
  const nextTopic=topicStats.find(r=>r.progress<100)||topicStats[topicStats.length-1];

  const weeklyDays=Array.from({length:7},(_,i)=>{const d=new Date(weekStart);d.setDate(d.getDate()+i);const key=d.toISOString().slice(0,10);const hours=logs.filter(x=>x.date===key).reduce((s,x)=>s+Number(x.hours||0),0);return {key,d,hours,rest:restDays.includes(key)};});
  const streak=(()=>{let count=0;const d=new Date();d.setHours(12,0,0,0);for(let i=0;i<365;i++){const key=d.toISOString().slice(0,10);const has=logs.some(x=>x.date===key&&Number(x.hours)>0);if(has){count++;d.setDate(d.getDate()-1);}else if(restDays.includes(key)){d.setDate(d.getDate()-1);}else break;}return count;})();

  const toggleTopic=id=>setCompleted(c=>c.includes(id)?c.filter(x=>x!==id):[...c,id]);
  const updateMock=(id,patch)=>setMocks(ms=>ms.map(m=>m.id===id?{...m,...patch}:m));
  const addLog=e=>{e.preventDefault();const h=Number(logHours);if(!logDate||!Number.isFinite(h)||h<=0||!logTopic)return;setLogs(ls=>[{id:Date.now(),date:logDate,hours:h,topic:logTopic,focus:logFocus.trim()},...ls]);setLogHours('');setLogFocus('');};
  const deleteLog=id=>setLogs(ls=>ls.filter(x=>x.id!==id));
  const toggleRest=key=>setRestDays(r=>r.includes(key)?r.filter(x=>x!==key):[...r,key]);

  return <main className="shell">
    <header className="topbar"><div><div className="eyebrow">CFA LEVEL I · AUGUST 2027</div><h1>Study Tracker</h1><p>One connected system for plan, execution, topics and mocks.</p></div><div className="count"><strong>{days}</strong><span>days to exam</span></div></header>
    <nav className="nav">{['Dashboard','Roadmap','Topics','Study Log','Mocks'].map(x=><button key={x} className={tab===x?'active':''} onClick={()=>setTab(x)}>{x}</button>)}</nav>

    {tab==='Dashboard'&&<>
      <section className="hero"><div><span className="pill">{phase.name}</span><h2>Make the plan measurable.</h2><p>Every study session feeds your topic progress, weekly execution and overall readiness.</p></div><div className="ring"><b>{syllabusProgress}%</b><span>progress</span></div></section>
      <div className="grid four"><Card label="Study hours" value={`${studyHours}h`} sub="logged · ~400h target"/><Card label="This week" value={`${weekHours}h`} sub={`${phase.target}h target · ${phase.detail}`}/><Card label="Syllabus" value={`${syllabusProgress}%`} sub={`${topicStats.filter(r=>r.progress===100).length}/${roadmap.length} blocks complete`}/><Card label="Mocks" value={`${mockDone}/12`} sub={average!==null?`Average ${average}%`:'No scores yet'}/></div>
      <section className="panel"><div className="panelHead"><div><span className="sectionLabel">THIS WEEK</span><h3>Execution</h3><p>Log sessions in Study Log. Each session is attributed to a topic automatically.</p></div><div className="statMini"><b>{streak}</b><span>day streak</span></div></div><div className="weekGrid">{weeklyDays.map(x=><div className={`dayCell ${x.rest?'rest':''}`} key={x.key}><span>{x.d.toLocaleDateString('en-IN',{weekday:'short'})}</span><strong>{x.hours?`${x.hours}h`:'—'}</strong><small>{x.rest?'Rest':x.hours?'Studied':'Open'}</small></div>)}</div><div className="weekBar"><div><span>{weekHours}h logged</span><strong>{Math.round(Math.min(100,weekHours/phase.target*100))}% of weekly target</strong></div><div className="bar"><i style={{width:`${Math.min(100,weekHours/phase.target*100)}%`}}/></div></div></section>
      <section className="panel"><div className="panelHead"><div><span className="sectionLabel">NEXT UP</span><h3>{nextTopic.topic}</h3><p>{nextTopic.focus}</p></div><button className="primary" onClick={()=>{setLogTopic(nextTopic.id);setTab('Study Log')}}>Log this topic</button></div><div className="focusMeta"><span>{nextTopic.dates}</span><span>{nextTopic.logged}h / {nextTopic.hours}h logged</span><span>{nextTopic.progress}% complete</span><span>{nextTopic.milestone}</span></div></section>
      <section className="panel"><div className="panelHead"><div><span className="sectionLabel">MOCK READINESS</span><h3>{mockDone}/12 mocks completed</h3><p>{average!==null?`Current average: ${average}%. Enter every score to see the trend.`:'Start entering scores during the Phase 3 gauntlet.'}</p></div><button className="primary" onClick={()=>setTab('Mocks')}>Open mocks</button></div>{scored.length>0&&<div className="scoreTrend">{mocks.map(m=><div className="scoreBar" key={m.id} title={m.score?`Mock ${m.id}: ${m.score}%`:`Mock ${m.id}: not scored`}><i style={{height:`${Math.max(4,Number(m.score)||0)}%`}}/><span>M{m.id}</span></div>)}</div>}</section>
    </>}

    {tab==='Roadmap'&&<section className="panel"><div className="panelHead"><div><span className="sectionLabel">PHASE 1</span><h2>First Pass</h2><p>September 1, 2026 → April 15, 2027</p></div><span className="pill">{syllabusProgress}% connected progress</span></div>{roadmap.map(r=><div className={`road ${topicStats.find(x=>x.id===r.id).progress===100?'isDone':''}`} key={r.id}><button className={`check ${completed.includes(r.id)?'done':''}`} onClick={()=>toggleTopic(r.id)}>{completed.includes(r.id)?'✓':''}</button><div className="roadDate">{r.dates}</div><div className="roadMain"><strong>{r.topic}</strong><span>{r.focus}</span><div className="inlineProgress"><i style={{width:`${topicStats.find(x=>x.id===r.id).progress}%`}}/></div></div><div className="roadHours"><b>{topicStats.find(x=>x.id===r.id).logged}h / {r.hours}h</b><small>{topicStats.find(x=>x.id===r.id).progress}% · {r.milestone}</small></div></div>)}<div className="subsection"><div className="panelHead"><div><span className="sectionLabel">PHASE 2</span><h3>Expanded Revision</h3><p>April 16 → June 15, 2027</p></div></div>{revision.map(r=><div className="revision" key={r.dates}><div><strong>{r.dates}</strong><span>{r.phase}</span></div><p>{r.focus}</p><b>{r.target}</b><small>{r.milestone}</small></div>)}</div></section>}

    {tab==='Topics'&&<section className="panel"><div className="panelHead"><div><span className="sectionLabel">CONNECTED TO STUDY LOG</span><h2>Topic progress</h2><p>Logged hours now flow directly into each topic. Manual completion remains available for finished blocks.</p></div></div><div className="topicGrid">{topicStats.map(r=><div className="topic" key={r.id}><div className="topicTop"><div><strong>{r.topic}</strong><span>{r.logged}h logged / {r.hours}h planned · {r.sessions} session{r.sessions===1?'':'s'}</span></div><span className={r.progress===100?'status doneText':'status'}>{r.progress===100?'Complete':`${r.progress}%`}</span></div><div className="bar"><i style={{width:`${r.progress}%`}}/></div><div className="topicActions"><button onClick={()=>{setLogTopic(r.id);setTab('Study Log')}}>Log session</button><button onClick={()=>toggleTopic(r.id)}>{completed.includes(r.id)?'Undo completion':'Mark complete'}</button></div></div>)}</div></section>}

    {tab==='Study Log'&&<section className="panel"><div className="panelHead"><div><span className="sectionLabel">DAILY EXECUTION</span><h2>Study log</h2><p>Choose the topic you studied. The hours immediately update Topic Progress and Dashboard metrics.</p></div><div className="statMini"><b>{weekHours}h</b><span>this week</span></div></div><form className="logForm" onSubmit={addLog}><label>Date<input type="date" value={logDate} onChange={e=>setLogDate(e.target.value)}/></label><label>Hours<input type="number" min="0.25" step="0.25" value={logHours} onChange={e=>setLogHours(e.target.value)} placeholder="2.5"/></label><label>Topic<select value={logTopic} onChange={e=>setLogTopic(e.target.value)}>{roadmap.map(r=><option key={r.id} value={r.id}>{r.topic}</option>)}</select></label><label className="wide">Focus / notes<input value={logFocus} onChange={e=>setLogFocus(e.target.value)} placeholder="TVM practice, FSA questions, Ethics review…"/></label><button className="primary" type="submit">Add session</button></form><div className="weekBar"><div><span>This week</span><strong>{weekHours} / {phase.target}h</strong></div><div className="bar"><i style={{width:`${Math.min(100,weekHours/phase.target*100)}%`}}/></div></div><div className="dayPlanner">{weeklyDays.map(x=><div className={`dayPlan ${x.rest?'rest':''}`} key={x.key}><div><strong>{x.d.toLocaleDateString('en-IN',{weekday:'short'})}</strong><span>{dateLabel(x.key)}</span></div><b>{x.hours?`${x.hours}h`:'Rest'}</b><button type="button" onClick={()=>toggleRest(x.key)}>{x.rest?'Unmark rest':'Mark rest'}</button></div>)}</div><div className="logList">{logs.length===0?<div className="empty">No study sessions logged yet.</div>:logs.slice(0,30).map(x=><div className="logRow" key={x.id}><strong>{dateLabel(x.date)}</strong><b>{x.hours}h</b><span><em>{roadmap.find(r=>r.id===x.topic)?.topic||'Unassigned'}</em>{x.focus?` · ${x.focus}`:''}</span><button onClick={()=>deleteLog(x.id)} aria-label="Delete study session">×</button></div>)}</div></section>}

    {tab==='Mocks'&&<><section className="panel"><div className="panelHead"><div><span className="sectionLabel">PHASE 3</span><h2>12-Mock Gauntlet</h2><p>June 16 → August 10, 2027 · score, complete and watch your average improve.</p></div><span className="pill">{mockDone}/12 complete</span></div><div className="mockGrid">{mocks.map(m=><div className="mock" key={m.id}><div className="mockTop"><div><span>{dateLabel(m.date)}</span><strong>Mock {m.id}</strong></div><button className={`check ${m.done?'done':''}`} onClick={()=>updateMock(m.id,{done:!m.done})}>{m.done?'✓':''}</button></div><label>Score %<input type="number" min="0" max="100" value={m.score} placeholder="—" onChange={e=>updateMock(m.id,{score:e.target.value})}/></label>{m.score!==''&&<small className="scoreState">{Number(m.score)>=70?'Target met':'Below 70% target'}</small>}</div>)}</div>{average!==null&&<div className="average"><span>Average across {scored.length} scored mock{scored.length===1?'':'s'}</span><strong>{average}%</strong></div>}</section><section className="panel"><div className="panelHead"><div><span className="sectionLabel">SCHEDULE</span><h3>Gauntlet windows</h3></div></div>{[{range:'Jun 16–30',mocks:'Mocks 1, 2 & 3',target:'18 hrs/wk',milestone:'Identify pitfalls'},{range:'Jul 1–15',mocks:'Mocks 4, 5 & 6',target:'18 hrs/wk',milestone:'Refine strategy'},{range:'Jul 16–31',mocks:'Mocks 7, 8 & 9',target:'18 hrs/wk',milestone:'Eradicate errors'},{range:'Aug 1–10',mocks:'Mocks 10, 11 & 12',target:'18 hrs/wk',milestone:'Peak performance'},{range:'Aug 11–15',mocks:'Final Polish & Rest',target:'8 hrs total',milestone:'Exam Readiness'}].map(w=><div className="revision" key={w.range}><div><strong>{w.range}</strong><span>{w.mocks}</span></div><p>{w.mocks.includes('Final')?'Ethics reread, light review and rest before exam day.':'Full-length mock work with exhaustive review and targeted remediation.'}</p><b>{w.target}</b><small>{w.milestone}</small></div>)}</section></>}
  </main>;
}

function Card({label,value,sub}){return <div className="card"><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>;}
