import React from 'react';
import SignUpForm from './sign-up-form';

export default function SignUp() {
  return (
    <div className="  flex justify-center items-center">
      <div className="w-[692px] rounded-lg flex flex-col gap-y-spacing-4xl p-spacing-5xl">
        <SignUpForm />
      </div>
    </div>
  );
}
