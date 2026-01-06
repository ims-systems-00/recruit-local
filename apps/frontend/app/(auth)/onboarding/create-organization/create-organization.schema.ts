import * as yup from 'yup';

export const createOrganizationSchema = yup.object({
  name: yup.string().required('Name is required'),
});

export type CreateOrganizationFormValues = yup.InferType<
  typeof createOrganizationSchema
>;
