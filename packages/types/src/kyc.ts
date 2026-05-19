export enum KYC_STATUS {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  ACTION_REQUIRED = 'action_required',
}

export enum KYC_DOCUMENT_TYPE {
  PASSPORT = 'passport',
  DRIVER_LICENSE = 'driver_license',
  ID_CARD = 'id_card',
}
