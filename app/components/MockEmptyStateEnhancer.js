'use client';

import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';

const STORE='cfa-l1-tracker-v10';
const LEGACY_STORE='cfa-l1-tracker-v9';
const MOCK_DATES=['2027-06-16','2027-06-21','2027-06-26','2027-07-01','2027-07-06','2027-07-11','2027-07-16','2027-07-21','2027-07-26','2027-08-01','2027-08-05','2027-08-10'];

const freshMocks=()=>MOCK_DATES.map((date,i)=>({id:i+1,date,score:'',done:false,completedAt:''}));

function readMocks(){
  try{
    const raw=window.localStorage.getItem(STORE)||window.localStorage.getItem(LEGACY_STORE);
    const state=raw?JSON.parse(raw):{};
    const defaults=freshMocks();
    if(!Array.isArray(state.mocks)) return defaults;
    return defaults.map((fallback,i)=>{
      const m=state.mocks[i];
      return m&&typeof m==='object'?{...fallback,date:typeof m.date==='string'?m.date:fallback.date,score:m.score==null?'':String(m.score),done:!!m.done,completedAt:typeof m.completedAt==='string'?m.completedAt:''}:fallback;
    });
  }catch{return freshMocks()}
}

function readState(){
  try{
    const raw=window.localStorage.getItem(STORE)||window.localStorage.getItem(LEGACY_STORE);
    return raw?JSON.parse(raw):{};
  }catch{return {}}
}

export default function MockEmptyStateEnhancer(){
  const [target,setTarget]=useState(null),[open,setOpen]=useState(false),[score,setScore]=useState(''),[mockId,setMockId]=useState(1);

  useEffect(()=>{
    const sync=()=>{
      const node=document.querySelector('.chartEmpty');
      if(!node){setTarget(null);return}
      node.dataset.actionable='true';
      setTarget(node);
    };
    sync();
    const observer=new MutationObserver(sync);
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[]);

  useEffect(()=>{
    if(!open) return;
    const onKeyDown=e=>{if(e.key==='Escape'){e.preventDefault();setOpen(false)}};
    document.addEventListener('keydown',onKeyDown);
    document.body.style.overflow='hidden';
    return()=>{document.removeEventListener('keydown',onKeyDown);document.body.style.overflow=''};
  },[open]);

  const openForm=()=>{
    const next=readMocks().find(m=>!m.done)?.id||1;
    setMockId(next);
    setScore('');
    setOpen(true);
  };

  const submit=e=>{
    e.preventDefault();
    const n=Number(score);
    if(!Number.isFinite(n)||n<0||n>100) return;
    const state=readState();
    const mocks=readMocks().map(m=>m.id===mockId?{...m,score:String(n),done:true,completedAt:new Date().toISOString().slice(0,10)}:m);
    try{window.localStorage.setItem(STORE,JSON.stringify({...state,mocks}));window.location.reload()}catch{}
  };

  if(!target) return null;

  return <>
    {createPortal(
      <div className="actionableEmptyState">
        <strong>No completed mock scores yet</strong>
        <span>Complete a mock and enter its score to start your dated readiness trend.</span>
        <button type="button" className="primary" onClick={openForm}>Add mock score</button>
      </div>,
      target
    )}
    {open&&createPortal(
      <div className="modalBackdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="mock-empty-title" aria-describedby="mock-empty-description">
          <span className="sectionLabel">COMPLETE MOCK {mockId}</span>
          <h2 id="mock-empty-title">Enter mock score</h2>
          <p id="mock-empty-description">Enter a score from 0 to 100. Today's date will be saved automatically.</p>
          <form onSubmit={submit}>
            <label>Score (%)
              <input autoFocus type="number" min="0" max="100" step="1" required value={score} onChange={e=>setScore(e.target.value)} placeholder="e.g. 72" />
            </label>
            <div className="modalActions">
              <button className="ghost" type="button" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="primary" type="submit" disabled={score===''||!Number.isFinite(Number(score))||Number(score)<0||Number(score)>100}>Complete mock</button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )}
  </>;
}
