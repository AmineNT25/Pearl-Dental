"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Clock3, LayoutDashboard, MapPin, Mail, Phone, Plus, RotateCcw, Save, Search, Settings2, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { defaultSchedule, getProvider, getService, providers, scheduleDays, services } from "@/lib/data";
import type { Appointment, AppointmentStatus, Schedule, Slot } from "@/lib/types";

type View = "booking" | "staff" | "patients" | "schedule";
const statusLabels: Record<AppointmentStatus, string> = { pending: "Pending", confirmed: "Confirmed", checked_in: "Checked in", complete: "Complete", cancelled: "Cancelled" };
const today = () => new Date().toISOString().slice(0, 10);
const displayDate = (value: string) => value ? new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date(`${value}T00:00:00`)) : "Select a date";
const statusClass: Record<AppointmentStatus, string> = { pending: "border-amber-200 bg-amber-50 text-amber-800", confirmed: "border-emerald-200 bg-emerald-50 text-emerald-800", checked_in: "border-sky-200 bg-sky-50 text-sky-800", complete: "border-violet-200 bg-violet-50 text-violet-800", cancelled: "border-rose-200 bg-rose-50 text-rose-800" };

export default function Dashboard() {
  const [view, setView] = useState<View>("booking");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [schedule, setSchedule] = useState<Schedule>(defaultSchedule);
  const [date, setDate] = useState("");
  const [serviceId, setServiceId] = useState(services[0].id);
  const [providerId, setProviderId] = useState(providers[0].id);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [patientSearch, setPatientSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    const [appointmentResponse, scheduleResponse] = await Promise.all([fetch("/api/appointments"), fetch("/api/schedule")]);
    const appointmentData = await appointmentResponse.json();
    const scheduleData = await scheduleResponse.json();
    setAppointments(appointmentData.appointments ?? []);
    setSchedule(scheduleData.schedule ?? defaultSchedule);
    setLoading(false);
  };

  useEffect(() => { setDate(today()); void loadData(); }, []);
  useEffect(() => {
    if (!date) return;
    setSelectedSlot("");
    void fetch(`/api/slots?date=${date}&providerId=${providerId}&serviceId=${serviceId}`).then((response) => response.json()).then((data) => setSlots(data.slots ?? []));
  }, [date, providerId, serviceId, appointments]);

  const metrics = useMemo(() => ({ today: appointments.filter((item) => item.date === date && item.status !== "cancelled").length, pending: appointments.filter((item) => item.status === "pending").length, confirmed: appointments.filter((item) => item.status === "confirmed").length, patients: new Set(appointments.map((item) => item.email)).size }), [appointments, date]);
  const filteredAppointments = useMemo(() => appointments.filter((item) => statusFilter === "all" || item.status === statusFilter).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)), [appointments, statusFilter]);
  const patients = useMemo(() => Array.from(new Map(appointments.map((item) => [item.email, item])).values()).filter((item) => `${item.patientName} ${item.phone} ${item.email}`.toLowerCase().includes(patientSearch.toLowerCase())), [appointments, patientSearch]);

  const showNotice = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 3200); };
  const updateStatus = async (id: string, status: AppointmentStatus) => { const response = await fetch(`/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); if (response.ok) { setAppointments((items) => items.map((item) => item.id === id ? { ...item, status } : item)); showNotice("Appointment status updated."); } };
  const submitBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (!selectedSlot) return showNotice("Choose an available time slot first.");
    const response = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patientName: form.get("patientName"), phone: form.get("phone"), email: form.get("email"), serviceId, providerId, date, time: selectedSlot, notes: form.get("notes") || "" }) });
    const data = await response.json();
    if (!response.ok) return showNotice(data.error ?? "We could not save this appointment.");
    setAppointments((items) => [...items, data.appointment]);
    setSelectedSlot("");
    formElement.reset();
    showNotice("Appointment request saved and confirmation queued.");
  };
  const saveSchedule = async (event: React.FormEvent) => { event.preventDefault(); const response = await fetch("/api/schedule", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(schedule) }); if (response.ok) showNotice("Weekly schedule saved."); };
  const updateDay = (day: string, key: string, value: string | boolean) => setSchedule((current) => ({ ...current, [day]: { ...current[day], [key]: value } }));

  return <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
    <aside className="border-b border-line bg-white p-5 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-md bg-ink text-sm font-black text-white">PD</div><div><p className="font-bold text-ink">Pearl Dental</p><p className="text-xs text-muted">Care workspace</p></div></div>
      <nav className="mt-8 grid grid-cols-4 gap-1 lg:grid-cols-1" aria-label="Workspace views">{([ ["booking", "Book", Plus], ["staff", "Staff", LayoutDashboard], ["patients", "Patients", Users], ["schedule", "Schedule", Settings2] ] as const).map(([key, label, Icon]) => <button key={key} type="button" onClick={() => setView(key)} className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold lg:justify-start ${view === key ? "bg-brand-soft text-brand-dark" : "text-muted hover:bg-surface"}`}><Icon size={16} />{label}</button>)}</nav>
      <div className="mt-8 hidden rounded-md border border-line bg-surface p-3 lg:block"><img src="/assets/clinic-room.svg" alt="Modern dental treatment room" className="mb-3 w-full rounded-md" /><p className="text-sm font-bold text-ink">Open care slots</p><p className="text-xs text-muted">{slots.filter((slot) => slot.available).length} available for {displayDate(date)}</p></div>
      <div className="mt-8 hidden items-center gap-2 text-xs text-muted lg:flex"><MapPin size={14} /> 14 Pearl Avenue, Casablanca</div>
    </aside>
    <main className="min-w-0 p-5 sm:p-8">
      <header className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="mb-1 text-xs font-bold uppercase text-brand">Dental clinic appointment system</p><h1 className="text-2xl font-black tracking-tight text-ink sm:text-4xl">Patient care, calmly organized.</h1><p className="mt-2 max-w-2xl text-sm text-muted">Book visits, keep the team aligned, and give every patient a clear next step.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void loadData()}><RotateCcw size={16} />Refresh</Button><Button onClick={() => setView("booking")}><Plus size={16} />New booking</Button></div></header>
      <section className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Clinic snapshot">{[["Today", metrics.today, "appointments"], ["Pending", metrics.pending, "need review"], ["Confirmed", metrics.confirmed, "ready visits"], ["Patients", metrics.patients, "in directory"]].map(([label, value, helper]) => <Card key={String(label)} className="shadow-none"><CardContent className="p-4"><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-1 text-2xl font-black text-ink">{value}</p><p className="text-xs text-muted">{helper}</p></CardContent></Card>)}</section>
      {view === "booking" && <BookingView date={date} setDate={setDate} serviceId={serviceId} setServiceId={setServiceId} providerId={providerId} setProviderId={setProviderId} slots={slots} selectedSlot={selectedSlot} setSelectedSlot={setSelectedSlot} submitBooking={submitBooking} />}
      {view === "staff" && <StaffView appointments={filteredAppointments} filter={statusFilter} setFilter={setStatusFilter} updateStatus={updateStatus} loading={loading} />}
      {view === "patients" && <PatientsView patients={patients} search={patientSearch} setSearch={setPatientSearch} />}
      {view === "schedule" && <ScheduleView schedule={schedule} updateDay={updateDay} saveSchedule={saveSchedule} reset={() => setSchedule(defaultSchedule)} />}
      <section className="mt-8 grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><Card><CardHeader><CardTitle>Visit with confidence</CardTitle><CardDescription>Local care, clear communication, and appointments that fit your day.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><div className="rounded-md bg-brand-soft p-4"><Check className="mb-3 text-brand" size={20} /><p className="text-sm font-bold">Thoughtful care</p><p className="mt-1 text-xs text-muted">Preventive, restorative, and urgent dental support.</p></div><div className="rounded-md bg-teal/10 p-4"><Clock3 className="mb-3 text-teal" size={20} /><p className="text-sm font-bold">Flexible hours</p><p className="mt-1 text-xs text-muted">Choose a live slot around the clinic&apos;s weekly schedule.</p></div></CardContent></Card><Card className="overflow-hidden"><iframe title="Pearl Dental Clinic location" className="h-56 w-full border-0" loading="lazy" src="https://www.google.com/maps?q=Casablanca%20Morocco&output=embed" /><CardContent className="flex items-center gap-2 p-4 text-sm"><MapPin size={16} className="text-brand" /><span>14 Pearl Avenue, Casablanca</span></CardContent></Card></section>
      {notice && <div role="status" className="fixed bottom-5 right-5 z-20 flex max-w-sm items-center gap-3 rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white shadow-lg"><Check size={16} className="text-emerald-300" />{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={16} /></button></div>}
    </main>
  </div>;
}

