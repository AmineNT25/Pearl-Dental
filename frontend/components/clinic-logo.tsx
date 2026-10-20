export function ClinicLogo({ compact = false }: { compact?: boolean }) {
  return <span className="clinic-logo"><span className="logo-symbol"><svg width="25" height="28" viewBox="0 0 30 32" fill="none" aria-hidden="true"><path d="M15 5C11 1 3 2 3 10c0 5 3 7 4 12 1 5 2 8 4 7 2-1 1-9 4-9s2 8 4 9c2 1 3-2 4-7 1-5 4-7 4-12 0-8-8-9-12-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M11 5c2 0 3 1 5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></span>{!compact && <strong>Pearl Dental</strong>}</span>;
}
