export enum AUDIT_STATUS_ENUMS {
  SCHEDULED = "scheduled",
  IN_PROGRESS = "in-progress",
  REVIEWING = "reviewing",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  RE_OPENED = "re-opened",
}

export enum AUDIT_STANDARD_ENUMS {
  QMS = "QMS",
  EMS = "EMS",
  HMS = "HMS",
  CARBON = "Carbon",
  FSC = "FSC",
  PEFC = "PEFC",
  PROJECT = "Project",
  SSIP = "SSIP",
  VRA = "VRA",
}

export enum AUDIT_STAGE_ENUMS {
  STAGE_1 = "Stage 1",
  STAGE_2 = "Stage 2",
  VERIFICATION = "Verification",
}

export enum CERTIFICATE_STATUS_ENUMS {
  ACTIVE = "active",
  EXPIRED = "expired",
  SUSPENDED = "suspended",
  WITHDRAWN = "withdrawn",
  TERMINATED = "terminated",
}

export enum COMMENT_ACTIVITY_TYPE_ENUMS {
  AUTOMATED = "automated",
  MANUAL = "manual",
}

export enum COMMENT_ACTIVITY_COLLECTION_ENUMS {
  TRANSFER_REGISTER = "transferregisters",
  AUDIT = "audits",
  INTERACTION = "interactions",
  Task = "tasks",
  CERTIFICATE = "certificates",
  COC = "cocs",
  AUDITOR_JOB_CARD = "auditorjobcards",
}

export enum DOCUMENT_FOLDER_TYPE_ENUMS {
  DOCUMENT = "document",
  FOLDER = "folder",
}

export enum INTERACTION_TYPE_ENUMS {
  MEDIA_APPROVAL = "media-approval",
  QUESTION = "question",
  SUPPORT = "support",
  SERVICE_REQUEST = "service-request",
}

