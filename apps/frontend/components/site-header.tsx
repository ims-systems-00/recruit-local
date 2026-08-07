'use client';
import React from 'react';
import { useSidebar } from './ui/sidebar';

export default function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b bg-background px-4 md:hidden">
      <span className=" cursor-pointer" onClick={toggleSidebar}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6.875 3.75V16.25"
            stroke="#364153"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16.875 3.75H3.125C2.77982 3.75 2.5 4.02982 2.5 4.375V15.625C2.5 15.9702 2.77982 16.25 3.125 16.25H16.875C17.2202 16.25 17.5 15.9702 17.5 15.625V4.375C17.5 4.02982 17.2202 3.75 16.875 3.75Z"
            stroke="#364153"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </header>
  );
}
