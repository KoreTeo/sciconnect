'use client';

import { useAdminDashboardState } from '@/hooks/useAdminDashboardState';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { Tabs } from '@/components/ui/Tabs';
import { AdminMetrics } from '@/components/admin/AdminMetrics';
import { AdminModerationSection } from '@/components/admin/AdminModerationSection';
import { AdminUsersSection } from '@/components/admin/AdminUsersSection';
import { AdminConferencesSection } from '@/components/admin/AdminConferencesSection';
import { AdminAuditSection } from '@/components/admin/AdminAuditSection';

function AdminContent() {
  const state = useAdminDashboardState();

  if (state.sectionLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <PageHeader title="Администрирование" description="Управление пользователями и конференциями" />
      {state.error && (
        <Alert variant="error" className="mb-4">
          {state.error}
        </Alert>
      )}
      {state.message && (
        <Alert variant="success" className="mb-4">
          {state.message}
        </Alert>
      )}

      <AdminMetrics summary={state.summary} loading={state.summaryQuery.isLoading} />

      <Tabs
        tabs={[
          { id: 'overview', label: 'Обзор' },
          { id: 'users', label: 'Пользователи' },
          { id: 'conferences', label: 'Конференции' },
          { id: 'audit', label: 'Аудит' },
        ]}
        active={state.section}
        onChange={(next) => state.setSection(next as typeof state.section)}
      />

      {state.section === 'overview' && (
        <AdminModerationSection
          queue={state.moderationQueue}
          loading={state.moderationQueueQuery.isLoading}
          isMutating={state.isMutating}
          moderationDialog={state.moderationDialog}
          onModerationDialogChange={state.setModerationDialog}
          onApprove={(id) =>
            state.runAction(
              () => state.moderateConferenceMutation.mutateAsync({ id, payload: { action: 'approve' } }),
              'Конференция одобрена'
            )
          }
          onModerate={(id, action, comment) =>
            state.runAction(
              () => state.moderateConferenceMutation.mutateAsync({ id, payload: { action, comment } }),
              action === 'request_changes' ? 'Конференция возвращена на доработку' : 'Конференция отклонена'
            )
          }
          onError={state.setError}
        />
      )}

      {state.section === 'users' && (
        <AdminUsersSection
          users={state.users}
          search={state.search}
          role={state.role}
          activeFilter={state.activeFilter}
          skip={state.skip}
          isMutating={state.isMutating}
          onSearchChange={(value) => {
            state.setSkip(0);
            state.setSearch(value);
          }}
          onRoleChange={(value) => {
            state.setSkip(0);
            state.setRole(value);
          }}
          onActiveFilterChange={(value) => {
            state.setSkip(0);
            state.setActiveFilter(value);
          }}
          onSkipChange={state.setSkip}
          onUpdateUser={(id, patch) =>
            state.runAction(
              () => state.updateUserMutation.mutateAsync({ id, patch }),
              patch.role !== undefined ? 'Роль пользователя обновлена' : patch.is_active ? 'Пользователь активирован' : 'Пользователь заблокирован'
            )
          }
        />
      )}

      {state.section === 'conferences' && (
        <AdminConferencesSection
          conferences={state.conferences}
          search={state.conferenceSearch}
          status={state.conferenceStatus}
          skip={state.conferenceSkip}
          isMutating={state.isMutating}
          onSearchChange={(value) => {
            state.setConferenceSkip(0);
            state.setConferenceSearch(value);
          }}
          onStatusChange={(value) => {
            state.setConferenceSkip(0);
            state.setConferenceStatus(value);
          }}
          onSkipChange={state.setConferenceSkip}
          onUpdateConference={(id, patch) =>
            state.runAction(() => state.updateConferenceMutation.mutateAsync({ id, patch }), 'Статус конференции обновлён')
          }
        />
      )}

      {state.section === 'audit' && (
        <AdminAuditSection
          entries={state.auditLogQuery.data || []}
          loading={state.auditLogQuery.isLoading}
          entityType={state.auditEntityType}
          onEntityTypeChange={state.setAuditEntityType}
        />
      )}
    </>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth roles={['admin']}>
      <AdminContent />
    </RequireAuth>
  );
}
