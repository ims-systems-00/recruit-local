export type TenantData = {
  _id: string;
  name: string;
  status: string;
  deleteMarker?: {
    status: boolean;
    deletedAt?: string | null;
    dateScheduled?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type TenantsItemBackendResponse = {
  success: boolean;
  post: TenantData;
  message?: string;
};
