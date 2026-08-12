"use client";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { clearRecords, getRecords, type TestRecord } from "@/lib/storage";
export default function HistoryPage() {
 const [records,setRecords]=useState<TestRecord[]>([]);
 useEffect(()=>setRecords(getRecords().reverse()),[]);
 const clear=()=>{ clearRecords(); setRecords([]); };
 return <main className="min-h-screen px-5 py-14 sm:px-8 md:px-12 lg:px-16"><div className="mx-auto max-w-5xl"><div className="flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">History</p><h1 className="mt-4 text-4xl font-semibold tracking-tight">Past tests.</h1></div>{records.length>0&&<button onClick={clear} className="inline-flex items-center gap-2 border border-line px-4 py-2 text-xs uppercase tracking-wider text-secondary transition hover:border-error hover:text-error"><Trash2 size={14}/> Clear</button>}</div><div className="mt-10 overflow-hidden border-y border-line">{records.length?records.map(r=><div key={r.id} className="grid grid-cols-2 gap-4 border-b border-line px-5 py-4 last:border-0 sm:grid-cols-5"><span className="font-semibold">{r.name}</span><span className="font-mono text-sm">{r.wpm} WPM</span><span className="font-mono text-sm">{r.accuracy}%</span><span className="font-mono text-sm text-secondary">{r.errors} errors</span><span className="text-right text-xs text-muted">{new Date(r.createdAt).toLocaleDateString()}</span></div>):<div className="px-6 py-16 text-center text-sm text-secondary">Your completed tests will appear here.</div>}</div></div></main>;
}
