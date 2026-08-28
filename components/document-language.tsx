"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function DocumentLanguage(){
  const searchParams=useSearchParams();
  const lang=searchParams.get('lang')==='en'?'en':'pt';
  useEffect(()=>{document.documentElement.lang=lang},[lang]);
  return null;
}
