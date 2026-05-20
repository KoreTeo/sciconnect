type IconProps = { className?: string };

export function IconFrame({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 ${className}`}
    >
      {children}
    </div>
  );
}

export function IconRegistration({ className = 'h-14 w-14 text-brand-600' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="12" y="8" width="40" height="48" rx="6" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="32" cy="26" r="8" stroke="currentColor" strokeWidth="2.5" />
      <path d="M20 46c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M44 20h8M48 16v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconPaperSubmit({ className = 'h-14 w-14 text-brand-600' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M18 8h22l12 12v36a4 4 0 01-4 4H18a4 4 0 01-4-4V12a4 4 0 014-4z" stroke="currentColor" strokeWidth="2.5" />
      <path d="M40 8v12h12" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M22 32h20M22 40h14M22 48h18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M44 44l6 6 10-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconReview({ className = 'h-14 w-14 text-brand-600' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="10" y="14" width="44" height="36" rx="4" stroke="currentColor" strokeWidth="2.5" />
      <path d="M18 26h20M18 34h28M18 42h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="46" cy="22" r="10" fill="#dbeafe" stroke="currentColor" strokeWidth="2.5" />
      <path d="M42 22l3 3 6-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPublish({ className = 'h-14 w-14 text-brand-600' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="8" y="20" width="48" height="32" rx="4" stroke="currentColor" strokeWidth="2.5" />
      <path d="M8 28h48" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="16" cy="24" r="2" fill="currentColor" />
      <circle cx="24" cy="24" r="2" fill="currentColor" />
      <path d="M16 38h20M16 44h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M44 12l4 4-12 12-6 2 2-6 12-12z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSiteProgram({ className = 'h-14 w-14 text-brand-600' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="8" y="12" width="48" height="40" rx="4" stroke="currentColor" strokeWidth="2.5" />
      <path d="M8 22h48M22 12v40" stroke="currentColor" strokeWidth="2.5" />
      <rect x="28" y="28" width="8" height="8" rx="1" fill="#93c5fd" stroke="currentColor" strokeWidth="1.5" />
      <rect x="40" y="32" width="8" height="12" rx="1" fill="#dbeafe" stroke="currentColor" strokeWidth="1.5" />
      <rect x="28" y="40" width="8" height="8" rx="1" fill="#dbeafe" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function IconParticipant({ className = 'h-14 w-14 text-brand-600' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="22" r="10" stroke="currentColor" strokeWidth="2.5" />
      <path d="M14 52c0-9.941 8.059-18 18-18s18 8.059 18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M44 28l8-4v12l-8-4" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

export function IconOrganizer({ className = 'h-14 w-14 text-brand-600' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="10" y="16" width="44" height="32" rx="4" stroke="currentColor" strokeWidth="2.5" />
      <path d="M10 26h44" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="20" cy="21" r="2" fill="currentColor" />
      <circle cx="28" cy="21" r="2" fill="currentColor" />
      <path d="M18 36h12v10H18zM34 32h12v14H34z" fill="#dbeafe" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function IconReviewerRole({ className = 'h-14 w-14 text-brand-600' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M14 12h28l8 8v32a4 4 0 01-4 4H14a4 4 0 01-4-4V16a4 4 0 014-4z" stroke="currentColor" strokeWidth="2.5" />
      <path d="M42 12v8h8" stroke="currentColor" strokeWidth="2.5" />
      <path d="M20 30h24M20 38h18M20 46h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M38 42l4 4 8-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
