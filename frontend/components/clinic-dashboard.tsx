"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, ChevronRight, Clock3, KeyRound, LayoutGrid, LogOut, Mail, Menu, Pencil, Phone, Plus, RefreshCw, Search, Settings, ShieldCheck, Trash2, Users, UserRoundCheck, X } from "lucide-react";
import { ClinicLogo } from "@/components/clinic-logo";
import { api, Avatar, AttendanceBadge, attendanceLabels, Empty, Metric, Modal, Status, statusLabels } from "@/components/workspace-ui";
import { AttendanceView, BookingModal, EmployeeModal, HoursEditor, ScheduleView } from "@/components/workspace-panels";
import { buildSlots, defaultSchedule, getProvider, getService, minutesToTime, providers, services, timeToMinutes } from "@/lib/data";
import { clinicDate, dateLabel } from "@/lib/clinic-time";
import type { Appointment, AppointmentStatus, Attendance, ClinicUser, Schedule } from "@/lib/types";

type View="overview"|"appointments"|"employees"|"schedule"|"attendance"|"settings";
const viewInfo:Record<View,{eyebrow:string;title:string;description:string}>={
  overview:{eyebrow:"",title:"",description:"Here’s what’s happening at the clinic today."},
  appointments:{eyebrow:"PATIENT CARE",title:"Appointments",description:"Manage visits, treatments, and patient bookings."},
  employees:{eyebrow:"TEAM MANAGEMENT",title:"Employees",description:"Manage your team, accounts, and daily attendance."},
  schedule:{eyebrow:"PLAN THE WEEK",title:"Schedule",description:"A clear view of the clinic’s appointments and opening hours."},
  attendance:{eyebrow:"YOUR WORKDAY",title:"My attendance",description:"Check in, record your departure, or let the team know you’ll be away."},
  settings:{eyebrow:"YOUR WORKSPACE",title:"Settings",description:"Manage your account and clinic preferences."},
};
export default function Dashboard({user}:{user:ClinicUser}){
  const isAdmin=user.role==="admin";
  const [view,setView]=useState<View>("overview");const [today,setToday]=useState(clinicDate());
  const [appointments,setAppointments]=useState<Appointment[]>([]);const [employees,setEmployees]=useState<ClinicUser[]>([]);
  const [attendance,setAttendance]=useState<Attendance[]>([]);const [history,setHistory]=useState<Attendance[]>([]);
  const [schedule,setSchedule]=useState<Schedule>(defaultSchedule);const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");const [notice,setNotice]=useState("");const [query,setQuery]=useState("");
  const [mobileNav,setMobileNav]=useState(false);const [booking,setBooking]=useState(false);
  const [employeeEditor,setEmployeeEditor]=useState<ClinicUser|"new"|null>(null);const [deactivate,setDeactivate]=useState<ClinicUser|null>(null);
  const [credentials,setCredentials]=useState<{email:string;temporaryPassword:string}|null>(null);
  const [busy,setBusy]=useState(false);const [filter,setFilter]=useState("all");const [appointmentDate,setAppointmentDate]=useState("");

  const loadData=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      const [a,s,t,h,e]=await Promise.all([
        api<{appointments:Appointment[]}>("/api/appointments"),api<{schedule:Schedule}>("/api/schedule"),
        api<{attendance:Attendance[]}>(`/api/attendance?date=${today}`),api<{attendance:Attendance[]}>(`/api/attendance?date=${today}&history=true`),
        isAdmin?api<{employees:ClinicUser[]}>("/api/employees"):Promise.resolve({employees:[]}),
      ]);
      setAppointments(a.appointments);setSchedule(s.schedule);setAttendance(t.attendance);setHistory(h.attendance);setEmployees(e.employees);
    }catch(error){setError(error instanceof Error?error.message:"Could not load clinic data.");}finally{setLoading(false);}
  },[isAdmin,today]);
  useEffect(()=>{void loadData();},[loadData]);
  useEffect(()=>{const id=window.setInterval(()=>setToday(clinicDate()),60000);return()=>window.clearInterval(id);},[]);
  useEffect(()=>{if(!notice)return;const id=window.setTimeout(()=>setNotice(""),5000);return()=>window.clearTimeout(id);},[notice]);
  function navigate(next:View){setView(next);setMobileNav(false);setQuery("");}
  const todayAppointments=useMemo(()=>appointments.filter(a=>a.date===today&&a.status!=="cancelled").sort((a,b)=>a.time.localeCompare(b.time)),[appointments,today]);
  const activeEmployees=employees.filter(e=>e.active);
  const presentCount=attendance.filter(a=>a.status==="present"&&activeEmployees.some(e=>e.id===a.userId)).length;
  const absentCount=attendance.filter(a=>a.status==="absent"&&activeEmployees.some(e=>e.id===a.userId)).length;
  const myRecord=attendance.find(a=>a.userId===user.id);const search=query.trim().toLowerCase();
  const filteredAppointments=appointments.filter(a=>(filter==="all"||a.status===filter)&&(!appointmentDate||a.date===appointmentDate)&&`${a.patientName} ${a.email} ${getService(a.serviceId).name} ${getProvider(a.providerId).name}`.toLowerCase().includes(search));
  const availableSlots=providers.reduce((total,provider)=>total+buildSlots(today,provider.id,services[0].id,appointments,"",schedule).filter(s=>s.available).length,0);
  const navItems=[
    {id:"overview" as View,label:"Overview",icon:LayoutGrid},{id:"appointments" as View,label:"Appointments",icon:CalendarDays},
    ...(isAdmin?[{id:"employees" as View,label:"Employees",icon:Users}]:[]),{id:"schedule" as View,label:"Schedule",icon:Clock3},{id:"attendance" as View,label:"My attendance",icon:UserRoundCheck},
  ];
  const info=viewInfo[view];
  async function updateStatus(id:string,status:AppointmentStatus){
    setBusy(true);try{const data=await api<{appointment:Appointment}>(`/api/appointments/${id}`,{method:"PATCH",body:JSON.stringify({status})});setAppointments(items=>items.map(a=>a.id===id?data.appointment:a));setNotice("Appointment updated.");}catch(error){setError((error as Error).message);}finally{setBusy(false);}
  }
  async function resetPassword(employee:ClinicUser){
    setBusy(true);try{setCredentials(await api(`/api/employees/${employee.id}/reset-password`,{method:"POST",body:"{}"}));}catch(error){setError((error as Error).message);}finally{setBusy(false);}
  }
  return <div className="workspace">
    {mobileNav&&<button className="nav-scrim" aria-label="Close navigation" onClick={()=>setMobileNav(false)}/>}
    <aside className={`sidebar ${mobileNav?"open":""}`}><ClinicLogo/><p className="nav-caption">WORKSPACE</p><nav aria-label="Workspace">{navItems.map(({id,label,icon:Icon})=><button key={id} className={view===id?"active":""} onClick={()=>navigate(id)} aria-current={view===id?"page":undefined}><Icon size={19}/><span>{label}</span>{id==="appointments"&&<b>{todayAppointments.length}</b>}</button>)}</nav>
      <div className="sidebar-bottom"><button className={`settings-nav ${view==="settings"?"active":""}`} onClick={()=>navigate("settings")}><Settings size={19}/>Settings</button><div className="sidebar-user"><Avatar name={user.name} index={1}/><div><strong>{user.name}</strong><span>{isAdmin?"Clinic administrator":user.jobTitle}</span></div></div><button className="signout" onClick={()=>void signOut({callbackUrl:"/staff/login"})}><LogOut size={16}/>Sign out</button></div>
    </aside>
    <main className="workspace-main"><header className="topbar"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={()=>setMobileNav(true)}><Menu size={22}/></button><label className="global-search"><Search size={18}/><input aria-label="Search patients and employees" value={query} onChange={event=>{setQuery(event.target.value);if(view!=="employees")setView("appointments");}} placeholder={isAdmin?"Search patients, employees…":"Search appointments…"}/></label><button className="icon-button refresh-button" title="Refresh clinic data" aria-label="Refresh clinic data" onClick={()=>void loadData()} disabled={loading}><RefreshCw size={18} className={loading?"spinning":""}/></button><span className="topbar-date">{dateLabel(today,{weekday:"long",month:"short",day:"numeric"})}</span></header>
      <div className="workspace-content"><div className="page-heading"><div><p className="eyebrow">{view==="overview"?dateLabel(today,{weekday:"long",month:"long",day:"numeric"}):info.eyebrow}</p><h1>{view==="overview"?`Hello, ${user.name.split(" ")[0]}.`:info.title}</h1><p className="muted">{info.description}</p></div>{isAdmin&&view!=="attendance"&&view!=="settings"&&<button className="primary" disabled={loading||!!error} onClick={()=>view==="employees"?setEmployeeEditor("new"):setBooking(true)}><Plus size={18}/>{view==="employees"?"Add employee":"New appointment"}</button>}</div>
        {error&&<div className="notice error" role="alert"><span>{error}</span><button onClick={()=>void loadData()} className="text-link">Try again</button></div>}
        {loading&&<p className="loading-label" role="status">Refreshing your workspace…</p>}
        {view==="overview"&&<><div className="metrics-grid">
          <Metric icon={<CalendarDays/>} tone="lavender" label="Today’s appointments" value={todayAppointments.length} detail={`${todayAppointments.filter(a=>a.status==="confirmed").length} confirmed visits`}/>
          <Metric icon={<Users/>} tone="sage" label={isAdmin?"Staff present":"My attendance"} value={isAdmin?<>{presentCount}<small>/ {activeEmployees.length}</small></>:myRecord?attendanceLabels[myRecord.status]:"Not checked in"} detail={isAdmin?`${absentCount} reported absent today`:"Your status today"}/>
          <Metric icon={<Clock3/>} tone="sand" label="Available slots" value={availableSlots} detail="Cleaning and exam · all providers"/>
          <Metric icon={<UserRoundCheck/>} tone="rose" label="Patients" value={new Set(appointments.map(a=>a.email.toLowerCase())).size} detail="Across recorded appointments"/>
        </div><div className="overview-grid"><section className="panel"><div className="panel-heading"><div><h2>Today’s schedule</h2><p>{todayAppointments.length} appointments · {dateLabel(today,{month:"short",day:"numeric"})}</p></div><button className="text-link" onClick={()=>navigate("schedule")}>Full schedule<ChevronRight size={16}/></button></div><div className="timeline">{todayAppointments.length?todayAppointments.map((a,index)=><div className="timeline-row" key={a.id}><div className="timeline-time"><strong>{a.time}</strong><span>{getService(a.serviceId).duration} min</span></div><div className={`timeline-card tone-${index%4}`}><div><strong>{a.patientName}</strong><span>{getService(a.serviceId).name}</span></div><div className="timeline-provider"><span>{getProvider(a.providerId).name}</span><span>{a.time} – {minutesToTime(timeToMinutes(a.time)+getService(a.serviceId).duration)}</span></div><Status value={a.status}/></div></div>):<Empty>No appointments today. A little room to breathe.</Empty>}</div></section>
        <div className="overview-side">{isAdmin?<section className="panel"><div className="panel-heading"><div><h2>Team attendance</h2><p>{presentCount} of {activeEmployees.length} present</p></div><button className="icon-button bordered" aria-label="View employees" onClick={()=>navigate("employees")}><ChevronRight size={17}/></button></div><div className="team-list">{activeEmployees.length?activeEmployees.slice(0,6).map((e,index)=><div className="team-row" key={e.id}><Avatar name={e.name} index={index}/><div><strong>{e.name}</strong><span>{e.jobTitle}</span></div><AttendanceBadge record={attendance.find(a=>a.userId===e.id)}/></div>):<Empty>Add your first employee to get the team started.</Empty>}</div></section>:<section className="panel personal-summary"><UserRoundCheck size={24}/><h2>Your day at the clinic</h2><AttendanceBadge record={myRecord}/><p className="muted">Keep your team informed when you arrive, leave, or need a day away.</p><button className="secondary" onClick={()=>navigate("attendance")}>Manage attendance<ArrowRight size={16}/></button></section>}<blockquote className="daily-note"><span>“</span>A healthy smile is the best thing you can wear.<footer>— A little reminder from Pearl Dental</footer></blockquote></div></div></>}
        {view==="appointments"&&<section className="panel"><div className="panel-heading"><div><h2>All appointments</h2><p>{filteredAppointments.length} matching appointments</p></div><div className="table-filters"><input aria-label="Filter appointment date" type="date" value={appointmentDate} onChange={e=>setAppointmentDate(e.target.value)}/><select aria-label="Filter appointment status" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All statuses</option>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>{(appointmentDate||filter!=="all")&&<button className="text-link" onClick={()=>{setFilter("all");setAppointmentDate("");}}>Clear</button>}</div></div><div className="table-scroll"><table><thead><tr><th>Patient</th><th>Treatment</th><th>Doctor</th><th>Date & time</th><th>Status</th>{isAdmin&&<th>Update</th>}</tr></thead><tbody>{filteredAppointments.map((a,index)=><tr key={a.id}><td><div className="patient-cell"><Avatar name={a.patientName} index={index}/><div><strong>{a.patientName}</strong><span>{a.email}</span></div></div></td><td>{getService(a.serviceId).name}</td><td>{getProvider(a.providerId).name}</td><td className="nowrap">{dateLabel(a.date,{month:"short",day:"numeric"})}, {a.time}</td><td><Status value={a.status}/></td>{isAdmin&&<td><select aria-label={`Update status for ${a.patientName}`} value={a.status} disabled={busy} onChange={e=>void updateStatus(a.id,e.target.value as AppointmentStatus)}>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></td>}</tr>)}</tbody></table>{!filteredAppointments.length&&<Empty>No appointments match this view.</Empty>}</div></section>}
        {view==="employees"&&isAdmin&&<><div className="team-metrics"><div><span>TEAM MEMBERS</span><strong>{activeEmployees.length}</strong></div><div><span>PRESENT TODAY</span><strong>{presentCount}</strong></div><div><span>ABSENT TODAY</span><strong>{absentCount}</strong></div></div><div className="employee-grid">{activeEmployees.filter(e=>`${e.name} ${e.email} ${e.jobTitle}`.toLowerCase().includes(search)).map((employee,index)=><article className="panel employee-card" key={employee.id}><div className="employee-top"><Avatar name={employee.name} index={index}/><span className="employee-access">Employee</span></div><h2>{employee.name}</h2><p className="muted">{employee.jobTitle}</p><div className="employee-contact"><span><Mail size={15}/>{employee.email}</span><span><Phone size={15}/>{employee.phone||"No phone added"}</span></div><AttendanceBadge record={attendance.find(a=>a.userId===employee.id)}/><div className="employee-actions"><button className="secondary" onClick={()=>setEmployeeEditor(employee)}><Pencil size={14}/>Edit info</button><button className="icon-button bordered" title="Reset password" aria-label={`Reset password for ${employee.name}`} disabled={busy} onClick={()=>void resetPassword(employee)}><KeyRound size={16}/></button><button className="icon-button danger" aria-label={`Deactivate ${employee.name}`} onClick={()=>setDeactivate(employee)}><Trash2 size={16}/></button></div></article>)}</div>{!activeEmployees.length&&<section className="panel"><Empty>No employees yet. Add someone to create their account.</Empty></section>}</>}
        {view==="schedule"&&<ScheduleView today={today} appointments={appointments} schedule={schedule}/>}
        {view==="attendance"&&<AttendanceView today={today} record={myRecord} history={history} saved={()=>{void loadData();setNotice("Attendance saved.");}}/>}
        {view==="settings"&&<div className="settings-grid"><section className="panel account-panel"><ShieldCheck size={26}/><h2>Your account</h2><p className="muted">{user.name} · {user.jobTitle}</p><p>{user.email}</p><span className="employee-access">{isAdmin?"Administrator":"Employee"}</span><Link href="/account/password" className="secondary"><KeyRound size={16}/>Change password</Link></section>{isAdmin&&<HoursEditor schedule={schedule} saved={value=>{setSchedule(value);setNotice("Clinic hours saved.");}}/>}</div>}
      </div>
    </main>
    {notice&&<div className="toast" role="status"><Check size={18}/>{notice}<button aria-label="Dismiss notification" onClick={()=>setNotice("")}><X size={16}/></button></div>}
    {booking&&<BookingModal today={today} close={()=>setBooking(false)} saved={appointment=>{setAppointments(items=>[...items,appointment]);setBooking(false);setNotice("Appointment created.");}}/>}
    {employeeEditor&&<EmployeeModal employee={employeeEditor} close={()=>setEmployeeEditor(null)} saved={(employee,password)=>{setEmployees(items=>[...items.filter(e=>e.id!==employee.id),employee]);setEmployeeEditor(null);if(password)setCredentials({email:employee.email,temporaryPassword:password});setNotice("Employee account saved.");}}/>}
    {credentials&&<Modal title="Employee login is ready" description="Share these details privately with your employee. The temporary password is shown only here." close={()=>setCredentials(null)}><div className="credential-box"><label>Email address<input readOnly value={credentials.email} onFocus={e=>e.currentTarget.select()}/></label><label>Temporary password<input readOnly value={credentials.temporaryPassword} onFocus={e=>e.currentTarget.select()}/></label><p>They will choose a new password on first sign-in.</p></div><div className="modal-actions"><button className="primary" onClick={()=>setCredentials(null)}>I’ve saved the login details</button></div></Modal>}
    {deactivate&&<Modal title={`Deactivate ${deactivate.name}?`} description="They will lose access immediately. Their attendance history will be retained." close={()=>{if(!busy)setDeactivate(null);}}><div className="modal-actions"><button className="secondary" disabled={busy} onClick={()=>setDeactivate(null)}>Cancel</button><button className="danger-button" disabled={busy} onClick={async()=>{setBusy(true);try{await api(`/api/employees/${deactivate.id}`,{method:"DELETE"});setEmployees(items=>items.filter(e=>e.id!==deactivate.id));setDeactivate(null);setNotice("Employee account deactivated.");}catch(error){setError((error as Error).message);setDeactivate(null);}finally{setBusy(false);}}}>Deactivate account</button></div></Modal>}
  </div>;
}

