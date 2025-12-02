import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import JobSeekerImg from '@/public/images/role/cuate.svg';
import { Button } from '@/components/ui/button';

export default function Role() {
  return (
    <div className=" min-h-screen flex justify-center items-center bg-card">
      <div className=" shadow-regular w-[692px] bg-card rounded-lg flex flex-col gap-y-8 p-12">
        <div className="space-y-3">
          <h3>What Brings to you Recruit Local ?</h3>
          <p>Choose One for Now</p>
        </div>
        <div className=" space-y-12">
          <div className="space-y-6">
            <div className="border border-primary rounded-lg py-5 px-8 flex items-center gap-4">
              <div className="min-w-[100px]">
                <Image
                  className="max-h-[67px] max-w-[100px]"
                  alt="JobSeekerImg"
                  src={JobSeekerImg}
                  width={100}
                  height={67}
                />
              </div>
              <div className=" space-y-3">
                <h4>Job Seeker</h4>
                <p className="text-sm">
                  Begin your job search by creating your profile.
                </p>
              </div>
            </div>
            <div className="border border-border rounded-lg py-5 px-8 flex items-center gap-4">
              <div className="min-w-[100px]">
                <Image
                  className="max-h-[67px] max-w-[100px]"
                  alt="JobSeekerImg"
                  src={JobSeekerImg}
                  width={100}
                  height={67}
                />
              </div>
              <div className=" space-y-3">
                <h4>Job Seeker</h4>
                <p className="text-sm">
                  Begin your job search by creating your profile.
                </p>
              </div>
            </div>
            <div className="border border-border rounded-lg py-5 px-8 flex items-center gap-4">
              <div className="min-w-[100px]">
                <Image
                  className="max-h-[67px] max-w-[100px]"
                  alt="JobSeekerImg"
                  src={JobSeekerImg}
                  width={100}
                  height={67}
                />
              </div>
              <div className=" space-y-3">
                <h4>Job Seeker</h4>
                <p className="text-sm">
                  Begin your job search by creating your profile.
                </p>
              </div>
            </div>
          </div>
          <div className=" flex justify-end items-center gap-4">
            <Button className="text-base bg-transparent border border-border text-title rounded-lg h-10">
              Cancel
            </Button>
            <Button
              type="submit"
              className="text-base bg-primary border-primary text-white rounded-lg h-10"
            >
              Continue
            </Button>
          </div>
        </div>
        <div className="flex justify-end">
          <p className="text-base text-body">
            In trouble?{' '}
            <Link href={'/sign-up'} className="text-primary">
              Help is available
            </Link>{' '}
          </p>
        </div>
      </div>
    </div>
  );
}
