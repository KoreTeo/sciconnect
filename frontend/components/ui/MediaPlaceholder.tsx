type MediaPlaceholderVariant = 'banner' | 'hero' | 'card' | 'logo' | 'avatar' | 'gallery';

const VARIANT_STYLES: Record<MediaPlaceholderVariant, string> = {
  banner: 'aspect-[21/9] max-h-64 w-full',
  hero: 'aspect-[4/3] w-full',
  card: 'aspect-[16/10] w-full',
  logo: 'h-10 w-10 shrink-0',
  avatar: 'h-12 w-12 shrink-0 rounded-full',
  gallery: 'aspect-square w-full',
};

function PlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <path d="M3 16l4.5-4.5 3 3L14 11l7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MediaPlaceholder({
  variant = 'card',
  label = 'Место для фото',
  className = '',
  hideLabel = false,
}: {
  variant?: MediaPlaceholderVariant;
  label?: string;
  className?: string;
  hideLabel?: boolean;
}) {
  const isCompact = variant === 'logo' || variant === 'avatar';
  const rounded = variant === 'avatar' ? 'rounded-full' : 'rounded-xl';

  return (
    <div
      className={`flex flex-col items-center justify-center border border-dashed border-slate-300 bg-slate-50 text-slate-400 ${rounded} ${VARIANT_STYLES[variant]} ${className}`}
      role="img"
      aria-label={label}
    >
      <PlaceholderIcon className={isCompact ? 'h-4 w-4' : 'h-8 w-8'} />
      {!hideLabel && !isCompact && (
        <span className={`mt-2 text-center text-slate-500 ${variant === 'gallery' ? 'text-xs' : 'text-sm'}`}>
          {label}
        </span>
      )}
    </div>
  );
}

export function GalleryPlaceholderGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <MediaPlaceholder key={i} variant="gallery" />
      ))}
    </div>
  );
}
