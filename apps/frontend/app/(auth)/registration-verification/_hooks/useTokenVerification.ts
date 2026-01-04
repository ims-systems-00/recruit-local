import { useEffect, useState } from 'react';
import { jwtDecode, JwtPayload } from 'jwt-decode';

type TokenValidationResult<T = JwtPayload> = {
  verified: boolean;
  tokenInfo?: T;
  error?: string;
};

export const useTokenVerification = <T extends JwtPayload = JwtPayload>(
  token?: string | null,
): TokenValidationResult<T> => {
  const [result, setResult] = useState<TokenValidationResult<T>>({
    verified: false,
  });

  useEffect(() => {
    if (!token) {
      setResult({
        verified: false,
        error: 'Token is missing',
      });
      return;
    }

    try {
      const decoded = jwtDecode<T>(token);

      if (!decoded.exp) {
        setResult({
          verified: false,
          error: 'Token expiration is missing',
        });
        return;
      }

      const isExpired = decoded.exp * 1000 < Date.now();

      setResult(
        isExpired
          ? { verified: false, error: 'Token has expired' }
          : { verified: true, tokenInfo: decoded },
      );
    } catch {
      setResult({
        verified: false,
        error: 'Token is invalid',
      });
    }
  }, [token]);

  return result;
};
