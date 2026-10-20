import nodemailer from "nodemailer";
import type { Appointment } from "@/lib/types";
import { getProvider, getService } from "@/lib/data";

export async function notifyAppointmentCreated(appointment: Appointment) {
  const message = `Appointment request for ${appointment.patientName}: ${getService(appointment.serviceId).name} with ${getProvider(appointment.providerId).name} on ${appointment.date} at ${appointment.time}.`;
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: Number(process.env.SMTP_PORT) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
    await transporter.sendMail({ from: process.env.SMTP_FROM, to: appointment.email, subject: "Pearl Dental appointment request", text: message });
  }
  if (process.env.WHATSAPP_WEBHOOK_URL) {
    await fetch(process.env.WHATSAPP_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ appointment, message }) });
  }
}
