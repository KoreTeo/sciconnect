import api from '../api';
import { downloadBlob } from '../download';

export async function fetchConferencePapersCsv(conferenceId: string | number) {
  const response = await api.get(`/papers/conference/${conferenceId}/export`, { responseType: 'blob' });
  downloadBlob(response.data, `papers_${conferenceId}.csv`);
}

export async function fetchConferenceRegistrationsCsv(conferenceId: string | number) {
  const response = await api.get(`/conferences/${conferenceId}/registrations/export`, { responseType: 'blob' });
  downloadBlob(response.data, `registrations_${conferenceId}.csv`);
}

export async function fetchConferenceReviewsCsv(conferenceId: string | number) {
  const response = await api.get(`/conference/${conferenceId}/export`, { responseType: 'blob' });
  downloadBlob(response.data, `reviews_${conferenceId}.csv`);
}

export async function fetchProceedingsCsv(conferenceId: string | number) {
  const response = await api.get(`/conferences/${conferenceId}/proceedings/export?format=csv`, {
    responseType: 'blob',
  });
  downloadBlob(response.data, `proceedings_${conferenceId}.csv`);
}
