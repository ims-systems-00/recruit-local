import Image from 'next/image';
import React from 'react';
import Logo from '@/public/images/RlLogo.svg';
import GithubIcon from '@/public/images/github.svg';
import XIcon from '@/public/images/x.svg';
import FacebookIcon from '@/public/images/facebook.svg';
import LinkedinIcon from '@/public/images/linkedin.svg';
import Link from 'next/link';
import { Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="py-spacing-10xl  bg-bg-brand-solid-alt text-white">
      <div className=" max-w-[1280px] mx-auto space-y-spacing-4xl px-spacing-5xl">
        <div className=" grid grid-cols-1 lg:grid-cols-7 gap-spacing-7xl">
          <div className="lg:col-span-3 space-y-spacing-5xl">
            <div>
              <Image
                className="max-h-[25px] max-w-[232px]"
                alt="Logo"
                src={Logo}
                width={232}
                height={25}
              />
            </div>
            <p className="text-label-md  text-text-gray-quinary max-w-[500px]">
              RecruitLocal exists to unlock local talent, support local
              employers and build stronger local economies — powered by AI,
              driven by values and centred on people.
            </p>
          </div>
          <div className=" lg:col-span-4 grid md:grid-cols-2 gap-spacing-7xl">
            <div className=" lg:justify-self-end">
              <div className=" space-y-spacing-2xl">
                <p className=" text-label-lg font-label-lg-strong!">
                  Navigation
                </p>
                <div className=" flex flex-col gap-y-spacing-lg">
                  <Link
                    href="/"
                    className=" text-label-md text-text-gray-quinary"
                  >
                    Home
                  </Link>
                  <Link
                    href="/jobs"
                    className="text-label-md text-text-gray-quinary"
                  >
                    Find Jobs
                  </Link>
                  <Link
                    href="/pricing"
                    className="text-label-md text-text-gray-quinary"
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/contact"
                    className="text-label-md text-text-gray-quinary"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>
            <div className=" lg:justify-self-end">
              <div className=" space-y-spacing-2xl">
                <p className=" text-label-lg font-label-lg-strong!">Contacts</p>
                <div className=" space-y-spacing-6xl">
                  <div className=" flex flex-col gap-y-spacing-lg">
                    <Link
                      href="mailto:hello@Recruitlocal.tech"
                      className=" text-label-md text-text-gray-quinary flex items-center gap-x-spacing-md"
                    >
                      <Mail className="w-5 h-5 text-white" />
                      hello@Recruitlocal.tech
                    </Link>
                    <Link
                      href="mailto:support@RecruitCall.tech"
                      className="text-label-md text-text-gray-quinary flex items-center gap-x-spacing-md"
                    >
                      <Mail className="w-5 h-5 text-white" />
                      support@RecruitCall.tech
                    </Link>
                  </div>
                  <div className=" flex gap-spacing-4xl items-center">
                    <Link href="/" target="_blank">
                      <Image
                        className="max-h-6 max-w-6"
                        alt="Logo"
                        src={GithubIcon}
                        width={24}
                        height={24}
                      />
                    </Link>
                    <Link href="/" target="_blank">
                      <Image
                        className="max-h-6 max-w-6"
                        alt="Logo"
                        src={XIcon}
                        width={24}
                        height={24}
                      />
                    </Link>
                    <Link href="/" target="_blank">
                      <Image
                        className="max-h-6 max-w-6"
                        alt="Logo"
                        src={FacebookIcon}
                        width={24}
                        height={24}
                      />
                    </Link>
                    <Link href="/" target="_blank">
                      <Image
                        className="max-h-6 max-w-6"
                        alt="Logo"
                        src={LinkedinIcon}
                        width={24}
                        height={24}
                      />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className=" border-t pt-spacing-5xl border-border-gray-secondary/10">
          <p className=" text-center text-label-md text-text-gray-tertiary">
            ©RecuitLocal LTD.All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
