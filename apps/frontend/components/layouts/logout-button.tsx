'use client';
import { useLogout } from '@/services/auth/auth.client';
import { LogOut } from 'lucide-react';
import React from 'react';

export default function LogoutButton() {
  const { logout } = useLogout();

  const handleLogout = () => {
    logout();
  };
  return (
    <span className="h-9 w-9 flex items-center justify-center">
      <LogOut
        className="size-5 text-fg-gray-secondary cursor-pointer"
        onClick={handleLogout}
      />
    </span>
  );
}
