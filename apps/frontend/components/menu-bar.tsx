'use client';

import { Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import Link from 'next/link';
import Image from 'next/image';
import NavLogo from '@/public/images/NavLogo.svg';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '@/services/user/user.client';
import { ACCOUNT_TYPE_ENUMS } from '@rl/types';
import { useLogout } from '@/services/auth/auth.client';

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

export default function MenuBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { logout } = useLogout();
  const router = useRouter();

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        'bg-bg-brand-solid-alt sticky top-0 z-50 transition-all duration-300 ease-in-out',
        isScrolled &&
          'bg-bg-brand-solid-alt backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] supports-backdrop-filter:bg-bg-brand-solid-alt',
      )}
    >
      <nav
        aria-label="Global"
        className="mx-auto flex max-w-[1280px] items-center justify-between px-spacing-5xl h-[80px] text-white"
      >
        <div className="flex lg:flex-1">
          <Link href="/">
            <Image
              className="max-h-10 max-w-[280px]"
              alt="Logo"
              src={NavLogo}
              width={280}
              height={40}
            />
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 "
          >
            <span className="sr-only">Open main menu</span>
            <Menu aria-hidden="true" className="size-6" />
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-spacing-3xl text-text-gray-quinary">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-spacing-lg text-label-sm font-label-sm-strong! hover:text-text-brand-secondary',
                pathname === item.href && 'text-text-brand-secondary',
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-spacing-xl">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className=" size-10 border border-border-gray-secondary cursor-pointer items-center justify-center">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>
                    {user.firstName?.charAt(0)} {user.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-40 bg-bg-gray-soft-primary"
                align="start"
              >
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => {
                      user?.type === ACCOUNT_TYPE_ENUMS.CANDIDATE &&
                        router.push(`/candidate/profile/${user?.jobProfileId}`);
                      user?.type === ACCOUNT_TYPE_ENUMS.EMPLOYER &&
                        router.push(`/recruiter/profile/${user?.tenantId}`);
                    }}
                    className=" cursor-pointer"
                  >
                    Profile
                    <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className=" cursor-pointer"
                  >
                    Log out
                    <DropdownMenuShortcut>⌘L</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                href="/login"
                className=" px-spacing-lg text-label-sm font-label-sm-strong! text-text-gray-quinary "
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="text-label-sm rounded-full font-label-sm-strong! flex items-center h-10 justify-center py-spacing-xl px-spacing-3xl bg-bg-brand-solid-primary"
              >
                Register Now/Post Job
              </Link>
            </>
          )}
        </div>
      </nav>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto bg-bg-brand-solid-alt text-white p-6 sm:max-w-sm border-0"
        >
          <SheetHeader className="mb-6 flex flex-row items-center justify-between space-y-0 p-0">
            <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
            <SheetClose asChild>
              <Link href="/">
                <Image
                  className="max-h-10 max-w-[280px]"
                  alt="Logo"
                  src={NavLogo}
                  width={280}
                  height={40}
                />
              </Link>
            </SheetClose>
          </SheetHeader>

          <div>
            {/* Navigation */}
            <div className="pb-spacing-4xl flex flex-col gap-spacing-xl text-text-gray-quinary">
              {navItems.map((item) => (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      ' text-label-sm font-label-sm-strong! hover:text-text-brand-secondary ',
                      pathname === item.href && 'text-text-brand-secondary',
                    )}
                  >
                    {item.label}
                  </Link>
                </SheetClose>
              ))}
            </div>

            {/* Auth */}
            <div className="pb-spacing-4xl flex flex-col gap-spacing-xl">
              <SheetClose asChild>
                <Link
                  href="/login"
                  className=" px-spacing-lg text-label-sm font-label-sm-strong! text-text-gray-quinary "
                >
                  Sign In
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/sign-up"
                  className="text-label-sm rounded-full font-label-sm-strong! flex items-center h-10 justify-center py-spacing-xl px-spacing-3xl bg-bg-brand-solid-primary"
                >
                  Register Now/Post Job
                </Link>
              </SheetClose>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
