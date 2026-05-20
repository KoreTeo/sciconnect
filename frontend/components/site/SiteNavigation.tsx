'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SitePage } from '@/lib/types';
import { pageHref } from '@/lib/siteUtils';

export function SiteNavigation({ shortName, pages }: { shortName: string; pages: SitePage[] }) {
  const pathname = usePathname();
  const navPages = pages.filter((p) => p.show_in_nav);

  if (navPages.length <= 1) return null;

  return (
    <nav className="border-t border-white/15">
      <div className="mx-auto flex max-w-5xl flex-wrap gap-1 px-4 py-2 text-sm md:gap-2 md:px-8 max-md:flex-nowrap max-md:overflow-x-auto">
        {navPages.map((page) => {
          const href = pageHref(shortName, page);
          const active =
            pathname === href ||
            (href === `/c/${shortName}` && (pathname === `/c/${shortName}` || pathname === `/c/${shortName}/`));
          return (
            <Link
              key={page.id}
              href={href}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 transition ${
                active ? 'bg-white/20 font-medium text-white' : 'text-white/90 hover:bg-white/10'
              }`}
            >
              {page.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
