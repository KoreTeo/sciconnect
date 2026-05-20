'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import {
  useAdminAuditLog,
  useAdminConferences,
  useAdminSummary,
  useAdminUsers,
  useModerateConference,
  useUpdateAdminConference,
  useUpdateAdminUser,
} from '@/lib/queries';
import { getApiErrorMessage } from '@/lib/errors';

export type AdminSection = 'overview' | 'users' | 'conferences' | 'audit';

export function useAdminDashboardState() {
  const [section, setSection] = useState<AdminSection>('overview');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [skip, setSkip] = useState(0);
  const [conferenceSearch, setConferenceSearch] = useState('');
  const [conferenceStatus, setConferenceStatus] = useState('');
  const [conferenceSkip, setConferenceSkip] = useState(0);
  const [auditEntityType, setAuditEntityType] = useState('');
  const [moderationDialog, setModerationDialog] = useState<{ id: number; action: 'request_changes' | 'reject' } | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const deferredSearch = useDeferredValue(search);
  const deferredConferenceSearch = useDeferredValue(conferenceSearch);

  const userFilters = useMemo(
    () => ({
      q: deferredSearch || undefined,
      role: role || undefined,
      is_active: activeFilter === '' ? undefined : activeFilter === 'active',
      skip,
      limit: 50,
    }),
    [activeFilter, deferredSearch, role, skip]
  );
  const conferenceFilters = useMemo(
    () => ({
      q: deferredConferenceSearch || undefined,
      status: conferenceStatus || undefined,
      skip: conferenceSkip,
      limit: 50,
    }),
    [conferenceSkip, conferenceStatus, deferredConferenceSearch]
  );
  const moderationFilters = useMemo(() => ({ status: 'pending_approval', limit: 20 }), []);
  const auditFilters = useMemo(
    () => ({
      entity_type: auditEntityType || undefined,
      limit: 10,
    }),
    [auditEntityType]
  );

  const summaryQuery = useAdminSummary();
  const usersQuery = useAdminUsers(userFilters, section === 'users');
  const conferencesQuery = useAdminConferences(conferenceFilters, section === 'conferences');
  const moderationQueueQuery = useAdminConferences(moderationFilters, section === 'overview');
  const auditLogQuery = useAdminAuditLog(auditFilters, section === 'audit');
  const updateUserMutation = useUpdateAdminUser(userFilters);
  const updateConferenceMutation = useUpdateAdminConference(conferenceFilters);
  const moderateConferenceMutation = useModerateConference(moderationFilters);

  const users = usersQuery.data || [];
  const conferences = conferencesQuery.data || [];
  const moderationQueue = moderationQueueQuery.data || [];
  const summary = summaryQuery.data;
  const isMutating = updateUserMutation.isPending || updateConferenceMutation.isPending || moderateConferenceMutation.isPending;

  const runAction = async (action: () => Promise<unknown>, success: string) => {
    setError('');
    setMessage('');
    try {
      await action();
      setMessage(success);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось выполнить действие'));
    }
  };

  const sectionLoading =
    (section === 'users' && usersQuery.isLoading && users.length === 0) ||
    (section === 'conferences' && conferencesQuery.isLoading && conferences.length === 0) ||
    (section === 'audit' && auditLogQuery.isLoading) ||
    (section === 'overview' && moderationQueueQuery.isLoading && moderationQueue.length === 0);

  return {
    section,
    setSection,
    search,
    setSearch,
    role,
    setRole,
    activeFilter,
    setActiveFilter,
    skip,
    setSkip,
    conferenceSearch,
    setConferenceSearch,
    conferenceStatus,
    setConferenceStatus,
    conferenceSkip,
    setConferenceSkip,
    auditEntityType,
    setAuditEntityType,
    moderationDialog,
    setModerationDialog,
    message,
    error,
    setError,
    summaryQuery,
    usersQuery,
    conferencesQuery,
    moderationQueueQuery,
    auditLogQuery,
    updateUserMutation,
    updateConferenceMutation,
    moderateConferenceMutation,
    users,
    conferences,
    moderationQueue,
    summary,
    isMutating,
    runAction,
    sectionLoading,
  };
}
