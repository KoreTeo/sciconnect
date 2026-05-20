import type { User } from '@/lib/types';

export type RegistrationType = 'listener' | 'author';

export function isProfileReadyForConferenceRegistration(user: User | null): {
  ready: boolean;
  missingEmailVerification: boolean;
  missingAffiliation: boolean;
} {
  if (!user) {
    return { ready: false, missingEmailVerification: true, missingAffiliation: true };
  }
  const missingEmailVerification = !user.email_verified;
  const missingAffiliation = !user.affiliation?.trim();
  return {
    ready: !missingEmailVerification && !missingAffiliation,
    missingEmailVerification,
    missingAffiliation,
  };
}

export interface ConferenceRegistrationPayload {
  registrationType: RegistrationType;
  acceptTerms: boolean;
  promoCode?: string;
}

export function effectiveRegistrationFee(conference: {
  registration_fee?: number;
  early_bird_fee?: number | null;
  early_bird_deadline?: string | null;
}): number {
  const now = Date.now();
  if (conference.early_bird_deadline && conference.early_bird_fee != null) {
    const deadline = new Date(conference.early_bird_deadline).getTime();
    if (!Number.isNaN(deadline) && now < deadline) {
      return Number(conference.early_bird_fee);
    }
  }
  return Number(conference.registration_fee || 0);
}

export function toRegistrationApiPayload(payload: ConferenceRegistrationPayload) {
  return {
    registration_type: payload.registrationType,
    accept_terms: payload.acceptTerms,
    promo_code: payload.promoCode || undefined,
  };
}
