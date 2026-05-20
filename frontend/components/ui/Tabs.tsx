'use client';

import { useId, useRef } from 'react';

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  const groupId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.id === active));

  const focusTab = (index: number) => {
    const nextIndex = (index + tabs.length) % tabs.length;
    onChange(tabs[nextIndex].id);
    requestAnimationFrame(() => tabRefs.current[nextIndex]?.focus());
  };

  return (
    <div className="mb-6 flex gap-1 border-b border-slate-200" role="tablist" aria-label="Разделы страницы">
      {tabs.map((t, index) => (
        <button
          key={t.id}
          ref={(node) => {
            tabRefs.current[index] = node;
          }}
          id={`${groupId}-${t.id}-tab`}
          role="tab"
          aria-selected={active === t.id}
          aria-controls={`${groupId}-${t.id}-panel`}
          tabIndex={active === t.id ? 0 : -1}
          type="button"
          onClick={() => onChange(t.id)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              focusTab(activeIndex + 1);
            } else if (event.key === 'ArrowLeft') {
              event.preventDefault();
              focusTab(activeIndex - 1);
            } else if (event.key === 'Home') {
              event.preventDefault();
              focusTab(0);
            } else if (event.key === 'End') {
              event.preventDefault();
              focusTab(tabs.length - 1);
            }
          }}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
            active === t.id
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
