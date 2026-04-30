'use client';
import React from 'react';
import Image from 'next/image';
import LoaderSvg from '@/public/images/loader.svg';
import { useSystemPreparation } from './_hooks/useSystemPreparation';

export default function SystemPreparationSection() {
  const { isUserLoading, isPending } = useSystemPreparation();

  return (
    <div className=" min-h-screen flex justify-center items-center bg-card">
      <div className="shadow-regular rounded-md p-12 flex items-center gap-spacing-4xl">
        <div className="min-w-[145px] animate-spin animation-duration-[2s]">
          <Image
            className="max-h-[145px] max-w-[145px]"
            alt="Logo"
            src={LoaderSvg}
            width={145}
            height={145}
          />
        </div>
        <div className="flex items-center justify-center gap-spacing-4xl flex-col">
          <div className="flex flex-col items-center justify-center gap-spacing-lg min-w-[350px] max-w-[444px]">
            <h3>Hang Tight</h3>
            <p className="text-center leading-6">
              {isUserLoading || isPending
                ? 'The system is preparing your Profile please wait for while'
                : 'Almost done!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
