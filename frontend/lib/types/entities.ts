import type {
  ConferenceFormat,
  ConferenceStatus,
  PaperStatus,
  PaymentStatus,
  Recommendation,
  RegistrationStatus,
  RegistrationType,
  Role,
} from './enums';

export interface User {
  id: number;
  email: string;
  full_name: string;
  affiliation?: string;
  orcid?: string;
  phone?: string;
  position?: string;
  country?: string;
  role: Role;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
}

export interface Conference {
  id: number;
  organizer_id: number;
  title: string;
  short_name?: string;
  description?: string;
  topics?: string[];
  start_date: string;
  end_date: string;
  submission_deadline: string;
  review_deadline: string;
  location?: string;
  format: ConferenceFormat;
  status: ConferenceStatus;
  registration_fee?: number;
  submission_fee?: number;
  fee_required?: boolean;
  early_bird_fee?: number | null;
  early_bird_deadline?: string | null;
  review_mode?: string;
  moderation_comment?: string;
  moderated_by?: number;
  moderated_at?: string;
  created_at: string;
}

export interface PaperAuthor {
  id?: number;
  user_id?: number;
  full_name: string;
  affiliation?: string;
  orcid?: string;
  order: number;
  is_corresponding: boolean;
}

export interface Review {
  id: number;
  paper_id: number;
  reviewer_id: number;
  score_relevance?: number;
  score_novelty?: number;
  score_clarity?: number;
  score_methodology?: number;
  comment_for_author?: string;
  comment_for_chair?: string;
  recommendation?: Recommendation;
  submitted_at: string;
  reviewer_name?: string;
  conflict_declared?: boolean;
  paper_title?: string;
  conference_id?: number;
  conference_title?: string;
  review_deadline?: string;
}

export interface Paper {
  id: number;
  conference_id: number;
  author_id: number;
  track_id?: number | null;
  title: string;
  abstract: string;
  keywords?: string[];
  file_url?: string;
  file_name?: string;
  status: PaperStatus;
  submitted_at?: string;
  updated_at?: string;
  conference_title?: string;
  author_name?: string;
  co_authors?: PaperAuthor[];
  reviews?: Review[];
  version_count?: number;
  latest_revision_comment?: string;
  latest_revision_round?: number;
  versions?: PaperVersion[];
  revision_requests?: PaperRevisionRequest[];
  payment_pending?: boolean;
}

export interface PaperVersion {
  id: number;
  paper_id: number;
  version_number: number;
  file_url?: string;
  file_name?: string;
  title: string;
  abstract: string;
  keywords?: string[];
  submitted_at?: string;
  created_by: number;
  created_at: string;
}

export interface PaperRevisionRequest {
  id: number;
  paper_id: number;
  requested_by: number;
  requester_name?: string;
  comment: string;
  round_number: number;
  resolved_at?: string;
  created_at: string;
}

export interface ProceedingsEntry {
  id: number;
  issue_id: number;
  paper_id: number;
  doi?: string;
  pages?: string;
  order: number;
  published_title?: string;
  published_abstract?: string;
  paper_title?: string;
  paper_abstract?: string;
  paper_keywords?: string[];
  paper_file_url?: string;
  author_name?: string;
  co_authors?: PaperAuthor[];
}

export interface ProceedingsIssue {
  id: number;
  conference_id: number;
  title: string;
  description?: string;
  isbn?: string;
  doi_prefix?: string;
  is_published: boolean;
  published_at?: string;
  created_at: string;
  entries: ProceedingsEntry[];
}

export interface ProceedingsExportEntry {
  paper_id: number;
  title: string;
  abstract: string;
  keywords: string[];
  authors: string[];
  doi?: string;
  pages?: string;
}

export interface ProceedingsExport {
  conference_id: number;
  issue_title: string;
  isbn?: string;
  doi_prefix?: string;
  entries: ProceedingsExportEntry[];
}

export interface ReviewProgressSummary {
  papers_total: number;
  assignments_total: number;
  reviews_completed: number;
  reviews_pending: number;
  reviews_overdue: number;
  review_deadline: string;
}

export interface ReviewAssignmentReviewer {
  review_id: number;
  reviewer_id: number;
  reviewer_name?: string;
  reviewer_email?: string;
  recommendation?: string;
  submitted_at: string;
  updated_at?: string;
  is_completed: boolean;
  is_overdue: boolean;
}

export interface ReviewAssignment {
  paper_id: number;
  paper_title: string;
  paper_status: PaperStatus;
  author_name?: string;
  assigned_reviewers: ReviewAssignmentReviewer[];
  completed_reviews: number;
  pending_reviews: number;
  is_overdue: boolean;
}

export interface ProgramItem {
  id: number;
  session_id: number;
  paper_id?: number;
  title: string;
  authors?: string;
  start_time: string;
  end_time: string;
  order: number;
}

export interface ProgramSession {
  id: number;
  conference_id: number;
  title: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  room?: string;
  items: ProgramItem[];
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  link?: string;
  entity_type?: string;
  entity_id?: number;
  is_read: boolean;
  created_at: string;
}

export interface Registration {
  id: number;
  conference_id: number;
  user_id: number;
  registration_type: RegistrationType;
  status: RegistrationStatus;
  registered_at: string;
  user_name?: string;
  user_email?: string;
  user_country?: string;
  conference_title?: string;
  short_name?: string;
}

export interface ConferenceTrack {
  id: number;
  conference_id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface ConferenceManageAccess {
  access: 'full' | 'tracks';
  track_ids?: number[] | null;
}

export interface NotificationChannelPrefs {
  email: boolean;
  in_app: boolean;
}

export interface NotificationPreferences {
  papers: NotificationChannelPrefs;
  reviews: NotificationChannelPrefs;
  conferences: NotificationChannelPrefs;
}

export interface Payment {
  id: number;
  conference_id: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  external_id?: string;
  payment_url?: string;
  purpose?: string;
  paper_id?: number;
  registration_id?: number;
  created_at: string;
}

export interface DashboardStats {
  conferences_count: number;
  my_papers_count: number;
  pending_reviews_count: number;
  my_conferences_count: number;
  unread_notifications: number;
}
