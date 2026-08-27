"use client";
import { useEffect,useState } from "react";
const calculate=(date:string)=>{const d=Math.max(0,new Date(date).getTime()-Date.now());return [Math.floor(d/86400000),Math.floor(d/3600000)%24,Math.floor(d/60000)%60,Math.floor(d/1000)%60]};
export function Countdown({labels,date='2027-04-24T14:30:00+01:00'}:{labels:string[];date?:string}){const [time,setTime]=useState(()=>calculate(date));useEffect(()=>{const id=setInterval(()=>setTime(calculate(date)),1000);return()=>clearInterval(id)},[date]);return <div className="mt-12 grid grid-cols-4 gap-3">{time.map((n,i)=><div key={labels[i]}><div className="font-editorial text-4xl sm:text-6xl">{String(n).padStart(2,'0')}</div><div className="mt-2 text-[9px] uppercase tracking-[.2em]">{labels[i]}</div></div>)}</div>}
