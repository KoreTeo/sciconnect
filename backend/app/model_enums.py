import enum


class RoleEnum(str, enum.Enum):
    USER = "user"
    REVIEWER = "reviewer"
    ORGANIZER = "organizer"
    ADMIN = "admin"


class PaperStatusEnum(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    REVISION_REQUIRED = "revision_required"


class ConferenceStatusEnum(str, enum.Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    SUBMISSION_OPEN = "submission_open"
    REVIEWING = "reviewing"
    PROGRAMMING = "programming"
    COMPLETED = "completed"
    REJECTED = "rejected"


class FormatEnum(str, enum.Enum):
    OFFLINE = "offline"
    ONLINE = "online"
    HYBRID = "hybrid"


class RecommendationEnum(str, enum.Enum):
    ACCEPT = "accept"
    MINOR_REVISION = "minor_revision"
    MAJOR_REVISION = "major_revision"
    REJECT = "reject"


class ReviewModeEnum(str, enum.Enum):
    OPEN = "open"
    SINGLE_BLIND = "single_blind"
    DOUBLE_BLIND = "double_blind"


class ConferenceRoleEnum(str, enum.Enum):
    CO_ORGANIZER = "co_organizer"
    TRACK_CHAIR = "track_chair"


class RegistrationTypeEnum(str, enum.Enum):
    LISTENER = "listener"
    AUTHOR = "author"


class RegistrationStatusEnum(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class PaymentStatusEnum(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"