export enum INTERACTION_STATUS_ENUMS {
  OPEN = "open",
  RESOLVE = "resolve",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum MEMBERSHIP_ROLE_ENUMS {
  ADMIN = "admin",
  STANDARD = "standard",
}

export enum NONCONFORMITY_STATUS_ENUMS {
  OPEN = "open",
  RESOLVED = "resolved",
}

export enum NOTIFICATION_STATUS_ENUMS {
  DELIVERED = "delivered",
  READ = "read",
  OPENED = "opened",
}

export enum OFI_STATUS_ENUMS {
  OPEN = "open",
  RESOLVED = "resolved",
}

export enum RISK_STATUS_ENUMS {
  OPEN = "open",
  MITIGATED = "mitigated",
  CLOSED = "closed",
}

export enum FINDING_TYPE_ENUM {
  RISK = "risk",
  NON_CONFORMITY = "non-conformity",
  OFI = "ofi",
}

export enum USER_TYPE_ENUMS {
  PLATFORM_ADMIN = "platform-admin",
  CUSTOMER = "customer",
  AUDITOR = "auditor",
}

export enum EMAIL_VERIFICATION_STATUS_ENUMS {
  VERIFIED = "verified",
  UNVERIFIED = "unverified",
}

export enum VERIFICATION_TOKEN_TYPE_ENUMS {
  USER_EMAIL = "user-email",
  FORGOT_PASS = "forgot-pass",
  CLIENT_ORG_EMAIL = "client-org-email",
  INVITATION_IN_CLIENT_ORG = "invitation-in-client-org",
  INVITATION_IN_INTERFACE_NRM = "invitation-in-interface-nrm",
  INVITATION_IN_AUDIT = "invitation-in-audit",
}

export enum EXPENSE_TYPE_ENUMS {
  TRAVEL = "travel",
  ACCOMMODATION = "accommodation",
  FOOD = "food",
  ROAD_TOLL = "road-toll",
  PARKING = "parking",
  OTHER = "other",
}

export enum TRAVEL_TYPE_ENUMS {
  ONE_WAY = "one-way",
  ROUND_TRIP = "round-trip",
}

export enum VEHICLE_TYPE_ENUMS {
  CAR = "car",
  AIR = "air",
  PUBLIC_TRANSPORT = "public-transport",
}

export enum ACCOMMODATION_TYPE_ENUMS {
  HOTEL = "hotel",
  AIRBNB = "airbnb",
  HOSTEL = "hostel",
}

export enum FOOD_TYPE_ENUMS {
  BREAKFAST = "breakfast",
  LUNCH = "lunch",
  DINNER = "dinner",
}

export enum VEHICLE_OWNERSHIP_ENUMS {
  COMPANY = "company",
  PERSONAL = "personal",
}

export enum EXPENSE_REPORT_TYPE_ENUMS {
  STAFF = "staff",
  ASSOCIATE = "associate",
}

export enum CURRENCY_ENUMS {
  GBP = "£",
  USD = "$",
  EUR = "€",
}

export enum COMPLIANCE_STANDARDS_ENUMS {
  // ISO
  QMS = "QMS",
  EMS = "EMS",
  HMS = "HMS",
  CARBON = "Carbon",
  SSIP = "SSIP",
  // CoC
  FSC = "FSC",
  PEFC = "PEFC",
  PROJECT = "Project",
  // VRA
  VRA = "VRA",
}

export enum NON_CONFORMITY_TYPE_ENUMS {
  MAJOR = "major",
  MINOR = "minor",
}

export enum INVOICE_STATUS_ENUMS {
  DRAFT = "Draft",
  SENT = "Sent",
  PAID = "Paid",
}

export enum AUDITOR_AVAILABILITY_ENUMS {
  MONDAY = "Monday",
  TUESDAY = "Tuesday",
  WEDNESDAY = "Wednesday",
  THURSDAY = "Thursday",
  FRIDAY = "Friday",
  SATURDAY = "Saturday",
  SUNDAY = "Sunday",
}

export enum AUDITOR_JOB_STATUS {
  DRAFT = "draft",
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
}

export enum AUDITOR_JOB_ACCEPTED_DATE {
  ONE = "One",
  TWO = "Two",
}
export enum TASK_STATUS_ENUMS {
  DRAFT = "draft",
  PENDING = "pending",
  IN_PROGRESS = "in-progress",
  COMPLETED = "completed",
}
export enum TASK_PRIORITY_ENUMS {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  CRITICAL = "critical",
}
export enum SALES_STAGES_ENUMS {
  LEAD = "lead",
  APPLICATION = "application",
  OPPORTUNITY = "opportunity",
  QUOTATION = "quotation",
  WON = "won",
  LOST = "lost",
}
export enum QUOTATION_STATUS_ENUMS {
  DRAFT = "draft",
  SENT = "sent",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum TEAM_MEMBERSHIP_ROLE_ENUMS {
  TEAM_ADMIN = "team-admin",
  TEAM_MEMBER = "team-member",
}
export enum CATEGORY_USED_FOR_ENUMS {
  TASK_CATEGORY = "task.category",
  TENANT_CATEGORY = "tenant.category",
  AUDIT_CATEGORY = "audit.category",
}
export enum TRANSFER_REGISTER_STATUS_ENUMS {
  TRANSFER_REQUESTED = "transfer-requested",
  IN_PROGRESS = "in-progress",
  TRANSFER_COMPLETED = "transfer-completed",
  CANCELLED = "cancelled",
}
export enum FORM_STATUS_ENUMS {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}
export enum FORM_USAGES_TYPE_ENUMS {
  GENERAL_USAGES = "general-usages",
  ORGANISATIONS = "organisations",
  AUDITORS = "auditors",
}
export enum TENANT_WITH_STANDARD_ENUMS {
  ALL = "*",
  QMS = "QMS",
  EMS = "EMS",
  HMS = "HMS",
  CARBON = "Carbon",
  FSC = "FSC",
  PEFC = "PEFC",
  PROJECT = "Project",
  SSIP = "SSIP",
  VRA = "VRA",
}
export enum COC_STATUS_ENUMS {
  DRAFT = "draft",
  REQUESTED = "requested",
  REVIEWING = "reviewing",
  REVIEW_COMPLETED = "review-completed",
  QUERIED = "queried",
}
export enum MEMBERSHIP_TYPE_ENUMS {
  YES = "yes",
  NO = "no",
}
export enum JOB_CARD_SUB_AUDITOR_INVITATION_STATUS_ENUMS {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
}
export enum GHG_INCLUSION_ASSESSMENT {
  INCLUDED = "included",
  EXCLUDED = "excluded",
  PARTIALLY_INCLUDED = "partially-included",
}
export enum YES_NO_ENUM {
  YES = "YES",
  NO = "NO",
}
export enum MEDIA_TYPES {
  IMAGES = "images",
  PDF = "pdf",
  DOCUMENTS = "documents",
  PLAIN_TEXT = "plain-text",
  URL = "url",
}
export enum MEDIA_APPROVAL_STATUS_ENUMS {
  APPROVED = "approved",
  REJECTED = "rejected",
  PENDING = "pending",
}
