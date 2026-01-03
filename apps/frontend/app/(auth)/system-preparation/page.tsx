import Image from 'next/image';
import React from 'react';
import LoaderSvg from '@/public/images/loader.svg';

export default function SystemPreparation() {
  return (
    <div className=" min-h-screen flex justify-center items-center bg-card">
      <div className="shadow-regular rounded-md p-12 flex items-center gap-6">
        <div className="min-w-[145px] animate-spin animation-duration-[2s]">
          <Image
            className="max-h-[145px] max-w-[145px]"
            alt="Logo"
            src={LoaderSvg}
            width={145}
            height={145}
          />
        </div>
        <div className="flex items-center justify-center gap-6 flex-col">
          <div className="flex flex-col items-center justify-center gap-3 max-w-[444px]">
            <h3>Hang Tight</h3>
            <p className="text-center leading-6">
              The system is preparing your Profile please wait for while
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
