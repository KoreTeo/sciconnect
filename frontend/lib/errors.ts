import axios from 'axios';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

const EMAIL_NOT_VERIFIED_MESSAGE = 'Подтвердите email, чтобы выполнить это действие.';
const EMAIL_NOT_VERIFIED_CODE = 'email_not_verified';
const PAYMENT_REQUIRED_CODE = 'payment_required';
const REGISTRATION_TERMS_REQUIRED_CODE = 'registration_terms_required';
const REGISTRATION_INVALID_TYPE_CODE = 'registration_invalid_type';
const REGISTRATION_PROFILE_AFFILIATION_REQUIRED_CODE = 'registration_profile_affiliation_required';
const REVIEW_CONFLICT_DECLARED_CODE = 'review_conflict_declared';

type ApiDetailObject = { code?: string; message?: string };

function getApiDetail(err: unknown): unknown {
  if (!axios.isAxiosError(err)) return undefined;
  return err.response?.data?.detail;
}

function getApiCode(err: unknown): string | undefined {
  const detail = getApiDetail(err);
  if (typeof detail === 'object' && detail && 'code' in detail) {
    return (detail as ApiDetailObject).code;
  }
  return undefined;
}

export function isEmailNotVerifiedError(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false;
  const detail = getApiDetail(err);
  return detail === EMAIL_NOT_VERIFIED_CODE || detail === EMAIL_NOT_VERIFIED_MESSAGE || getApiCode(err) === EMAIL_NOT_VERIFIED_CODE;
}

export function isPaymentRequiredError(err: unknown): boolean {
  const detail = getApiDetail(err);
  return detail === PAYMENT_REQUIRED_CODE || getApiCode(err) === PAYMENT_REQUIRED_CODE;
}

export function isApiErrorCode(err: unknown, code: string): boolean {
  const detail = getApiDetail(err);
  return detail === code || getApiCode(err) === code;
}

export function getApiErrorMessage(err: unknown, fallback = 'Произошла ошибка'): string {
  if (isEmailNotVerifiedError(err)) {
    return 'Подтвердите email в профиле, чтобы выполнить это действие.';
  }
  if (isPaymentRequiredError(err)) {
    return 'Для этого действия требуется оплата взноса.';
  }
  if (axios.isAxiosError(err)) {
    if (isApiErrorCode(err, REGISTRATION_TERMS_REQUIRED_CODE)) {
      return 'Необходимо согласие с условиями участия.';
    }
    if (isApiErrorCode(err, REGISTRATION_INVALID_TYPE_CODE)) {
      return 'Недопустимый тип регистрации.';
    }
    if (isApiErrorCode(err, REGISTRATION_PROFILE_AFFILIATION_REQUIRED_CODE)) {
      return 'Укажите организацию в профиле перед регистрацией.';
    }
    if (isApiErrorCode(err, REVIEW_CONFLICT_DECLARED_CODE)) {
      return 'Вы заявили конфликт интересов по этой статье.';
    }
    const detail = getApiDetail(err);
    if (typeof detail === 'string') return detail;
    if (typeof detail === 'object' && detail && 'message' in detail && typeof (detail as ApiDetailObject).message === 'string') {
      return (detail as ApiDetailObject).message || fallback;
    }
    if (Array.isArray(detail)) {
      return detail.map((d: { msg?: string }) => d.msg || '').filter(Boolean).join('; ') || fallback;
    }
  }
  return fallback;
}

export function applyApiValidationErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  fallback = 'Произошла ошибка'
) {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (Array.isArray(detail)) {
      let mapped = false;
      detail.forEach((item: { loc?: unknown[]; msg?: string }) => {
        const field = item.loc?.[item.loc.length - 1];
        if (typeof field === 'string' && item.msg) {
          setError(field as Path<T>, { message: item.msg });
          mapped = true;
        }
      });
      if (mapped) return;
    }
  }

  setError('root' as Path<T>, { message: getApiErrorMessage(err, fallback) });
}
