import * as yup from 'yup';

export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Invalid email address'),
});

export type ForgotPasswordSchema = yup.InferType<typeof forgotPasswordSchema>;

export const changePasswordSchema = yup.object({
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required(),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required(),
});

export type ChangePasswordSchema = yup.InferType<typeof changePasswordSchema>;
