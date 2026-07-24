import { KYC_DOCUMENT_TYPE } from '@rl/types';
import * as yup from 'yup';

const awsStorageSchema = yup
  .object({
    Name: yup.string().required('Name is required'),
    Bucket: yup.string().required('Bucket is required'),
    Key: yup.string().required('Key is required'),
  })
  .nullable()
  .default(undefined);

export const kycCreateValidationSchema = yup.object({
  documentType: yup
    .string()
    .oneOf(Object.values(KYC_DOCUMENT_TYPE), 'Invalid Document Type')
    .required('Document Type is required'),

  nationalInsuranceNumber: yup.string().when('documentType', {
    is: KYC_DOCUMENT_TYPE.NATIONAL_INSURANCE_NUMBER,
    then: (schema) =>
      schema
        .matches(
          /^\d{9}$/,
          'National Insurance Number must be exactly 9 digits',
        )
        .required('National Insurance Number is required'),
    otherwise: (schema) => schema.notRequired(),
  }),

  documentFrontStorage: awsStorageSchema.when('documentType', {
    is: KYC_DOCUMENT_TYPE.NATIONAL_INSURANCE_NUMBER,
    then: (schema) =>
      schema.test(
        'file-required',
        'Document Front File Data is not allowed',
        (value) => value == null,
      ),
    otherwise: (schema) =>
      schema.required('Document Front File Data is required'),
  }),

  documentBackStorage: awsStorageSchema.when('documentType', {
    is: KYC_DOCUMENT_TYPE.NATIONAL_INSURANCE_NUMBER,
    then: (schema) =>
      schema.test(
        'file-required',
        'Document Back File Data is not allowed',
        (value) => value == null,
      ),
    otherwise: (schema) =>
      schema.required('Document Back File Data is required'),
  }),
});
