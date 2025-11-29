import Image from 'next/image';
import React from 'react';
import Logo from '@/public/images/logo.svg';
import { Button } from '@/components/ui/button';

import {
  CheckIcon,
  CreditCardIcon,
  InfoIcon,
  MailIcon,
  SearchIcon,
  StarIcon,
} from 'lucide-react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';

export default function Login() {
  return (
    <div className=" min-h-screen flex justify-center items-center">
      <div className=" shadow-regular w-[692px] h-[700px] bg-card rounded-lg space-y-8 p-8">
        <div>
          <Image
            className="max-h-[62px] max-w-[114px]"
            alt="Logo"
            src={Logo}
            width={114}
            height={62}
          />
        </div>

        <div className=" space-y-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <h4>Welcome Back !!</h4>
              <p>Please log into our portal.</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-4">
                <InputGroup className="h-10 rounded-lg shadow-light">
                  <InputGroupInput placeholder="Search..." />
                  <InputGroupAddon className="group-has-[[data-slot=input-group-control]:focus-visible]/input-group:text-primary">
                    <SearchIcon />
                  </InputGroupAddon>
                </InputGroup>
                <InputGroup className="h-10 rounded-lg shadow-light">
                  <InputGroupInput
                    type="email"
                    placeholder="Enter your email"
                  />
                  <InputGroupAddon className="group-has-[[data-slot=input-group-control]:focus-visible]/input-group:text-primary">
                    <MailIcon />
                  </InputGroupAddon>
                </InputGroup>
                <InputGroup>
                  <InputGroupInput placeholder="Card number" />
                  <InputGroupAddon>
                    <CreditCardIcon />
                  </InputGroupAddon>
                  <InputGroupAddon align="inline-end">
                    <CheckIcon />
                  </InputGroupAddon>
                </InputGroup>
                <InputGroup>
                  <InputGroupInput placeholder="Card number" />
                  <InputGroupAddon align="inline-end">
                    <StarIcon />
                    <InfoIcon />
                  </InputGroupAddon>
                </InputGroup>
              </div>
            </div>
          </div>
          <div>
            <Button className=" w-full text-base bg-primary border-primary text-white rounded-lg h-10">
              Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
