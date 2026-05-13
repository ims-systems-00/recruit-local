'use client';

import { Menu } from 'lucide-react';
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import Link from 'next/link';
import Image from 'next/image';
import NavLogo from '@/public/images/NavLogo.svg';

export default function MenuBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-bg-brand-solid-alt">
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
        <div className="hidden lg:flex lg:gap-x-12 text-text-gray-quinary">
          <Link
            href="/"
            className=" text-label-sm font-label-sm-strong! hover:text-text-brand-secondary "
          >
            Home
          </Link>
          <Link
            href="/find-job"
            className=" text-label-sm font-label-sm-strong! hover:text-text-brand-secondary "
          >
            Find Job
          </Link>
          <Link
            href="/pricing"
            className=" text-label-sm font-label-sm-strong! hover:text-text-brand-secondary "
          >
            Pricing
          </Link>
          <Link
            href="/blogs"
            className=" text-label-sm font-label-sm-strong! hover:text-text-brand-secondary "
          >
            Blogs
          </Link>
          <Link
            href="/contact"
            className=" text-label-sm font-label-sm-strong! hover:text-text-brand-secondary "
          >
            Contact us
          </Link>
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-spacing-xl">
          <Link
            href="#"
            className=" text-label-sm font-label-sm-strong! text-text-gray-quinary "
          >
            Sign In
          </Link>
          <Link
            href="#"
            className="text-label-sm rounded-full font-label-sm-strong! flex items-center h-10 justify-center py-spacing-xl px-spacing-3xl bg-bg-brand-solid-primary"
          >
            Register Now/Post Job
          </Link>
        </div>
      </nav>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto bg-bg-brand-solid-alt text-white p-6 sm:max-w-sm border-0"
        >
          <SheetHeader className="mb-6 flex flex-row items-center justify-between space-y-0 p-0">
            <SheetTitle className="sr-only">Mobile Menu</SheetTitle>

            <Link href="/">
              <Image
                className="max-h-10 max-w-[280px]"
                alt="Logo"
                src={NavLogo}
                width={280}
                height={40}
              />
            </Link>
          </SheetHeader>

          <div>
            {/* Navigation */}
            <div className="pb-6 flex flex-col gap-spacing-xl text-text-gray-quinary">
              <Link
                href="/"
                className=" text-label-sm font-label-sm-strong! hover:text-text-brand-secondary "
              >
                Home
              </Link>
              <Link
                href="/find-job"
                className=" text-label-sm font-label-sm-strong! hover:text-text-brand-secondary "
              >
                Find Job
              </Link>
              <Link
                href="/pricing"
                className=" text-label-sm font-label-sm-strong! hover:text-text-brand-secondary "
              >
                Pricing
              </Link>
              <Link
                href="/blogs"
                className=" text-label-sm font-label-sm-strong! hover:text-text-brand-secondary "
              >
                Blogs
              </Link>
              <Link
                href="/contact"
                className=" text-label-sm font-label-sm-strong! hover:text-text-brand-secondary "
              >
                Contact us
              </Link>
            </div>

            {/* Auth */}
            <div className="pb-6 flex flex-col gap-spacing-xl">
              <Link
                href="#"
                className=" text-label-sm font-label-sm-strong! text-text-gray-quinary "
              >
                Sign In
              </Link>
              <Link
                href="#"
                className="text-label-sm rounded-full font-label-sm-strong! flex items-center h-10 justify-center py-spacing-xl px-spacing-3xl bg-bg-brand-solid-primary"
              >
                Register Now/Post Job
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
