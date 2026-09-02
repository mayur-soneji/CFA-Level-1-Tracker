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
const defaultMocks = mockDates.map((date,i)=>({id:i+1,date,score:'',done:false,completedAt:''}));
const STORAGE='cfa-l1-tracker-v4';

function isoToday(){return new Date().toISOString().slice(0,10)}
function parseDate(v){return new Date(`${v}T12:00:00`)}
function shortDate(v){return parseDate(v).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
function dateLabel(v){return parseDate(v).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
function mondayOf(date){const d=new Date(date);const day=d.getDay();d.setDate(d.getDate()-(day===0?6:day-1));d.setHours(0,0,0,0);return d}
function phaseForDate(date){const d=new Date(date);const y=d.getFullYear(),m=d.getMonth()+1,day=d.getDate();if(y<2027||(y===2027&&(m<4||(m===4&&day<=15))))return{name:'Phase 1 · First Pass',target:9,detail:'8–10 hrs/wk'};if(y===2027&&(m<6||(m===6&&day<=15)))return{name:'Phase 2 · Consolidation & Revision',target:15,detail:'14–18 hrs/wk'};if(y===2027&&(m<8||(m===8&&day<=10)))return{name:'Phase 3 · 12-Mock Gauntlet',target:18,detail:'18 hrs/wk'};return{name:'Final Polish & Rest',target:8,detail:'8 hrs total'}}

export default function Home(){
 const [tab,setTab]=useState('Dashboard');
 const [completed,setCompleted]=useState([]);
 const [mocks,setMocks]=useState(defaultMocks);
 const [logs,setLogs]=useState([]);
 const [restDays,setRestDays]=useState([]);
 const [logDate,setLogDate]=useState(isoToday());
 const [logHours,setLogHours]=useState('');
 const [logTopic,setLogTopic]=useState('quant');
 const [logFocus,setLogFocus]=useState('');
 const [mockDialog,setMockDialog]=useState(null);
 const [mockScore,setMockScore]=useState('');
 const [weekOffset,setWeekOffset]=useState(0);
 const [ready,setReady]=useState(false);

 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(STORAGE)||'{}');if(Array.isArray(saved.completed))setCompleted(saved.completed);if(Array.isArray(saved.mocks))setMocks(saved.mocks.map((m,i)=>{const base={...(defaultMocks[i]||defaultMocks[0]),...m};if(base.done&&!base.completedAt)base.completedAt=isoToday();return base}));if(Array.isArray(saved.logs))setLogs(saved.logs);if(Array.isArray(saved.restDays))setRestDays(saved.restDays)}catch{}setReady(true)},[]);
 useEffect(()=>{if(ready)localStorage.setItem(STORAGE,JSON.stringify({completed,mocks,logs,restDays}))},[completed,mocks,logs,restDays,ready]);

 const today=new Date();
 const exam=new Date('2027-08-15T00:00:00');
 const days=Math.max(0,Math.ceil((exam-today)/86400000));
 const phase=phaseForDate(today);
 const plannedHours=roadmap.reduce((s,r)=>s+r.hours,0);
 const studyHours=logs.reduce((s,x)=>s+Number(x.hours||0),0);
 const weekStart=mondayOf(today);weekStart.setDate(weekStart.getDate()+weekOffset*7);
 const weekEnd=new Date(weekStart);weekEnd.setDate(weekEnd.getDate()+7);
 const weekLogs=logs.filter(x=>{const d=parseDate(x.date);return d>=weekStart&&d<weekEnd});
 const weekHours=weekLogs.reduce((s,x)=>s+Number(x.hours||0),0);
 const mockDone=mocks.filter(m=>m.done).length;
 const scored=mocks.map(m=>Number(m.score)).filter(Number.isFinite);
 const average=scored.length?Math.round(scored.reduce((a,b)=>a+b,0)/scored.length):null;
 const topicStats=useMemo(()=>roadmap.map(r=>{const ls=logs.filter(x=>x.topic===r.id);const logged=ls.reduce((s,x)=>s+Number(x.hours||0),0);const progress=completed.includes(r.id)?100:Math.min(100,Math.round(logged/r.hours*100));return{...r,logged,progress,sessions:ls.length}}),[logs,completed]);
 const syllabusProgress=Math.round(topicStats.reduce((s,r)=>s+r.progress*r.hours,0)/plannedHours);
 const nextTopic=topicStats.find(r=>r.progress<100)||topicStats.at(-1);
 const weeklyDays=Array.from({length:7},(_,i)=>{const d=new Date(weekStart);d.setDate(d.getDate()+i);const key=d.toISOString().slice(0,10);const hours=logs.filter(x=>x.date===key).reduce((s,x)=>s+Number(x.hours||0),0);return{key,d,hours,rest:restDays.includes(key)}});
 const streak=(()=>{let n=0;const d=new Date();d.setHours(12,0,0,0);for(let i=0;i<365;i++){const key=d.toISOString().slice(0,10);const active=logs.some(x=>x.date===key&&Number(x.hours)>0);if(active||restDays.includes(key)){if(active)n++;d.setDate(d.getDate()-1)}else break}return n})();
 const chartPoints=useMemo(()=>mocks.filter(m=>m.done&&Number.isFinite(Number(m.score))&&m.completedAt).sort((a,b)=>parseDate(a.completedAt)-parseDate(b.completedAt)||a.id-b.id),[mocks]);
 const chart={w:900,h:290,padL:58,padR:24,padT:20,padB:58};
 const toX=i=>chart.padL+(chartPoints.length<=1?(chart.w-chart.padL-chart.padR)/2:i*(chart.w-chart.padL-chart.padR)/(chartPoints.length-1));
 const toY=score=>chart.padT+(100-score)*(chart.h-chart.padT-chart.padB)/100;
 const path=chartPoints.map((m,i)=>`${i?'L':'M'} ${toX(i)} ${toY(Number(m.score))}`).join(' ');

 const toggleTopic=id=>setCompleted(c=>c.includes(id)?c.filter(x=>x!==id):[...c,id]);
 const updateMock=(id,patch)=>setMocks(ms=>ms.map(m=>m.id===id?{...m,...patch}:m));
 const beginMockCompletion=id=>{const m=mocks.find(x=>x.id===id);if(!m)return;if(m.done){updateMock(id,{done:false,completedAt:''});return}setMockScore(m.score||'');setMockDialog(id)};
 const confirmMockCompletion=()=>{const score=Number(mockScore);if(!mockDialog||!Number.isFinite(score)||score<0||score>100)return;updateMock(mockDialog,{done:true,score:String(score),completedAt:isoToday()});setMockDialog(null);setMockScore('')};
 const addLog=e=>{e.preventDefault();const h=Number(logHours);if(!logDate||!Number.isFinite(h)||h<=0||!logTopic)return;setLogs(ls=>[{id:Date.now(),date:logDate,hours:h,topic:logTopic,focus:logFocus.trim()},...ls]);setLogHours('');setLogFocus('')};
 const deleteLog=id=>setLogs(ls=>ls.filter(x=>x.id!==id));
 const toggleRest=key=>setRestDays(r=>r.includes(key)?r.filter(x=>x!==key):[...r,key]);
 const resetStudy=()=>{if(window.confirm('Reset all study data? This clears study sessions, topic progress, manual topic completion and rest-day marks. Mock data is not changed.')){setLogs([]);setCompleted([]);setRestDays([])}};
 const resetMocks=()=>{if(window.confirm('Reset all mock data? This clears all mock scores, completion states and completion dates. Study data is not changed.'))setMocks(defaultMocks.map(m=>({...m})))};

 return <main className="shell">
  <header className="topbar"><div><div className="eyebrow">CFA LEVEL I · AUGUST 2027</div><h1>Study Tracker</h1><p>One connected system for plan, execution, topics and mocks.</p></div><div className="count"><strong>{days}</strong><span>days to exam</span></div></header>
  <nav className="nav">{['Dashboard','Roadmap','Topics','Study Log','Mocks'].map(x=><button key={x} className={tab===x?'active':''} onClick={()=>setTab(x)}>{x}</button>)}</nav>

  {tab==='Dashboard'&&<>
   <section className="hero"><div><span className="pill">{phase.name}</span><h2>Make the plan measurable.</h2><p>Every study session feeds your topic progress, weekly execution and overall readiness.</p><div className="heroActions"><button className="primary" onClick={()=>setTab('Study Log')}>Log study session</button><button className="ghost" onClick={()=>setTab('Mocks')}>Open mock tracker</button></div></div><div className="dynamicRing" style={{'--progress':`${syllabusProgress*3.6}deg`}}><div><b>{syllabusProgress}%</b><span>first pass</span></div></div></section>
   <div className="grid four"><Card label="Study hours" value={`${studyHours}h`} sub="logged · ~400h target"/><Card label="This week" value={`${weekHours}h`} sub={`${phase.target}h target · ${phase.detail}`}/><Card label="Syllabus" value={`${syllabusProgress}%`} sub={`${topicStats.filter(r=>r.progress===100).length}/${roadmap.length} blocks complete`}/><Card label="Mocks" value={`${mockDone}/12`} sub={average!==null?`Average ${average}%`:'No scores yet'}/></div>
   <div className="dashboardGrid"><section className="panel"><div className="panelHead"><div><span className="sectionLabel">THIS WEEK</span><h3>Execution</h3><p>Review activity across this week.</p></div><div className="weekNav"><button className="glassIcon" onClick={()=>setWeekOffset(x=>x-1)}>‹</button><button className="glassIcon" onClick={()=>setWeekOffset(0)}>Today</button><button className="glassIcon" onClick={()=>setWeekOffset(x=>x+1)}>›</button></div></div><div className="weekGrid">{weeklyDays.map(x=><div className={`dayCell ${x.rest?'rest':''}`} key={x.key}><span>{x.d.toLocaleDateString('en-IN',{weekday:'short'})}</span><strong>{x.hours?`${x.hours}h`:'—'}</strong><small>{x.rest?'Rest':x.hours?'Studied':'Open'}</small></div>)}</div><div className="weekBar"><div><span>{weekHours}h logged</span><strong>{Math.round(Math.min(100,weekHours/phase.target*100))}% of weekly target</strong></div><div className="bar"><i style={{width:`${Math.min(100,weekHours/phase.target*100)}%`}}/></div></div></section><section className="panel"><div className="panelHead"><div><span className="sectionLabel">NEXT UP</span><h3>{nextTopic.topic}</h3><p>{nextTopic.focus}</p></div><div className="statMini"><b>{nextTopic.progress}%</b><span>{nextTopic.logged}h / {nextTopic.hours}h</span></div></div><div className="focusMeta"><span>{nextTopic.dates}</span><span>{nextTopic.milestone}</span></div></section></div>
   <section className="panel"><div className="panelHead"><div><span className="sectionLabel">MOCK READINESS</span><h3>{mockDone}/12 mocks completed</h3><p>{chartPoints.length?`Score trend across ${chartPoints.length} completed mock${chartPoints.length===1?'':'s'}.`:'Complete mocks to build a dated score trend.'}</p></div><button className="primary" onClick={()=>setTab('Mocks')}>Open mocks</button></div>{chartPoints.length>0?<ScoreChart points={chartPoints} chart={chart} toX={toX} toY={toY} path={path}/>:<div className="chartEmpty">No completed mock scores yet. Completing a mock records both its required score and today's completion date.</div>}</section>
  </>}

  {tab==='Roadmap'&&<section className="panel"><div className="panelHead"><div><span className="sectionLabel">PHASE 1</span><h2>First Pass</h2><p>September 1, 2026 → April 15, 2027</p></div><span className="pill">{syllabusProgress}% connected progress</span></div>{roadmap.map(r=>{const s=topicStats.find(x=>x.id===r.id);return <div className={`road ${s.progress===100?'isDone':''}`} key={r.id}><button className={`check ${completed.includes(r.id)?'done':''}`} onClick={()=>toggleTopic(r.id)}>{completed.includes(r.id)?'✓':''}</button><div className="roadDate">{r.dates}</div><div className="roadMain"><strong>{r.topic}</strong><span>{r.focus}</span><div className="inlineProgress"><i style={{width:`${s.progress}%`}}/></div></div><div className="roadHours"><b>{s.logged}h / {r.hours}h</b><small>{s.progress}% · {r.milestone}</small></div></div>})}<div className="subsection"><div className="panelHead"><div><span className="sectionLabel">PHASE 2</span><h3>Expanded Revision</h3><p>April 16 → June 15, 2027</p></div></div>{revision.map(r=><div className="revision" key={r.dates}><div><strong>{r.dates}</strong><span>{r.phase}</span></div><p>{r.focus}</p><b>{r.target}</b><small>{r.milestone}</small></div>)}</div></section>}

  {tab==='Topics'&&<section className="panel"><div className="panelHead"><div><span className="sectionLabel">CONNECTED TO STUDY LOG</span><h2>Topic progress</h2><p>Actual logged hours drive each topic's progress. Manual completion remains available.</p></div><button className="dangerGhost" onClick={resetStudy}>Reset study data</button></div><div className="topicGrid">{topicStats.map(r=><div className="topic" key={r.id}><div className="topicTop"><div><strong>{r.topic}</strong><span>{r.logged}h / {r.hours}h planned · {r.sessions} session{r.sessions===1?'':'s'}</span></div><span className={r.progress===100?'status doneText':'status'}>{r.progress===100?'Complete':`${r.progress}%`}</span></div><div className="bar"><i style={{width:`${r.progress}%`}}/></div><div className="topicActions"><button onClick={()=>{setLogTopic(r.id);setTab('Study Log')}}>Log session</button><button onClick={()=>toggleTopic(r.id)}>{completed.includes(r.id)?'Mark incomplete':'Mark complete'}</button></div></div>)}</div></section>}

  {tab==='Study Log'&&<section className="panel"><div className="panelHead"><div><span className="sectionLabel">DAILY TRACKING</span><h2>Study log</h2><p>Every session is linked to one topic and updates the Dashboard, Topics and Roadmap.</p></div><button className="dangerGhost" onClick={resetStudy}>Reset study data</button></div><form className="logForm" onSubmit={addLog}><label>Date<input type="date" value={logDate} onChange={e=>setLogDate(e.target.value)}/></label><label>Hours<input type="number" min="0.25" step="0.25" value={logHours} onChange={e=>setLogHours(e.target.value)} placeholder="2.5"/></label><label>Topic<select value={logTopic} onChange={e=>setLogTopic(e.target.value)}>{roadmap.map(r=><option key={r.id} value={r.id}>{r.topic}</option>)}</select></label><label className="wide">Focus / notes<input value={logFocus} onChange={e=>setLogFocus(e.target.value)} placeholder="TVM, FSA questions, Ethics review…"/></label><button className="primary" type="submit">Add session</button></form><div className="weekStats"><div><strong>{weekHours}h</strong><span>This week</span></div><div><strong>{phase.target}h</strong><span>Weekly target</span></div><div><strong>{streak}</strong><span>Study streak</span></div><div><strong>{restDays.length}</strong><span>Rest days</span></div></div><div className="logControls"><span>Week: {shortDate(weekStart.toISOString().slice(0,10))} – {shortDate(new Date(weekEnd.getTime()-86400000).toISOString().slice(0,10))}</span><div><button className="ghost" type="button" onClick={()=>setWeekOffset(x=>x-1)}>Previous</button><button className="ghost" type="button" onClick={()=>setWeekOffset(0)}>Current week</button><button className="ghost" type="button" onClick={()=>setWeekOffset(x=>x+1)}>Next</button></div></div><div className="dayPlanner">{weeklyDays.map(x=><div className={`dayPlan ${x.rest?'rest':''}`} key={x.key}><div><strong>{x.d.toLocaleDateString('en-IN',{weekday:'short'})}</strong><span>{x.d.toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</span></div><b>{x.hours?`${x.hours}h`:'—'}</b><button type="button" onClick={()=>toggleRest(x.key)}>{x.rest?'Unmark rest day':'Mark rest day'}</button></div>)}</div><div className="logList">{weekLogs.length===0?<div className="empty">No sessions in this week.</div>:weekLogs.map(x=><div className="logRow" key={x.id}><strong>{dateLabel(x.date)}</strong><b>{x.hours}h</b><em>{roadmap.find(r=>r.id===x.topic)?.topic||'Unknown'}</em><span>{x.focus||'Study session'}</span><button onClick={()=>deleteLog(x.id)} aria-label="Delete study session">×</button></div>)}</div></section>}

  {tab==='Mocks'&&<><section className="panel"><div className="panelHead"><div><span className="sectionLabel">PHASE 3</span><h2>12-Mock Gauntlet</h2><p>June 16 → August 15, 2027 · each completed mock stores its actual completion date.</p></div><button className="dangerGhost" onClick={resetMocks}>Reset mock data</button></div><div className="mockGrid">{mocks.map(m=><div className={`mock ${m.done?'mockDone':''}`} key={m.id}><div className="mockTop"><div><span>MOCK {m.id}</span><strong>Planned {shortDate(m.date)}</strong></div><button aria-label={m.done?`Uncomplete mock ${m.id}`:`Complete mock ${m.id}`} className={`check ${m.done?'done':''}`} onClick={()=>beginMockCompletion(m.id)}>{m.done?'✓':''}</button></div><label>Score %<input type="number" min="0" max="100" disabled={m.done} value={m.score} placeholder="Enter score when completing" onChange={e=>updateMock(m.id,{score:e.target.value})}/></label><span className="mockStatus">{m.done?`Completed ${dateLabel(m.completedAt)} · ${m.score}%`:'Not completed · use the circle to complete'}</span></div>)}</div><div className="average"><span>{average!==null?'Average across scored mocks':'No scored mocks yet'}</span><strong>{average!==null?`${average}%`:'—'}</strong></div></section><section className="panel"><div className="panelHead"><div><span className="sectionLabel">SCORE TREND</span><h3>Mock performance by completion date</h3><p>Every plotted point uses the date automatically recorded when the mock was completed.</p></div></div>{chartPoints.length>0?<ScoreChart points={chartPoints} chart={chart} toX={toX} toY={toY} path={path}/>:<div className="chartEmpty">Complete a mock to create the dated score line.</div>}</section></>}

  {mockDialog!==null&&<div className="modalBackdrop" role="dialog" aria-modal="true" aria-labelledby="mockDialogTitle"><div className="modal"><div className="modalEyebrow">MOCK {mockDialog}</div><h2 id="mockDialogTitle">Complete Mock {mockDialog}</h2><p>A score is required before this mock can be marked completed. Today's date will be saved automatically as the completion date.</p><label className="modalLabel">Mock score (%)<input autoFocus type="number" min="0" max="100" step="1" value={mockScore} onChange={e=>setMockScore(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')confirmMockCompletion();if(e.key==='Escape'){setMockDialog(null);setMockScore('')}}} placeholder="e.g. 72"/></label><div className="modalActions"><button className="ghost" onClick={()=>{setMockDialog(null);setMockScore('')}}>Cancel</button><button className="primary" disabled={!Number.isFinite(Number(mockScore))||Number(mockScore)<0||Number(mockScore)>100} onClick={confirmMockCompletion}>Mark completed</button></div></div></div>}
  <footer><span>CFA Level I · August 2027</span><span>Local browser storage · no Error Log</span></footer>
 </main>
}

