'use client';

import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import { curriculumReadings, readingRanges } from '../lib/curriculumReadings';

const STORE='cfa-l1-tracker-v10';
const TOPICS={quantitativeMethods:'Quantitative Methods',financialStatementAnalysis:'Financial Statement Analysis',fixedIncome:'Fixed Income',corporateFinance:'Corporate Finance',equities:'Equities',economics:'Economics',portfolioConstruction:'Portfolio Construction',derivativesAndRiskManagement:'Derivatives and Risk Management',alternativeInvestments:'Alternative Investments',ethics:'Ethical and Professional Standards'};
const getTopicReadings=id=>{const [start]=readingRanges[id]||[1];return(curriculumReadings[id]||[]).map((title,index)=>({number:start+index,title}));};
const iso=()=>new Date().toISOString().slice(0,10);
const readState=()=>{try{const raw=window.localStorage.getItem(STORE);return raw?JSON.parse(raw):{};}catch{return {};}};
const getReadingProgress=(topicId,number)=>{const item=readState().readingProgress?.[topicId]?.[number];return item&&typeof item==='object'?item:null;};
function saveAttemptAndSession({date,hours,topicId,reading,status}){try{
 if(!date||!Number.isFinite(hours)||hours<=0||!reading)return {ok:false,error:'Enter a valid study date and positive study hours.'};
 const state=readState();
 const rp=state.readingProgress&&typeof state.readingProgress==='object'?{...state.readingProgress}:{};
 const tp=rp[topicId]&&typeof rp[topicId]==='object'?{...rp[topicId]}:{};
 const prev=tp[reading.number]&&typeof tp[reading.number]==='object'?tp[reading.number]:{};
 const count=Number(prev.incompleteCount)||0;
 if(status==='incomplete'&&count>=2)return {ok:false,error:'A third incomplete attempt is not allowed.'};
 const nextCount=status==='incomplete'?count+1:count;
 let history=Array.isArray(prev.history)?[...prev.history]:[];
 if(status==='completed')history.push({status:'completed',credit:1,at:new Date().toISOString()});
 else if(nextCount===1)history.push({status:'incomplete',credit:.5,at:new Date().toISOString()});
 else{let last=-1;history.forEach((entry,index)=>{if(entry?.status==='incomplete')last=index;});if(last>=0)history=history.map((entry,index)=>index===last?{...entry,credit:.25}:entry);history.push({status:'incomplete',credit:.25,at:new Date().toISOString()});}
 tp[reading.number]={status,incompleteCount:nextCount,credit:status==='completed'?1:.5,history};rp[topicId]=tp;
 const rd={...(state.readingDone&&typeof state.readingDone==='object'?state.readingDone:{})};
 const done=new Set(Array.isArray(rd[topicId])?rd[topicId]:[]);
 if(status==='completed')done.add(reading.number);else done.delete(reading.number);
 rd[topicId]=[...done].sort((a,b)=>a-b);
 const total=(curriculumReadings[topicId]||[]).length;const topics=new Set(Array.isArray(state.readDone)?state.readDone:[]);
 if(total&&done.size===total)topics.add(topicId);else topics.delete(topicId);
 const logs=Array.isArray(state.logs)?[...state.logs]:[];
 const session={id:`${Date.now()}-${Math.random()}`,date,hours,topic:topicId,focus:`Reading ${String(reading.number).padStart(2,'0')} — ${reading.title} — ${status==='completed'?'Completed':'Incomplete'}`,readingNumber:reading.number,readingTitle:reading.title,readingStatus:status};
 logs.unshift(session);
 window.localStorage.setItem(STORE,JSON.stringify({...state,readDone:[...topics],readingDone:rd,readingProgress:rp,logs}));
 window.dispatchEvent(new CustomEvent('cfa-reading-progress-change',{detail:{topicId,number:reading.number,status}}));
 window.dispatchEvent(new CustomEvent('cfa-study-log-added',{detail:{session}}));
 return {ok:true,session};
}catch{return {ok:false,error:'Could not save the study session. Please try again.'};}}

