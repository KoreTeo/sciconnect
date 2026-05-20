"""Shared API messages and machine-readable codes exposed to clients."""

# User-facing Russian text; frontend matches this string in isEmailNotVerifiedError().
EMAIL_NOT_VERIFIED_DETAIL = "Подтвердите email, чтобы выполнить это действие."
EMAIL_NOT_VERIFIED_CODE = "email_not_verified"

REGISTRATION_TERMS_REQUIRED_DETAIL = "Необходимо согласие с условиями участия."
REGISTRATION_TERMS_REQUIRED_CODE = "registration_terms_required"
REGISTRATION_INVALID_TYPE_DETAIL = "Недопустимый тип регистрации. Выберите «слушатель» или «автор»."
REGISTRATION_INVALID_TYPE_CODE = "registration_invalid_type"
REGISTRATION_PROFILE_AFFILIATION_REQUIRED_DETAIL = (
    "Укажите организацию в профиле перед регистрацией на конференцию."
)
REGISTRATION_PROFILE_AFFILIATION_REQUIRED_CODE = "registration_profile_affiliation_required"

PAYMENT_REQUIRED_DETAIL = "Для этого действия требуется оплата взноса."
PAYMENT_REQUIRED_CODE = "payment_required"
REGISTRATION_PENDING_DETAIL = "Регистрация ожидает оплаты."
REGISTRATION_PENDING_CODE = "registration_pending"
REVIEW_CONFLICT_DECLARED_DETAIL = "Вы заявили конфликт интересов по этой статье."
REVIEW_CONFLICT_DECLARED_CODE = "review_conflict_declared"
