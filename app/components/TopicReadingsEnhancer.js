'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { curriculumReadings, readingRanges } from '../lib/curriculumReadings';

const STORE='cfa-l1-tracker-v10';
const TOPIC_IDS={'Quantitative Methods':'quantitativeMethods',Economics:'economics','Corporate Finance':'corporateFinance','Financial Statement Analysis':'financialStatementAnalysis',Equities:'equities','Fixed Income':'fixedIncome','Derivatives and Risk Management':'derivativesAndRiskManagement',Derivatives:'derivativesAndRiskManagement','Alternative Investments':'alternativeInvestments','Portfolio Construction':'portfolioConstruction',Ethics:'ethics','Ethical and Professional Standards':'ethics'};
const TOPIC_HOURS={quantitativeMethods:32,financialStatementAnalysis:52,fixedIncome:46,corporateFinance:26,equities:44,economics:32,portfolioConstruction:32,derivativesAndRiskManagement:26,alternativeInvestments:22,ethics:48};

function getReadings(topicId){const [start]=readingRanges[topicId]||[1];return(curriculumReadings[topicId]||[]).map((readingTitle,index)=>({number:start+index,title:readingTitle}));}
function readProgress(){try{const raw=window.localStorage.getItem(STORE);const state=raw?JSON.parse(raw):{};return{readDone:Array.isArray(state.readDone)?state.readDone:[],readingDone:state.readingDone&&typeof state.readingDone==='object'?state.readingDone:{}}}catch{return{readDone:[],readingDone:{}}}}
function saveProgress(topicId,readings,completedNumbers){const current=readProgress();const readDone=new Set(current.readDone);if(completedNumbers.length===readings.length)readDone.add(topicId);else readDone.delete(topicId);try{window.localStorage.setItem(STORE,JSON.stringify({...current,readDone:[...readDone],readingDone:{...current.readingDone,[topicId]:completedNumbers}}));window.dispatchEvent(new CustomEvent('cfa-reading-progress-change',{detail:{topicId}}))}catch{}}
function roundToHalf(value){return Math.round(value*2)/2;}

function ReadingPanel({title,topicId,readings}){
 const [completed,setCompleted]=useState([]);
 const plannedHours=TOPIC_HOURS[topicId]||0;
 const rawHoursPerReading=readings.length?plannedHours/readings.length:0;
 const hoursPerReading=roundToHalf(rawHoursPerReading);
 const percent=readings.length?Math.round(completed.length/readings.length*100):0;
 const completedHours=hoursPerReading*completed.length;
 useEffect(()=>{const sync=()=>{const state=readProgress();const stored=Array.isArray(state.readingDone?.[topicId])?state.readingDone[topicId]:[];const legacy=state.readDone.includes(topicId);const next=legacy&&stored.length===0?readings.map(x=>x.number):stored;setCompleted([...new Set(next.filter(n=>readings.some(x=>x.number===n)))])};sync();const onChange=e=>{if(e.detail?.topicId===topicId)sync()};window.addEventListener('cfa-reading-progress-change',onChange);return()=>window.removeEventListener('cfa-reading-progress-change',onChange)},[topicId,readings]);
 const toggleReading=number=>{const next=completed.includes(number)?completed.filter(x=>x!==number):[...completed,number].sort((a,b)=>a-b);setCompleted(next);saveProgress(topicId,readings,next)};
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
   <ol className="topicReadingsList">{readings.map(reading=>{const done=completed.includes(reading.number);return <li key={reading.number} className={done?'isComplete':''}><label className="topicReadingCheck"><input type="checkbox" checked={done} onChange={()=>toggleReading(reading.number)} aria-label={`Mark Reading ${String(reading.number).padStart(2,'0')}: ${reading.title} complete`}/><span className="topicReadingCheckBox" aria-hidden="true"/><span className="topicReadingNumber">Reading {String(reading.number).padStart(2,'0')}</span><span className="topicReadingTitle">{reading.title}</span><span className="topicReadingHours">{hoursPerReading.toFixed(1)}h</span></label></li>})}</ol>
  </div>
 </div>;
}

export default function TopicReadingsEnhancer(){
 const [targets,setTargets]=useState([]);
 useEffect(()=>{const findTargets=()=>{const next=Array.from(document.querySelectorAll('.topicGrid .topic')).map(node=>{let target=node.querySelector(':scope > .topicReadingsMount');if(!target){target=document.createElement('div');target.className='topicReadingsMount';node.appendChild(target)}const title=node.querySelector('.topicTitle')?.textContent?.trim()||'';return{target,title,topicId:TOPIC_IDS[title]}}).filter(item=>item.topicId);setTargets(next)};findTargets();const observer=new MutationObserver(findTargets);observer.observe(document.body,{childList:true,subtree:true});return()=>observer.disconnect()},[]);
 return <>{targets.map(({target,title,topicId})=>createPortal(<ReadingPanel key={`${topicId}-${title}`} title={title} topicId={topicId} readings={getReadings(topicId)}/>,target))}</>;
}
