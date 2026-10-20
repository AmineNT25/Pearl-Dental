"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { CalendarDays, X } from "lucide-react";
import type { AppointmentStatus, Attendance } from "@/lib/types";
export const statusLabels:Record<AppointmentStatus,string>={pending:"Pending",confirmed:"Confirmed",checked_in:"Checked in",complete:"Completed",cancelled:"Cancelled"};
export const attendanceLabels={present:"Present",checked_out:"Checked out",absent:"Absent"};
export function Avatar({name,index=0}:{name:string;index?:number}){const initials=name.replace(/^Dr\.\s*/i,"").split(" ").filter(Boolean).slice(0,2).map(p=>p[0]).join("").toUpperCase();return <span className={`avatar avatar-${index%4}`}>{initials}</span>;}
export function Empty({children}:{children:ReactNode}){return <div className="empty-state"><CalendarDays size={29}/><p>{children}</p></div>;}
export function Status({value}:{value:AppointmentStatus}){return <span className={`status status-${value}`}>{statusLabels[value]}</span>;}
export function AttendanceBadge({record}:{record?:Attendance}){return <span className={`attendance-badge ${record?.status||"unrecorded"}`}><i/>{record?attendanceLabels[record.status]:"Not recorded"}</span>;}
export async function api<T>(path:string,options?:RequestInit):Promise<T>{
  const response=await fetch(path,{...options,headers:{"Content-Type":"application/json",...options?.headers}});
  const data=await response.json();
  if(response.status===401){window.location.assign("/staff/login");throw new Error("Please sign in again.");}
  if(!response.ok)throw new Error(data.error||"The request could not be completed.");return data;
}
export function Modal({title,description,children,close}:{title:string;description?:string;children:ReactNode;close:()=>void}){
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close();},[]);
  return <dialog ref={ref} className="modal" onCancel={event=>{event.preventDefault();close();}} aria-labelledby="modal-title"><div className="modal-heading"><div><h2 id="modal-title">{title}</h2>{description&&<p className="muted">{description}</p>}</div><button className="icon-button" aria-label="Close dialog" onClick={close}><X size={20}/></button></div>{children}</dialog>;
}
export function Metric({icon,tone,label,value,detail}:{icon:ReactNode;tone:string;label:string;value:ReactNode;detail:string}){return <div className="metric"><span className={`metric-icon ${tone}`}>{icon}</span><div><p>{label}</p><strong>{value}</strong><span>{detail}</span></div></div>;}

