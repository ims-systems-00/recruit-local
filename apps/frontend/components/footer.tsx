import Image from 'next/image';
import React from 'react';
import Logo from '@/public/images/RlLogo.svg';

export default function Footer() {
  return (
    <footer className="py-spacing-10xl  bg-bg-brand-solid-alt text-white">
      <div className=" max-w-[1280px] mx-auto space-y-spacing-4xl px-spacing-5xl">
        <div className=" grid grid-cols-5 gap-spacing-7xl">
          <div className=" col-span-3 space-y-spacing-5xl">
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
          <div className=" justify-self-end">
            <div>
              <p className=" text-label-lg">Navigation</p>
            </div>
          </div>
          <div className=" justify-self-end">nav 2</div>
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