export default function StudyLogReadingDialog(){
 const [open,setOpen]=useState(false),[topicId,setTopicId]=useState('quantitativeMethods'),[readingNumber,setReadingNumber]=useState(1),[status,setStatus]=useState('completed'),[date,setDate]=useState(iso()),[hours,setHours]=useState(''),[error,setError]=useState('');
 const readings=useMemo(()=>getTopicReadings(topicId),[topicId]);
 const selectedReading=readings.find(r=>r.number===readingNumber)||readings[0];
 const syncFor=(id,num)=>{const item=getReadingProgress(id,num);setStatus(item?.status==='completed'?'completed':'incomplete');setError('');};
 const openDialog=target=>{const select=target.querySelector('select');const dateInput=target.querySelector('input[type="date"]');const hoursInput=target.querySelector('input[type="number"]');const id=select?.value||'quantitativeMethods';const rs=getTopicReadings(id);const num=rs[0]?.number||1;setTopicId(id);setReadingNumber(num);setDate(dateInput?.value||iso());setHours(hoursInput?.value||'');syncFor(id,num);setOpen(true);};
 useEffect(()=>{let targetForm=null,addButton=null;const attach=()=>{const f=document.querySelector('.logForm');if(!f||f===targetForm)return;targetForm=f;addButton=f.querySelector('button[type="submit"]');if(addButton){addButton.type='button';const handler=e=>{e.preventDefault();openDialog(f);};addButton._open=handler;addButton.addEventListener('click',handler);}const wide=f.querySelector('.wide');const input=wide?.querySelector('input');if(wide&&input){Array.from(wide.childNodes).forEach(n=>{if(n.nodeType===Node.TEXT_NODE)n.textContent='';});input.style.display='none';input.tabIndex=-1;input.setAttribute('aria-hidden','true');let trigger=wide.querySelector('.readingDialogTrigger');if(!trigger){trigger=document.createElement('button');trigger.type='button';trigger.className='readingDialogTrigger';trigger.textContent='Choose a reading…';trigger.addEventListener('click',()=>openDialog(f));wide.appendChild(trigger);}}};attach();const observer=new MutationObserver(attach);observer.observe(document.body,{childList:true,subtree:true});return()=>{observer.disconnect();if(addButton)addButton.removeEventListener('click',addButton._open);};},[]);
 useEffect(()=>{if(!readings.some(r=>r.number===readingNumber))setReadingNumber(readings[0]?.number||1);},[readings,readingNumber]);
 if(!open||typeof document==='undefined')return null;
 const current=getReadingProgress(topicId,selectedReading?.number||0);const count=Number(current?.incompleteCount)||0;const close=()=>{setOpen(false);setError('');};
 const confirm=()=>{if(!selectedReading)return;const numericHours=Number(hours);if(!date||!Number.isFinite(numericHours)||numericHours<=0){setError('Enter a valid study date and positive study hours.');return;}if(status==='incomplete'&&count>=2){setError('A third incomplete attempt is not allowed.');return;}const result=saveAttemptAndSession({date,hours:numericHours,topicId,reading:selectedReading,status});if(!result.ok){setError(result.error||'Could not save the study session.');return;}close();};
 const changeTopic=id=>{const rs=getTopicReadings(id);const num=rs[0]?.number||1;setTopicId(id);setReadingNumber(num);setDate(date||iso());syncFor(id,num);};
 const changeReading=num=>{setReadingNumber(num);syncFor(topicId,num);};
 return createPortal(<div className="modalBackdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)close();}}><div className="modal readingLogModal" role="dialog" aria-modal="true" aria-labelledby="reading-dialog-title"><div className="readingDialogHead"><div><span className="sectionLabel">STUDY SESSION</span><h2 id="reading-dialog-title">Which reading did you study?</h2><p>{TOPICS[topicId]} · Select the reading and whether you completed it in this session.</p></div><button type="button" className="modalClose" aria-label="Close" onClick={close}>×</button></div><div className="readingDialogFields"><label>Date<input type="date" value={date} onChange={e=>{setDate(e.target.value);setError('');}}/></label><label>Hours<input type="number" min="0.25" step="0.25" value={hours} onChange={e=>{setHours(e.target.value);setError('');}} placeholder="2.5"/></label><label>Subject<select value={topicId} onChange={e=>changeTopic(e.target.value)}>{Object.entries(TOPICS).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><label>Reading<select value={selectedReading?.number||''} onChange={e=>changeReading(Number(e.target.value))}>{readings.map(r=><option key={r.number} value={r.number}>Reading {String(r.number).padStart(2,'0')} — {r.title}</option>)}</select></label></div><div className="readingStatusGroup" role="group" aria-label="Reading completion status"><span className="readingStatusLabel">Reading status</span><div className="readingStatusOptions"><button type="button" className={status==='completed'?'selected':''} onClick={()=>{setStatus('completed');setError('');}}>Completed</button><button type="button" className={`${status==='incomplete'?'selected':''} ${count>=2?'disabled':''}`} disabled={count>=2} onClick={()=>{setStatus('incomplete');setError('');}}>Incomplete</button></div>{count===1&&status==='incomplete'?<p className="readingStatusHint">First incomplete attempt: 50% credit. A second incomplete attempt splits this into 25% + 25%.</p>:null}{count>=2&&status!=='completed'?<p className="readingStatusHint warning">Two incomplete attempts used. A third incomplete attempt is not allowed.</p>:null}{error?<p className="readingStatusHint warning">{error}</p>:null}</div><div className="readingDialogPreview"><span>Selected</span><strong>Reading {String(selectedReading?.number||0).padStart(2,'0')}</strong><p>{selectedReading?.title||'No reading selected'}</p><small>{status==='completed'?'100% credit':count>=2?'25% + 25% = 50% credit':'50% credit on first incomplete'}</small></div><div className="modalActions"><button className="ghost" type="button" onClick={close}>Cancel</button><button className="primary" type="button" onClick={confirm} disabled={!selectedReading||!date||!hours||Number(hours)<=0||Number.isNaN(Number(hours))}>Save study session</button></div></div></div>,document.body);
}
