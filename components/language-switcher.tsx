"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Language } from "@/types";

export function LanguageSwitcher({currentLang,label}:{currentLang:Language;label:string}){
  const router=useRouter();
  const targetLang:Language=currentLang==='pt'?'en':'pt';
  const href=`/?lang=${targetLang}`;
  useEffect(()=>{router.prefetch(href)},[href,router]);
  return <Link className="eyebrow" href={href} replace scroll={false} prefetch aria-label={currentLang==='pt'?'Mudar o site para inglês':'Change the website to Portuguese'}>{label}</Link>
}
