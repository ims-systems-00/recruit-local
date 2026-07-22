import * as yup from 'yup';

export const signupSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required(),
  type: yup.string().required('User type is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required(),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required(),
  agreed: yup.boolean().required().oneOf([true], 'Accept terms'),
});

export type SignupFormValues = yup.InferType<typeof signupSchema>;
