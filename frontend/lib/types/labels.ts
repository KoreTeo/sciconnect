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

export const STATUS_LABELS: Record<PaperStatus, string> = {
  draft: 'Черновик',
  submitted: 'Подана',
  under_review: 'На рецензии',
  accepted: 'Принята',
  rejected: 'Отклонена',
  revision_required: 'Требует доработки',
};

export function getPaperStatusLabel(status: string): string {
  const key = status?.toLowerCase?.().replace(/-/g, '_') ?? status;
  return STATUS_LABELS[key as PaperStatus] || status;
}

export const CONF_STATUS_LABELS: Record<ConferenceStatus, string> = {
  draft: 'Черновик',
  pending_approval: 'На модерации',
  submission_open: 'Приём статей',
  reviewing: 'Рецензирование',
  programming: 'Программа',
  completed: 'Завершена',
  rejected: 'Отклонена',
};

export const ROLE_LABELS: Record<Role, string> = {
  user: 'Участник',
  reviewer: 'Рецензент',
  organizer: 'Организатор',
  admin: 'Администратор',
};

export const FORMAT_LABELS: Record<ConferenceFormat, string> = {
  offline: 'Очно',
  online: 'Онлайн',
  hybrid: 'Гибрид',
};

export const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
  accept: 'Принять',
  minor_revision: 'Незначительная доработка',
  major_revision: 'Существенная доработка',
  reject: 'Отклонить',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачено',
  failed: 'Ошибка оплаты',
};

export const BLOCK_TYPE_LABELS: Record<string, string> = {
  text: 'Текст',
  committee: 'Программный комитет',
  sponsors: 'Партнёры',
  image: 'Изображение',
  gallery: 'Галерея',
  proceedings: 'Сборники',
  program: 'Программа',
  deadlines: 'Сроки',
  topics: 'Тематики',
  venue: 'Место проведения',
  cta: 'Кнопка действия',
  contact: 'Контакты',
};

export const REGISTRATION_TYPE_LABELS: Record<RegistrationType, string> = {
  listener: 'Слушатель',
  author: 'Автор',
};

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  pending: 'Ожидает оплаты',
  confirmed: 'Подтверждена',
  cancelled: 'Отменена',
};
