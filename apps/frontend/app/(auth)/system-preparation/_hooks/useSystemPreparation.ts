'use client';
import { useState } from 'react';
import { useUserInfo } from '@/services/user/user.client';

export const useSystemPreparation = () => {
  const [result, setResult] = useState();

  const { user, isLoading: isUserLoading } = useUserInfo();

  const isEmailVerified =
    user?.emailVerificationStatus === 'verified' ? true : false;

  return { isEmailVerified, isUserLoading };
};
