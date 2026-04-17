export interface User {
  _id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  profileImageSrc?: string;
  type?: string;
  role?: string;
  emailVerificationStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  tenantId?: string | null;
}
