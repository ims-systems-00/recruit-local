'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Folder, MailIcon } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { Controller } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export default function BusinessInformationForm({
  prev,
  next,
}: {
  prev: (step: number) => void;
  next: (step: number) => void;
}) {
  return (
    <>
      <div className=" space-y-spacing-4xl">
        <div className="space-y-spacing-2xl">
          <div className=" flex items-center justify-between">
            <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
              Organization Information
            </p>
            <div className="flex items-center gap-2">
              <Checkbox
                id="autofill"
                className=" data-[state=checked]:bg-bg-brand-solid-primary data-[state=checked]:text-text-white data-[state=checked]:border-bg-brand-solid-primary"
              />
              <Label htmlFor="autofill">Auto Fill From organization</Label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-spacing-sm">
            <div className="space-y-spacing-xs">
              <Label className=" text-label-sm font-label-sm-strong!">
                Email
              </Label>
              <div className=" space-y-2">
                <InputGroup className="h-12 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    type="text"
                    placeholder="elena@example.com"
                    //   {...register('firstName')}
                  />
                  <InputGroupAddon>
                    <MailIcon className=" text-fg-gray-tertiary" />
                  </InputGroupAddon>
                </InputGroup>
                {/* {errors.firstName && (
                    <p className="text-sm text-red-500">
                      {errors.firstName.message}
                    </p>
                  )} */}
              </div>
            </div>
            <div className="space-y-spacing-xs">
              <Label className="text-label-sm font-label-sm-strong!">
                Experience Level
              </Label>

              <div className=" space-y-2">
                <Select>
                  <SelectTrigger className="h-12! w-full rounded-lg shadow-xs border-border-gray-primary">
                    <SelectValue placeholder="eg. Freshers (0 to 1)" />
                  </SelectTrigger>

                  <SelectContent className=" bg-white">
                    <SelectGroup>
                      <SelectItem value="employer">Employer</SelectItem>
                      <SelectItem value="candidate">Candidate</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {/* {errors.type && (
                  <p className="text-sm text-red-500">{errors.type.message}</p>
                )} */}
              </div>
            </div>
            <div className="space-y-spacing-xs col-span-2">
              <Label className=" text-label-sm font-label-sm-strong!">
                Required Skills
              </Label>
              <div className=" space-y-2 ">
                <InputGroup className="rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupTextarea
                    placeholder="Write your skills here..."
                    //   {...register('firstName')}
                    className="min-h-[136px] "
                  />
                </InputGroup>
                {/* {errors.firstName && (
                    <p className="text-sm text-red-500">
                      {errors.firstName.message}
                    </p>
                  )} */}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex py-spacing-2xl justify-end mt-spacing-4xl gap-spacing-sm">
        <Button
          variant="outline"
          onClick={() => prev(2)}
          className=" border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
        >
          Previous
        </Button>
        <Button
          onClick={() => next(4)}
          className=" bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
        >
          Continue
        </Button>
      </div>
    </>
  );
}
