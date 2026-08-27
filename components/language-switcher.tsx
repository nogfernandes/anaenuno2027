"use client";
import { useRouter,useSearchParams } from "next/navigation";
export function LanguageSwitcher({label}:{label:string}){const router=useRouter();const params=useSearchParams();return <button className="eyebrow" onClick={()=>{const p=new URLSearchParams(params);p.set('lang',label==='EN'?'en':'pt');router.replace(`/?${p}`)}} aria-label="Change language">{label}</button>}
