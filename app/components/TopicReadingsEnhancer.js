'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { curriculumReadings, readingRanges } from '../lib/curriculumReadings';

const STORE='cfa-l1-tracker-v10';
const TOPIC_IDS={'Quantitative Methods':'quantitativeMethods','Economics':'economics','Corporate Finance':'corporateFinance','Financial Statement Analysis':'financialStatementAnalysis','Equities':'equities','Fixed Income':'fixedIncome','Derivatives and Risk Management':'derivativesAndRiskManagement','Derivatives':'derivativesAndRiskManagement','Alternative Investments':'alternativeInvestments','Portfolio Construction':'portfolioConstruction','Ethics':'ethics','Ethical and Professional Standards':'ethics'};
const TOPIC_HOURS={quantitativeMethods:32,financialStatementAnalysis:52,fixedIncome:46,corporateFinance:26,equities:44,economics:32,portfolioConstruction:32,derivativesAndRiskManagement:26,alternativeInvestments:22,ethics:48};

function getReadings(topicId){const [start]=readingRanges[topicId]||[1];return(curriculumReadings[topicId]||[]).map((title,index)=>({number:start+index,title}));}

function readProgress(){
 try{
  const raw=window.localStorage.getItem(STORE);
  const state=raw?JSON.parse(raw):{};
  return{readDone:Array.isArray(state.readDone)?state.readDone:[],readingDone:state.readingDone&&typeof state.readingDone==='object'?state.readingDone:{}};
 }catch{return{readDone:[],readingDone:{}}}
}

function readCompleted(topicId,readings){
 const state=readProgress();
 const stored=Array.isArray(state.readingDone?.[topicId])?state.readingDone[topicId]:[];
 if(stored.length)return stored.filter(n=>readings.some(x=>x.number===n));
 if(state.readDone.includes(topicId))return readings.map(x=>x.number);
 return[];
}

function saveProgress(topicId,readings,completedNumbers){
 const current=readProgress();
 const readDone=new Set(current.readDone);
 if(completedNumbers.length===readings.length)readDone.add(topicId);else readDone.delete(topicId);
 try{
  window.localStorage.setItem(STORE,JSON.stringify({...current,readDone:[...readDone],readingDone:{...current.readingDone,[topicId]:completedNumbers}}));
  window.dispatchEvent(new CustomEvent('cfa-reading-progress-change',{detail:{topicId}}));
 }catch{}
}

function roundToHalf(value){return Math.round(value*2)/2;}

function ensureTopicCard(node,topicId,readings){
 const completedNumbers=readCompleted(topicId,readings);
 const total=readings.length;
 const completed=completedNumbers.length;
 const percent=total?Math.round(completed/total*100):0;
 const topicHeader=node.querySelector('.topicTop > div');
 const topicMeta=topicHeader?.querySelector('.topicMeta')||topicHeader?.querySelector(':scope > span:nth-child(2)');
 if(topicMeta){topicMeta.classList.add('topicMeta');topicMeta.textContent=`${completed}/${total} modules complete`;}
 const oldHoursBar=node.querySelector(':scope > .bar');
 if(oldHoursBar)oldHoursBar.style.display='none';
 const oldFooter=node.querySelector(':scope > .topicFooter');
 if(oldFooter){const first=oldFooter.querySelector(':scope > span:first-child');if(first)first.style.display='none';}
 let moduleProgress=node.querySelector(':scope > .topicModuleProgress');
 if(!moduleProgress){
  moduleProgress=document.createElement('div');
  moduleProgress.className='topicModuleProgress';
  moduleProgress.setAttribute('role','progressbar');
  const track=document.createElement('span');
  track.className='topicModuleTrack';
  const fill=document.createElement('span');
  fill.className='topicModuleFill';
  track.appendChild(fill);
  moduleProgress.appendChild(track);
  const value=document.createElement('span');
  value.className='topicModuleValue';
  moduleProgress.appendChild(value);
  node.insertBefore(moduleProgress,node.querySelector(':scope > .topicActions')||null);
 }
 const fill=moduleProgress.querySelector('.topicModuleFill');
 const value=moduleProgress.querySelector('.topicModuleValue');
 const track=moduleProgress.querySelector('.topicModuleTrack');
 if(fill)fill.style.width=`${percent}%`;
 if(value)value.textContent=`${completed}/${total} modules · ${percent}%`;
 moduleProgress.setAttribute('aria-valuemin','0');
 moduleProgress.setAttribute('aria-valuemax',String(total));
 moduleProgress.setAttribute('aria-valuenow',String(completed));
 moduleProgress.setAttribute('aria-valuetext',`${completed} of ${total} learning modules complete`);
 if(track)track.setAttribute('aria-hidden','true');
 const status=node.querySelector(':scope > .topicTop > .status');
 if(status){status.classList.add('topicStatusBadge');status.textContent=completed===total?'TOPIC COMPLETE':'TOPIC OPEN';}
}

