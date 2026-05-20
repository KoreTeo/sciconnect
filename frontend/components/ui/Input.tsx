import React, { useId } from 'react';

type FieldChromeProps = { label?: string; error?: string; hint?: string; required?: boolean };

function FieldLabel({ id, label, required }: { id: string; label: string; required?: boolean }) {
  return (
    <span className="mb-1 block text-sm font-medium text-slate-700">
      {label}
      {required && (
        <span className="text-red-600" aria-hidden="true">
          {' '}
          *
        </span>
      )}
    </span>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & FieldChromeProps
>(function Input({ label, error, hint, required, className = '', ...props }, ref) {
  const generatedId = useId();
  const id = props.id || generatedId;
  const isRequired = Boolean(required);
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [props['aria-describedby'], hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <label className="block" htmlFor={id}>
      {label && <FieldLabel id={id} label={label} required={isRequired} />}
      <input
        {...props}
        id={id}
        ref={ref}
        required={isRequired}
        aria-required={isRequired || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        aria-errormessage={errorId}
        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500'
        } ${className}`}
      />
      {hint && !error && <span id={hintId} className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span id={errorId} className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & FieldChromeProps
>(function Textarea({ label, error, hint, required, className = '', ...props }, ref) {
  const generatedId = useId();
  const id = props.id || generatedId;
  const isRequired = Boolean(required);
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [props['aria-describedby'], hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <label className="block" htmlFor={id}>
      {label && <FieldLabel id={id} label={label} required={isRequired} />}
      <textarea
        {...props}
        id={id}
        ref={ref}
        required={isRequired}
        aria-required={isRequired || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        aria-errormessage={errorId}
        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500'
        } ${className}`}
      />
      {hint && !error && <span id={hintId} className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span id={errorId} className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & FieldChromeProps
>(function Select({ label, error, hint, required, children, className = '', ...props }, ref) {
  const generatedId = useId();
  const id = props.id || generatedId;
  const isRequired = Boolean(required);
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [props['aria-describedby'], hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <label className="block" htmlFor={id}>
      {label && <FieldLabel id={id} label={label} required={isRequired} />}
      <select
        {...props}
        id={id}
        ref={ref}
        required={isRequired}
        aria-required={isRequired || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        aria-errormessage={errorId}
        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500'
        } ${className}`}
      >
        {children}
      </select>
      {hint && !error && <span id={hintId} className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span id={errorId} className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
});

export function FormRequiredHint({ className = '' }: { className?: string }) {
  return <p className={`text-xs text-slate-500 ${className}`.trim()}>Поля, отмеченные * , обязательны для заполнения.</p>;
}
