import Image from 'next/image';
import React from 'react';
import Logo from '@/public/images/logo.svg';
import SignUpForm from './sign-up-form';

export default function SignUp() {
  const onFormSubmit = (e: any) => {
    e.preventDefault();
    alert('sss');
    console.log('e', e);
  };
  return (
    <div className=" min-h-screen flex justify-center items-center bg-card py-8">
      <div className=" shadow-regular w-[692px] min-h-[735px] bg-card rounded-lg flex flex-col gap-y-8 p-8">
        <div className=" flex gap-4">
          <div className="min-w-[114px]">
            <Image
              className="max-h-[62px] max-w-[114px]"
              alt="Logo"
              src={Logo}
              width={114}
              height={62}
            />
          </div>
          <div className="space-y-2">
            <p className=" text-sm font-medium text-body">
              Empowering Employers, Job Seekers & Trainers in Your Community
            </p>
            <p className=" text-xs leading-4  text-body">
              Recruit Local connects employers, job seekers, and trainers in one
              platform to build stronger local careers and businesses. Whether
              you're hiring, seeking a job, or offering training, we help you
              grow where you are.
            </p>
          </div>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}
