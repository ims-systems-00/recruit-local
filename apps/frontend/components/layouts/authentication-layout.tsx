import React from 'react';
import Image from 'next/image';
import NavLogo from '@/public/images/rl_black_logo.svg';
import Link from 'next/link';
import { CircleQuestionMark, SunDim } from 'lucide-react';

const navItems = [
  {
    label: 'Home',
    href: '/',
  },
  {
    label: 'Find Job',
    href: '/jobs',
  },
  {
    label: 'Pricing',
    href: '/pricing',
  },
  {
    label: 'Blogs',
    href: '/blogs',
  },
  {
    label: 'Contact us',
    href: '/contact',
  },
];

export default function AuthenticationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className=" min-h-screen flex flex-col justify-between gap-spacing-7xl">
      <div className=" space-y-spacing-10xl">
        <div className=" border-b border-border-gray-secondary">
          <div className="max-w-[1280px] mx-auto px-spacing-5xl flex items-center justify-between h-15 ">
            <Link href="/">
              <Image
                className="max-h-8 max-w-[220px]"
                alt="Logo"
                src={NavLogo}
                width={220}
                height={32}
              />
            </Link>
            <div className="flex items-center gap-x-spacing-2xl">
              <span className="h-9 w-9 flex items-center justify-center">
                <SunDim className="size-5 text-fg-gray-secondary" />
              </span>
              <span className="h-9 w-9 flex items-center justify-center">
                <CircleQuestionMark className="size-5 text-fg-gray-secondary" />
              </span>
            </div>
          </div>
        </div>
        <div>{children}</div>
      </div>
      <div className=" py-spacing-7xl flex justify-center items-center gap-spacing-4xl opacity-40">
        <span className="text-body-sm text-text-gray-quaternary">
          © 2026 Recruit Local
        </span>
        {navItems.map((item) => (
          <Link
            href={item.href}
            key={item.href}
            className="text-body-sm text-text-gray-quaternary"
          >
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
