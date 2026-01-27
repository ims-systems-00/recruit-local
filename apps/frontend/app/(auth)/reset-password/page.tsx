import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { MailIcon } from 'lucide-react';

export default function ResetPassword() {
  return (
    <div className=" min-h-screen flex justify-center items-center bg-card">
      <div className=" shadow-regular w-[692px] bg-card rounded-lg flex flex-col gap-y-spacing-5xl p-12">
        <div className="space-y-spacing-lg">
          <h4>Reset Password</h4>
          <p>
            Please enter the email address associated with your account, and we
            will send you a link to reset your password.
          </p>
        </div>
        <div className=" space-y-12">
          <InputGroup className="h-10 rounded-lg shadow-light">
            <InputGroupInput type="email" placeholder="Enter your email" />
            <InputGroupAddon className="group-has-[[data-slot=input-group-control]:focus-visible]/input-group:text-primary">
              <MailIcon />
            </InputGroupAddon>
          </InputGroup>
          <div className=" flex justify-end items-center gap-4 pt-3 border-t border-border">
            <Button className="text-base bg-transparent border border-border text-title rounded-lg h-10">
              Cancel
            </Button>
            <Button
              type="submit"
              className="text-base bg-primary border-primary text-white rounded-lg h-10"
            >
              Send
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
