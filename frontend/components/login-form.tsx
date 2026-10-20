"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { ClinicLogo } from "@/components/clinic-logo";
export default function LoginForm({ configured }: { configured: boolean }) {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setError("");
    try {
      const result = await signIn("credentials", { email: form.get("email"), password: form.get("password"), redirect: false, callbackUrl: "/" });
      if (!result || result.error) setError(result?.error === "CredentialsSignin" ? "Check your email and password. After several failed attempts, wait 15 minutes before trying again." : "Sign-in is unavailable. Please check the clinic database connection.");
      else window.location.assign("/");
    } catch { setError("We could not connect. Please try again."); } finally { setBusy(false); }
  }
  return <main className="login-layout"><aside className="login-story"><ClinicLogo/><div><span className="eyebrow">YOUR CLINIC, CONNECTED</span><h1>A little more calm.<br/>A lot more care.</h1><p>One place for your team, appointments, and the day ahead.</p><div className="login-art" aria-hidden="true"><span/><span/><ClinicLogo compact/></div></div><p className="story-footer">Thoughtful care starts with an organized team.</p></aside>
    <section className="login-main"><div className="login-box"><span className="login-lock"><LockKeyhole size={25}/></span><span className="eyebrow">PEARL DENTAL WORKSPACE</span><h2>Welcome back.</h2><p className="muted">Sign in to start your day at the clinic.</p>
      {!configured && <div className="notice warning">The clinic is awaiting its database connection. Sign-in will be available once setup is complete.</div>}
      <form onSubmit={submit} className="form-stack"><label>Email address<input name="email" type="email" autoComplete="username" required maxLength={254} placeholder="you@clinic.com"/></label><label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={128} placeholder="Enter your password"/></label>{error&&<p className="notice error" role="alert">{error}</p>}<button className="primary full-width" disabled={busy||!configured}>{busy?"Signing in...":"Sign in"}<ArrowRight size={17}/></button></form>
      <p className="login-help">New to the team? Your administrator will provide your account details.</p><div className="secure-label"><ShieldCheck size={15}/>Secure access for admins and employees</div>
    </div></section></main>;
}
