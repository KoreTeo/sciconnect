export type Role = 'user' | 'reviewer' | 'organizer' | 'admin';
export type ConferenceFormat = 'offline' | 'online' | 'hybrid';
export type ConferenceStatus =
  | 'draft'
  | 'pending_approval'
  | 'submission_open'
  | 'reviewing'
  | 'programming'
  | 'completed'
  | 'rejected';
export type PaperStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'revision_required';
export type Recommendation = 'accept' | 'minor_revision' | 'major_revision' | 'reject';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type RegistrationType = 'listener' | 'author';
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled';

