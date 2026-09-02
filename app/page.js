'use client';

import { useMemo, useState } from 'react';

const roadmap = [
  ['Sep 1–21','Quant Methods','Rates, TVM, Stats, Regression, Big Data & Machine Learning',32,'Quant Complete'],
  ['Sep 22–Oct 12','FSA Part 1','Standards, Income Statement, Balance Sheet, Cash Flow',26,'Core FSA Concepts'],
  ['Oct 13–27','FSA Part 2','Inventories, Long-Lived Assets, Taxes, Non-Current Liabilities',26,'FSA Complete'],
  ['Oct 28–Nov 10','Fixed Income 1','Bond Features, Markets, Yield Measures',23,'Pricing foundation'],
  ['Nov 11–24','Fixed Income 2','Duration, Convexity, Credit Risk & Spread Analysis',23,'FI Complete'],
  ['Nov 25–Dec 15','Corporate Issuers','Governance, Capital Budgeting, WACC, Leverage',26,'CI Complete'],
  ['Dec 16–Jan 12','Equity','Market Org, Indices, Efficiency, Valuation Models',44,'Equity Complete'],
  ['Jan 13–Feb 2','Economics','Micro/Macro, Business Cycles, Monetary/Fiscal, FX',32,'Econ Complete'],
  ['Feb 3–23','Portfolio Management','Risk & Return, CAPM, Capital Allocation Line',32,'PM Complete'],
  ['Feb 24–Mar 9','Derivatives','Forwards, Futures, Options, Swaps Basics',26,'Deriv Complete'],
  ['Mar 10–23','Alternatives','Private Equity, Real Estate, Infrastructure, Hedge Funds',22,'Alts Complete'],
  ['Mar 24–Apr 7','Ethics','Code of Ethics & Standards (I–VII), GIPS Overview',48,'First Pass Ethics'],
  ['Apr 8–15','Buffer Week','Close reading gaps and resolve difficult concepts',10,'100% Syllabus Done'],
];

const mocks = Array.from({length:12},(_,i)=>({id:i+1,score:null,done:false}));

export default function Home(){
 const [completed,setCompleted]=useState([]);
 const [hours,setHours]=useState(0);
 const [mockState,setMockState]=useState(mocks);
 const [tab,setTab]=useState('Dashboard');
 const total=roadmap.reduce((a,r)=>a+r[3],0);
 const progress=Math.round(completed.reduce((a,i)=>a+roadmap[i][3],0)/total*100);
 const phase=progress<70?'Phase 1 · First Pass':progress<100?'Phase 2 · Consolidation & Revision':'Phase 3 · 12-Mock Gauntlet';
 const mockDone=mockState.filter(m=>m.done).length;
 const today=new Date();
 const exam=new Date('2027-08-15');
 const days=Math.max(0,Math.ceil((exam-today)/86400000));
 const avg=useMemo(()=>{const s=mockState.map(m=>Number(m.score)).filter(n=>Number.isFinite(n));return s.length?Math.round(s.reduce((a,b)=>a+b,0)/s.length):0},[mockState]);
 return <main>
  <header className="top"><div><div className="eyebrow">CFA LEVEL I · AUGUST 2027</div><h1>Study Tracker</h1><p>Your roadmap from first pass to exam day.</p></div><div className="count"><strong>{days}</strong><span>days to exam</span></div></header>
  <nav>{['Dashboard','Roadmap','Topics','Mocks'].map(x=><button className={tab===x?'active':''} onClick={()=>setTab(x)} key={x}>{x}</button>)}</nav>
  {tab==='Dashboard'&&<>
   <section className="hero"><div><span className="pill">{phase}</span><h2>Build consistency. Track progress.</h2><p>Target ~400 hours across the full preparation timeline.</p></div><div className="ring"><b>{progress}%</b><span>syllabus</span></div></section>
   <div className="grid four"><Card label="Study hours" value={`${hours}h`} sub="of ~400h target"/><Card label="Syllabus" value={`${progress}%`} sub={`${completed.length}/${roadmap.length} blocks complete`}/><Card label="Mocks" value={`${mockDone}/12`} sub={avg?`Average ${avg}%`:'No scores yet'}/><Card label="Current phase" value="Phase 1" sub="First Pass"/></div>
   <section className="panel"><div className="panelHead"><div><h3>Today's focus</h3><p>Use the roadmap as your source of truth.</p></div><div className="hours"><button onClick={()=>setHours(Math.max(0,hours-1))}>−</button><b>{hours}h</b><button onClick={()=>setHours(hours+1)}>+</button></div></div><div className="next"><span>Next roadmap block</span><strong>{roadmap[Math.min(completed.length,roadmap.length-1)][1]}</strong><small>{roadmap[Math.min(completed.length,roadmap.length-1)][0]} · {roadmap[Math.min(completed.length,roadmap.length-1)][3]}h target</small></div></section>
  </>}
  {tab==='Roadmap'&&<section className="panel"><div className="panelHead"><div><h2>Study roadmap</h2><p>September 2026 → August 2027</p></div><span className="pill">{progress}% complete</span></div>{roadmap.map((r,i)=><div className="road" key={r[1]}><button className={completed.includes(i)?'check done':'check'} onClick={()=>setCompleted(c=>c.includes(i)?c.filter(x=>x!==i):[...c,i])}>{completed.includes(i)?'✓':''}</button><div className="roadDate">{r[0]}</div><div className="roadMain"><strong>{r[1]}</strong><span>{r[2]}</span></div><div className="roadHours">{r[3]}h<small>{r[4]}</small></div></div>)}</section>}
  {tab==='Topics'&&<section className="panel"><div className="panelHead"><div><h2>Topic progress</h2><p>Mark roadmap blocks complete as you finish them.</p></div></div><div className="topicGrid">{roadmap.slice(0,-1).map((r,i)=><div className="topic" key={r[1]}><div><strong>{r[1]}</strong><span>{r[3]}h planned</span></div><div className="bar"><i style={{width:completed.includes(i)?'100%':'0%'}}/></div><button onClick={()=>setCompleted(c=>c.includes(i)?c.filter(x=>x!==i):[...c,i])}>{completed.includes(i)?'Completed':'Mark complete'}</button></div>)}</div></section>}
  {tab==='Mocks'&&<section className="panel"><div className="panelHead"><div><h2>12-Mock Gauntlet</h2><p>June 16 → August 10, 2027 · one mock roughly every five days.</p></div><span className="pill">{mockDone}/12 complete</span></div><div className="mockGrid">{mockState.map((m,i)=><div className="mock" key={m.id}><div className="mockTop"><strong>Mock {m.id}</strong><button className={m.done?'check done':'check'} onClick={()=>setMockState(s=>s.map(x=>x.id===m.id?{...x,done:!x.done}:x))}>{m.done?'✓':''}</button></div><label>Score %<input type="number" min="0" max="100" value={m.score??''} placeholder="—" onChange={e=>setMockState(s=>s.map(x=>x.id===m.id?{...x,score:e.target.value}:x))}/></label></div>)}</div></section>}
 </main>
}
function Card({label,value,sub}){return <div className="card"><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>}
