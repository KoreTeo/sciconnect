export interface ConferenceAnalytics {
  submissions_by_day: { date: string; count: number }[];
  status_breakdown: Record<string, number>;
  reviewer_assigned: number;
  reviewer_completed: number;
  registrations_count: number;
  papers_count: number;
}

export interface AdminSummary {
  users_total: number;
  users_active: number;
  users_blocked: number;
  users_by_role: Record<string, number>;
  conferences_total: number;
  conferences_by_status: Record<string, number>;
}

export interface AdminAuditLog {
  id: number;
  actor_id: number;
  actor_email?: string;
  action: string;
  entity_type: string;
  entity_id: number;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  created_at: string;
}
