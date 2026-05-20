export const queryKeys = {
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
  },
  admin: {
    summary: ['admin', 'summary'] as const,
    users: (filters?: object) => ['admin', 'users', filters ?? {}] as const,
    conferences: (filters?: object) => ['admin', 'conferences', filters ?? {}] as const,
    auditLog: (filters?: object) => ['admin', 'audit-log', filters ?? {}] as const,
  },
  conferences: {
    lists: ['conferences', 'list'] as const,
    all: (filters?: object) => ['conferences', 'list', filters ?? {}] as const,
    detail: (id?: string | number) => ['conferences', 'detail', String(id ?? '')] as const,
    my: ['conferences', 'my'] as const,
    papers: (id?: string | number, filters?: object) =>
      ['conferences', 'manage', String(id ?? ''), 'papers', filters ?? {}] as const,
    reviewers: (id?: string | number) => ['conferences', 'manage', String(id ?? ''), 'reviewers'] as const,
    registrations: (id?: string | number) => ['conferences', 'manage', String(id ?? ''), 'registrations'] as const,
    analytics: (id?: string | number) => ['conferences', 'manage', String(id ?? ''), 'analytics'] as const,
    program: (id?: string | number) => ['conferences', 'manage', String(id ?? ''), 'program'] as const,
    site: (id?: string | number) => ['conferences', 'manage', String(id ?? ''), 'site'] as const,
    manageAccess: (id?: string | number) => ['conferences', 'manage', String(id ?? ''), 'access'] as const,
    tracks: (id?: string | number) => ['conferences', 'manage', String(id ?? ''), 'tracks'] as const,
    public: ['conferences', 'public'] as const,
    myRegistrations: ['conferences', 'my', 'registrations'] as const,
  },
  papers: {
    my: ['papers', 'my'] as const,
    detail: (id?: string | number) => ['papers', 'detail', String(id ?? '')] as const,
    revisions: (id?: string | number) => ['papers', 'revisions', String(id ?? '')] as const,
  },
  reviews: {
    my: ['reviews', 'my'] as const,
    myForPaper: (paperId?: string | number) => ['reviews', 'my', 'paper', String(paperId ?? '')] as const,
    byPaper: (paperId?: string | number) => ['reviews', 'paper', String(paperId ?? '')] as const,
    progress: (conferenceId?: string | number) => ['reviews', 'progress', String(conferenceId ?? '')] as const,
    assignments: (conferenceId?: string | number) => ['reviews', 'assignments', String(conferenceId ?? '')] as const,
  },
  payments: {
    detail: (id?: string | number) => ['payments', String(id ?? '')] as const,
  },
  proceedings: {
    conference: (conferenceId?: string | number) => ['proceedings', 'conference', String(conferenceId ?? '')] as const,
    public: (shortName?: string) => ['proceedings', 'public', shortName ?? ''] as const,
    export: (conferenceId?: string | number) => ['proceedings', 'export', String(conferenceId ?? '')] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unread: ['notifications', 'unread'] as const,
  },
};