function BookingView({ date, setDate, serviceId, setServiceId, providerId, setProviderId, slots, selectedSlot, setSelectedSlot, submitBooking }: { date: string; setDate: (v: string) => void; serviceId: string; setServiceId: (v: string) => void; providerId: string; setProviderId: (v: string) => void; slots: Slot[]; selectedSlot: string; setSelectedSlot: (v: string) => void; submitBooking: (e: React.FormEvent<HTMLFormElement>) => void }) {
  return <section><div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase text-brand">Patient intake</p><h2 className="text-xl font-black text-ink">Book an appointment</h2></div><p className="text-sm text-muted">{selectedSlot ? `${displayDate(date)} at ${selectedSlot}` : "Choose a service, provider, date, and time."}</p></div><div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]"><Card><CardHeader><CardTitle>Patient details</CardTitle><CardDescription>Requests are saved as pending until a staff member confirms them.</CardDescription></CardHeader><CardContent><form onSubmit={submitBooking} className="grid gap-4 sm:grid-cols-2"><Label>Patient name<Input name="patientName" autoComplete="name" required placeholder="Mina Roberts" /></Label><Label>Phone<Input name="phone" type="tel" autoComplete="tel" required placeholder="(555) 010-3822" /></Label><Label>Email<Input name="email" type="email" autoComplete="email" required placeholder="mina@example.com" /></Label><Label>Service<Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>{services.map((service) => <option key={service.id} value={service.id}>{service.name} · {service.price}</option>)}</Select></Label><Label>Provider<Select value={providerId} onChange={(e) => setProviderId(e.target.value)}>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</Select></Label><Label>Date<Input type="date" min={today()} value={date} onChange={(e) => setDate(e.target.value)} required /></Label><Label className="sm:col-span-2">Visit notes<Textarea name="notes" placeholder="Sensitivity, insurance note, preferred follow-up..." /></Label><Button type="submit" className="sm:col-span-2"><Check size={16} />Request appointment</Button></form></CardContent></Card><Card><CardHeader className="flex-row items-start justify-between"><div><CardTitle>Open time slots</CardTitle><CardDescription>{displayDate(date)} · {getService(serviceId).duration} minutes</CardDescription></div><Badge className="border-brand/20 bg-brand-soft text-brand-dark">{slots.filter((slot) => slot.available).length} open</Badge></CardHeader><CardContent><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2">{slots.length ? slots.map((slot) => <button key={slot.time} type="button" disabled={!slot.available} onClick={() => setSelectedSlot(slot.time)} className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${!slot.available ? "cursor-not-allowed border-line bg-surface text-muted/50 line-through" : selectedSlot === slot.time ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand hover:text-brand"}`}>{slot.time}</button>) : <p className="col-span-full rounded-md bg-surface p-4 text-sm text-muted">This day is closed. Choose another date.</p>}</div></CardContent></Card></div></section>;
}

function StaffView({ appointments, filter, setFilter, updateStatus, loading }: { appointments: Appointment[]; filter: string; setFilter: (v: string) => void; updateStatus: (id: string, status: AppointmentStatus) => void; loading: boolean }) {
  return <section><div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase text-brand">Operations</p><h2 className="text-xl font-black text-ink">Staff dashboard</h2></div><Label className="sm:max-w-44">Status<Select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All appointments</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></Label></div><Card><CardContent className="p-0">{loading ? <p className="p-5 text-sm text-muted">Loading appointments...</p> : appointments.length ? <div className="divide-y divide-line">{appointments.map((appointment) => <div key={appointment.id} className="grid gap-3 p-5 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center"><div><p className="font-bold text-ink">{appointment.patientName}</p><p className="text-xs text-muted">{getService(appointment.serviceId).name} · {getProvider(appointment.providerId).name}</p></div><div className="text-sm"><p className="font-semibold">{displayDate(appointment.date)} at {appointment.time}</p><p className="text-xs text-muted">{appointment.phone}</p></div><div className="flex items-center gap-2"><Badge className={statusClass[appointment.status]}>{statusLabels[appointment.status]}</Badge></div><Select value={appointment.status} onChange={(e) => updateStatus(appointment.id, e.target.value as AppointmentStatus)} className="md:w-36">{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></div>)}</div> : <p className="p-5 text-sm text-muted">No appointments match this filter.</p>}</CardContent></Card></section>;
}

function PatientsView({ patients, search, setSearch }: { patients: Appointment[]; search: string; setSearch: (v: string) => void }) {
  return <section><div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase text-brand">Contacts</p><h2 className="text-xl font-black text-ink">Patient directory</h2></div><div className="relative sm:w-64"><Search className="absolute left-3 top-3 text-muted" size={16} /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, phone, email" className="pl-9" aria-label="Search patients" /></div></div><Card><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b border-line bg-surface text-xs uppercase text-muted"><tr><th className="p-4 font-bold">Patient</th><th className="p-4 font-bold">Contact</th><th className="p-4 font-bold">Last visit</th><th className="p-4 font-bold">Status</th></tr></thead><tbody className="divide-y divide-line">{patients.map((patient) => <tr key={patient.email}><td className="p-4 font-bold text-ink">{patient.patientName}</td><td className="p-4 text-muted"><span className="flex items-center gap-2"><Mail size={14} />{patient.email}</span><span className="mt-1 flex items-center gap-2"><Phone size={14} />{patient.phone}</span></td><td className="p-4 text-muted">{displayDate(patient.date)}</td><td className="p-4"><Badge className={statusClass[patient.status]}>{statusLabels[patient.status]}</Badge></td></tr>)}</tbody></table>{!patients.length && <p className="p-5 text-sm text-muted">No patients match your search.</p>}</CardContent></Card></section>;
}

function ScheduleView({ schedule, updateDay, saveSchedule, reset }: { schedule: Schedule; updateDay: (day: string, key: string, value: string | boolean) => void; saveSchedule: (e: React.FormEvent) => void; reset: () => void }) {
  return <section><div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase text-brand">Weekly hours</p><h2 className="text-xl font-black text-ink">Schedule management</h2></div><Button variant="outline" onClick={reset}><RotateCcw size={16} />Reset hours</Button></div><Card><CardContent className="p-4 sm:p-5"><form onSubmit={saveSchedule} className="grid gap-3">{scheduleDays.map((day) => <div key={day} className="grid gap-3 rounded-md border border-line p-4 md:grid-cols-[150px_repeat(4,minmax(100px,1fr))] md:items-end"><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={schedule[day]?.enabled} onChange={(e) => updateDay(day, "enabled", e.target.checked)} />{day}</label>{([["open", "Open"], ["close", "Close"], ["breakStart", "Break starts"], ["breakEnd", "Break ends"]] as const).map(([key, label]) => <Label key={key}>{label}<Input type="time" value={schedule[day]?.[key]} disabled={!schedule[day]?.enabled} onChange={(e) => updateDay(day, key, e.target.value)} /></Label>)}</div>)}<Button type="submit" className="mt-2 w-full sm:w-auto"><Save size={16} />Save weekly schedule</Button></form></CardContent></Card></section>;
}
