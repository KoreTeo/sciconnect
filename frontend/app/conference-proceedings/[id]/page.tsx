'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useConference, useConferencePapers } from '@/lib/queries';
import { useProceedingsEditor } from '@/hooks/useProceedingsEditor';
import { AcceptedPapersList } from '@/components/proceedings/AcceptedPapersList';
import { ProceedingsEntriesEditor } from '@/components/proceedings/ProceedingsEntriesEditor';
import { ProceedingsExportCard } from '@/components/proceedings/ProceedingsExportCard';
import { ProceedingsMetadataForm } from '@/components/proceedings/ProceedingsMetadataForm';
import { ProceedingsStatusCard } from '@/components/proceedings/ProceedingsStatusCard';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { QueryState } from '@/components/ui/QueryState';

function ConferenceProceedingsContent() {
  const { id } = useParams();
  const conferenceId = id as string;
  const confQuery = useConference(conferenceId);
  const papersQuery = useConferencePapers(conferenceId, { status: 'accepted' });
  const editor = useProceedingsEditor(conferenceId);

  const conf = confQuery.data;
  const papers = papersQuery.data || [];
  const issue = editor.issue;
  const entryPaperIds = new Set(issue?.entries.map((entry) => entry.paper_id) || []);
  const availablePapers = papers.filter((paper) => !entryPaperIds.has(paper.id));

  return (
    <QueryState
      loading={confQuery.isLoading || papersQuery.isLoading || editor.proceedingsQuery.isLoading}
      error={confQuery.error || papersQuery.error || editor.proceedingsQuery.error}
    >
      <PageHeader
        title={conf ? `Сборник: ${conf.title}` : 'Сборник'}
        breadcrumbs={[{ label: 'Управление', href: `/conference-manage/${conferenceId}` }, { label: 'Сборник' }]}
        action={
          <Link href={`/conference-manage/${conferenceId}`}>
            <Button variant="ghost">К управлению</Button>
          </Link>
        }
      />

      {editor.showSuccess && <Alert variant="success" className="mb-4">Сборник обновлён</Alert>}

      {!issue ? (
        <Alert variant="info">Сборник для этой конференции пока пуст или ещё загружается.</Alert>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-1">
            <ProceedingsStatusCard
              issue={issue}
              onPublish={() => editor.publish.mutate()}
              onUnpublish={() => editor.unpublish.mutate()}
            />
            <ProceedingsMetadataForm issue={issue} saving={editor.updateIssue.isPending} onSave={editor.saveIssue} />
            <ProceedingsExportCard conferenceId={conferenceId} entriesCount={issue.entries.length} />
          </section>

          <section className="space-y-6 lg:col-span-2">
            <AcceptedPapersList
              papers={availablePapers}
              adding={editor.addEntry.isPending}
              onAdd={(paperId) => editor.addEntry.mutate(paperId)}
            />
            <ProceedingsEntriesEditor
              issue={issue}
              saving={editor.updateEntry.isPending}
              onSave={editor.saveEntry}
              onRemove={(entryId) => editor.removeEntry.mutate(entryId)}
            />
          </section>
        </div>
      )}
    </QueryState>
  );
}

export default function ConferenceProceedingsPage() {
  return (
    <RequireAuth roles={['organizer', 'admin']}>
      <ConferenceProceedingsContent />
    </RequireAuth>
  );
}
