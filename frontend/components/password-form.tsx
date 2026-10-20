"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { ClinicLogo } from "@/components/clinic-logo";
export default function PasswordForm({ required }: { required: boolean }) {
  const [error,setError]=useState(""); const [busy,setBusy]=useState(false); const [saved,setSaved]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form=new FormData(event.currentTarget);
    if(form.get("newPassword")!==form.get("confirmPassword")){setError("The new passwords do not match.");return;}
    setError("");setBusy(true);
    try{const response=await fetch("/api/account/password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({currentPassword:form.get("currentPassword"),newPassword:form.get("newPassword")})}); const data=await response.json();if(!response.ok)throw new Error(data.error);setSaved(true);await signOut({redirect:false});}
    catch(error){setError(error instanceof Error?error.message:"Please try again.");}finally{setBusy(false);}
  }
  return <main className="password-page"><div className="password-box"><ClinicLogo/><h1>{saved?"Your password is ready.":required?"Make this account yours.":"Change your password"}</h1><p className="muted">{saved?"Sign in again using your new password.":required?"Replace your temporary password before entering the workspace.":"Choose a password of at least 12 characters."}</p>
    {saved?<Link className="primary full-width" href="/staff/login">Return to sign in</Link>:<form onSubmit={submit} className="form-stack"><label>{required?"Temporary password":"Current password"}<input name="currentPassword" type="password" autoComplete="current-password" maxLength={128} required/></label><label>New password<input name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required/></label><label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required/></label>{error&&<p className="notice error" role="alert">{error}</p>}<button className="primary full-width" disabled={busy}>{busy?"Saving...":"Save password"}</button>{!required&&<Link className="text-link centered" href="/">Back to workspace</Link>}</form>}
  </div></main>;
}