function ReadingPanel({title,topicId,readings}){
 const [completed,setCompleted]=useState([]);
 const plannedHours=TOPIC_HOURS[topicId]||0;
 const hoursPerReading=roundToHalf(readings.length?plannedHours/readings.length:0);
 const percent=readings.length?Math.round(completed.length/readings.length*100):0;
 const completedHours=hoursPerReading*completed.length;
 useEffect(()=>{
  const sync=()=>setCompleted(readCompleted(topicId,readings));
  sync();
  const onChange=e=>{if(e.detail?.topicId===topicId)sync();};
  window.addEventListener('cfa-reading-progress-change',onChange);
  return()=>window.removeEventListener('cfa-reading-progress-change',onChange);
 },[topicId,readings]);
 const toggleReading=number=>{
  const next=completed.includes(number)?completed.filter(x=>x!==number):[...completed,number].sort((a,b)=>a-b);
  setCompleted(next);
  saveProgress(topicId,readings,next);
 };
 return <div className="topicReadings">
  <div className="topicReadingsSummary">
   <div className="topicReadingsSummaryMain"><span className="topicReadingsLabel">READING TRACKER</span><strong>{completed.length} / {readings.length} complete</strong></div>
   <span className="topicReadingsPercent">{percent}%</span>
  </div>
  <div className="topicReadingProgressMeta" aria-label={`${completed.length} of ${readings.length} readings complete. ${completedHours.toFixed(1)} of ${plannedHours} planned hours covered.`}>
   <span className="topicReadingProgressTrack"><span style={{width:`${percent}%`}}/></span>
   <span className="topicReadingProgressTime">{completedHours.toFixed(1)}h / {plannedHours}h planned</span>
  </div>
  <div className="topicReadingsBody">
   <div className="topicReadingsHead"><span>{title} · READINGS</span><span>{hoursPerReading.toFixed(1)}h est. / reading</span></div>
   <ol className="topicReadingsList">
    {readings.map(reading=>{
     const done=completed.includes(reading.number);
     return <li key={reading.number} className={done?'isComplete':''}>
      <label className="topicReadingCheck">
       <input type="checkbox" checked={done} onChange={()=>toggleReading(reading.number)} aria-label={`Mark Reading ${String(reading.number).padStart(2,'0')}: ${reading.title} complete`}/>
       <span className="topicReadingCheckBox" aria-hidden="true"/>
       <span className="topicReadingNumber">Reading {String(reading.number).padStart(2,'0')}</span>
       <span className="topicReadingTitle">{reading.title}</span>
       <span className="topicReadingHours">{hoursPerReading.toFixed(1)}h</span>
      </label>
     </li>;
    })}
   </ol>
  </div>
 </div>;
}

export default function TopicReadingsEnhancer(){
 const [targets,setTargets]=useState([]);
 useEffect(()=>{
  let lastSignature=null;
  let scheduled=false;
  const scan=()=>{
   scheduled=false;
   const nodes=Array.from(document.querySelectorAll('.topicGrid .topic'));
   const items=nodes.map(node=>{
    const title=node.querySelector('.topicTitle')?.textContent?.trim()||'';
    return{node,title,topicId:TOPIC_IDS[title]};
   }).filter(item=>item.topicId);
   const signature=items.map(item=>`${item.topicId}:${item.title}`).join('|');
   if(signature===lastSignature)return;
   lastSignature=signature;
   if(!items.length){setTargets([]);return;}
   const next=items.map(({node,title,topicId})=>{
    let target=node.querySelector(':scope > .topicReadingsMount');
    if(!target){target=document.createElement('div');target.className='topicReadingsMount';node.appendChild(target);}
    const readings=getReadings(topicId);
    node.setAttribute('data-topic-id',topicId);
    ensureTopicCard(node,topicId,readings);
    return{target,title,topicId};
   });
   setTargets(next);
  };
  const requestScan=()=>{
   if(scheduled)return;
   scheduled=true;
   window.requestAnimationFrame(scan);
  };
  requestScan();
  const observer=new MutationObserver(requestScan);
  observer.observe(document.body,{childList:true,subtree:true});
  return()=>observer.disconnect();
 },[]);
 return <>{targets.map(({target,title,topicId})=>createPortal(<ReadingPanel key={`${topicId}-${title}`} title={title} topicId={topicId} readings={getReadings(topicId)}/>,target))}</>;
}
