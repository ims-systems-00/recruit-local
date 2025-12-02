import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { EyeClosed, LockKeyholeOpen } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function ChangePassword() {
  return (
    <div className=" min-h-screen flex justify-center items-center bg-card">
      <div className=" shadow-regular w-[692px] bg-card rounded-lg flex flex-col gap-y-8 p-12">
        <div className="space-y-3">
          <h4>Create New Password</h4>
          <p>alifun99@gmail.com</p>
        </div>
        <div className=" space-y-12">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-title text-base leading-[100%]">
                New Password
              </Label>
              <InputGroup className="h-10 rounded-lg shadow-light">
                <InputGroupInput type="password" placeholder="*********" />
                <InputGroupAddon className="group-has-[[data-slot=input-group-control]:focus-visible]/input-group:text-primary">
                  <LockKeyholeOpen />
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <EyeClosed />
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-title text-base leading-[100%]">
                Confirm Password
              </Label>
              <InputGroup className="h-10 rounded-lg shadow-light">
                <InputGroupInput type="password" placeholder="*********" />
                <InputGroupAddon className="group-has-[[data-slot=input-group-control]:focus-visible]/input-group:text-primary">
                  <LockKeyholeOpen />
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <EyeClosed />
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
          <div className=" flex justify-end items-center gap-4 pt-3 border-t border-border">
            <Button className="text-base bg-transparent border border-border text-title rounded-lg h-10">
              Cancel
            </Button>
            <Button
              type="submit"
              className="text-base bg-primary border-primary text-white rounded-lg h-10"
            >
              Confirm
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
