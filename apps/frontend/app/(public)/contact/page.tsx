import React from 'react';
import Banner from './sections/banner';
import { Label } from '@/components/ui/label';
import {
  InputGroup,
  InputGroupInput,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function ContactPage() {
  return (
    <div>
      <Banner />
      <div className="max-w-[1280px] mx-auto px-spacing-5xl py-spacing-10xl">
        <div className=" border bg-bg-gray-soft-primary border-border-gray-secondary rounded-4xl px-spacing-4xl md:px-spacing-6xl py-spacing-5xl space-y-spacing-5xl">
          <div className="grid sm:grid-cols-2 gap-spacing-4xl">
            <div className="space-y-spacing-xl">
              <Label className=" text-label-md font-label-md-strong! text-text-gray-primary">
                First name
              </Label>
              <div className=" space-y-spacing-sm">
                <InputGroup
                  className={cn('h-14 rounded-xs bg-bg-gray-soft-secondary')}
                >
                  <InputGroupInput
                    type="text"
                    placeholder=" Eg . John"
                    className=" text-text-gray-primary text-label-md  placeholder:text-text-gray-tertiary"
                  />
                </InputGroup>
                {/* {errors.name && (
                  <p className="text-xs text-text-error-primary">
                    {errors.name.message}
                  </p>
                )} */}
              </div>
            </div>
            <div className="space-y-spacing-xl">
              <Label className=" text-label-md font-label-md-strong! text-text-gray-primary">
                Last name
              </Label>
              <div className=" space-y-spacing-sm">
                <InputGroup
                  className={cn(
                    'h-14 rounded-xs bg-bg-gray-soft-secondary',
                    // errors.headline && ' border-border-error-primary',
                  )}
                >
                  <InputGroupInput
                    type="text"
                    placeholder=" Eg . Doe"
                    className=" text-text-gray-primary text-label-md  placeholder:text-text-gray-tertiary"
                  />
                </InputGroup>
                {/* {errors.headline && (
                  <p className="text-xs text-text-error-primary">
                    {errors.headline.message}
                  </p>
                )} */}
              </div>
            </div>
          </div>
          <div className="space-y-spacing-xl">
            <Label className=" text-label-md font-label-md-strong! text-text-gray-primary">
              How can we reach you?
            </Label>
            <div className=" space-y-spacing-sm">
              <InputGroup
                className={cn(
                  'h-14 rounded-xs bg-bg-gray-soft-secondary',
                  // errors.headline && ' border-border-error-primary',
                )}
              >
                <InputGroupInput
                  type="text"
                  placeholder=" Eg . elena@example.com"
                  className=" text-text-gray-primary text-label-md  placeholder:text-text-gray-tertiary"
                />
              </InputGroup>
              {/* {errors.headline && (
                  <p className="text-xs text-text-error-primary">
                    {errors.headline.message}
                  </p>
                )} */}
            </div>
          </div>
          <div className="space-y-spacing-xl">
            <Label className=" text-label-md font-label-md-strong! text-text-gray-primary">
              Message
            </Label>
            <div className=" space-y-spacing-sm ">
              <InputGroup className="rounded-xs bg-bg-gray-soft-secondary">
                <InputGroupTextarea
                  placeholder="Type your message..."
                  className="min-h-[136px] text-text-gray-primary text-label-md  placeholder:text-text-gray-tertiary"
                />
              </InputGroup>
              {/* {errors.summary && (
                  <p className="text-sm text-red-500">
                    {errors.summary.message}
                  </p>
                )} */}
            </div>
          </div>
          <Button className=" rounded-lg h-12 text-white! text-label-md font-label-md-strong! cursor-pointer w-full">
            Submit Now
          </Button>
        </div>
      </div>
    </div>
  );
}