function Card({label,value,sub}){return <div className="card"><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>}
function ScoreChart({points,chart,toX,toY,path}){return <div className="lineChartWrap"><svg className="lineChart" viewBox={`0 0 ${chart.w} ${chart.h}`} role="img" aria-label="Mock score line chart"><defs><linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#7b9aff"/><stop offset="50%" stopColor="#58e0cf"/><stop offset="100%" stopColor="#c081ff"/></linearGradient></defs>{[0,25,50,75,100].map(v=><g key={v}><line x1={chart.padL} x2={chart.w-chart.padR} y1={toY(v)} y2={toY(v)} className="gridLine"/><text x={chart.padL-10} y={toY(v)+4} textAnchor="end" className="axisText">{v}</text></g>)}<path d={path} fill="none" stroke="url(#chartLine)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>{points.map((m,i)=><g key={m.id}><circle cx={toX(i)} cy={toY(Number(m.score))} r="6" className="chartPoint"/><text x={toX(i)} y={toY(Number(m.score))-12} textAnchor="middle" className="scoreLabel">{m.score}%</text><text x={toX(i)} y={chart.h-29} textAnchor="middle" className="dateText">{shortDate(m.completedAt)}</text><text x={toX(i)} y={chart.h-12} textAnchor="middle" className="mockText">M{m.id}</text></g>)}</svg></div>}
