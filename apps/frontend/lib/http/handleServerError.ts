import { AxiosError } from 'axios';

export function handleServerError(
  error: unknown,
  fallbackMessage = 'Something went wrong. Please try again.',
) {
  if (error instanceof AxiosError) {
    return {
      success: false as const,
      message:
        error.response?.data?.message ?? error.message ?? fallbackMessage,
    };
  }

  return {
    success: false as const,
    message: fallbackMessage,
  };
}
