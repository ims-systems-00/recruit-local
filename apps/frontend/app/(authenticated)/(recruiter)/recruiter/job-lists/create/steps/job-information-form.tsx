'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Folder } from 'lucide-react';
import {
  InputGroup,
  InputGroupInput,
  InputGroupTextarea,
} from '@/components/ui/input-group';

export default function JobInformationForm({
  next,
}: {
  next: (step: number) => void;
}) {
  return (
    <>
      <div className=" space-y-spacing-4xl">
        <div className="space-y-spacing-2xl">
          <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
            Banner of Job (optional)
          </p>
          <div className=" w-full p-spacing-4xl rounded-2xl border border-dashed border-border-gray-secondary flex flex-col justify-center items-center gap-spacing-lg">
            <div className=" w-10 h-10 border border-others-brand-light flex justify-center items-center  bg-others-brand-brand-zero rounded-lg">
              <Folder className="text-others-brand-dark fill-others-brand-dark " />
            </div>
            <div className=" space-y-spacing-xs text-label-sm text-center">
              <p>
                <span className=" text-text-brand-secondary font-label-sm-strong!">
                  Drag & Drop
                </span>{' '}
                or Choose File to Upload
              </p>
              <p>Supported Format: SVG, JPG, PNG (up to 10mb)</p>
            </div>
          </div>
        </div>
        <div className="space-y-spacing-2xl">
          <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
            Basic Information
          </p>
          <div className="grid grid-cols-2 gap-spacing-sm">
            <div className="space-y-spacing-xs col-span-2">
              <Label className=" text-label-sm font-label-sm-strong!">
                Job Title
              </Label>
              <div className=" space-y-2">
                <InputGroup className="h-12 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    type="text"
                    placeholder=" Eg . UI/UX Designer Wanted – Join Our Creative Team!"
                    //   {...register('firstName')}
                  />
                </InputGroup>
                {/* {errors.firstName && (
                    <p className="text-sm text-red-500">
                      {errors.firstName.message}
                    </p>
                  )} */}
              </div>
            </div>
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong!">
                Employ Type
              </Label>
              <div className=" space-y-2">
                <InputGroup className="h-12 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    type="text"
                    placeholder="Full Time"
                    //   {...register('firstName')}
                  />
                </InputGroup>
                {/* {errors.firstName && (
                    <p className="text-sm text-red-500">
                      {errors.firstName.message}
                    </p>
                  )} */}
              </div>
            </div>
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong!">
                Job Title
              </Label>
              <div className=" space-y-2">
                <InputGroup className="h-12 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    type="text"
                    placeholder=" Eg . UI/UX Designer Wanted – Join Our Creative Team!"
                    //   {...register('firstName')}
                  />
                </InputGroup>
                {/* {errors.firstName && (
                    <p className="text-sm text-red-500">
                      {errors.firstName.message}
                    </p>
                  )} */}
              </div>
            </div>
            <div className="space-y-spacing-xs col-span-2">
              <Label className=" text-label-sm font-label-sm-strong!">
                Location
              </Label>
              <div className=" space-y-2">
                <InputGroup className="h-12 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    type="text"
                    placeholder="www.googleMap.com"
                    //   {...register('firstName')}
                  />
                </InputGroup>
                {/* {errors.firstName && (
                    <p className="text-sm text-red-500">
                      {errors.firstName.message}
                    </p>
                  )} */}
              </div>
            </div>
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong!">
                Working Days
              </Label>
              <div className=" space-y-2">
                <InputGroup className="h-12 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    type="text"
                    placeholder="05"
                    //   {...register('firstName')}
                  />
                </InputGroup>
                {/* {errors.firstName && (
                    <p className="text-sm text-red-500">
                      {errors.firstName.message}
                    </p>
                  )} */}
              </div>
            </div>
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong!">
                Weekends
              </Label>
              <div className=" space-y-2">
                <InputGroup className="h-12 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    type="text"
                    placeholder=" Saturday, Sunday"
                    //   {...register('firstName')}
                  />
                </InputGroup>
                {/* {errors.firstName && (
                    <p className="text-sm text-red-500">
                      {errors.firstName.message}
                    </p>
                  )} */}
              </div>
            </div>
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong!">
                Number of vacancy
              </Label>
              <div className=" space-y-2">
                <InputGroup className="h-12 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    type="text"
                    placeholder="05"
                    //   {...register('firstName')}
                  />
                </InputGroup>
                {/* {errors.firstName && (
                    <p className="text-sm text-red-500">
                      {errors.firstName.message}
                    </p>
                  )} */}
              </div>
            </div>
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong!">
                Work palace
              </Label>
              <div className=" space-y-2">
                <InputGroup className="h-12 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    type="text"
                    placeholder=" eg. onsite"
                    //   {...register('firstName')}
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
        <div className="space-y-spacing-2xl">
          <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
            Job Description
          </p>
          <div className="grid grid-cols-2 gap-spacing-sm">
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong!">
                Salary
              </Label>
              <div className=" space-y-2">
                <InputGroup className="h-12 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    type="text"
                    placeholder="Full Time"
                    //   {...register('firstName')}
                  />
                </InputGroup>
                {/* {errors.firstName && (
                    <p className="text-sm text-red-500">
                      {errors.firstName.message}
                    </p>
                  )} */}
              </div>
            </div>
            <div className="space-y-spacing-xs ">
              <Label className=" text-label-sm font-label-sm-strong!">
                Period
              </Label>
              <div className=" space-y-2">
                <InputGroup className="h-12 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput
                    type="text"
                    placeholder=" Eg . UI/UX Designer Wanted – Join Our Creative Team!"
                    //   {...register('firstName')}
                  />
                </InputGroup>
                {/* {errors.firstName && (
                    <p className="text-sm text-red-500">
                      {errors.firstName.message}
                    </p>
                  )} */}
              </div>
            </div>
            <div className="space-y-spacing-xs col-span-2">
              <Label className=" text-label-sm font-label-sm-strong!">
                About the Role
              </Label>
              <div className=" space-y-2 ">
                <InputGroup className="rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupTextarea
                    placeholder="Write your message here..."
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
            <div className="space-y-spacing-xs col-span-2">
              <Label className=" text-label-sm font-label-sm-strong!">
                Key Responsibility
              </Label>
              <div className=" space-y-2 ">
                <InputGroup className="rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupTextarea
                    placeholder="Write your message here..."
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
            <div className="space-y-spacing-xs col-span-2">
              <Label className=" text-label-sm font-label-sm-strong!">
                Related Attachment
              </Label>
              <div className=" space-y-2 ">
                <div className=" w-full p-spacing-4xl rounded-2xl border border-dashed border-border-gray-secondary flex flex-col justify-center items-center gap-spacing-lg">
                  <div className=" w-10 h-10 border border-others-brand-light flex justify-center items-center  bg-others-brand-brand-zero rounded-lg">
                    <Folder className="text-others-brand-dark fill-others-brand-dark " />
                  </div>
                  <div className=" space-y-spacing-xs text-label-sm text-center">
                    <p>
                      <span className=" text-text-brand-secondary font-label-sm-strong!">
                        Drag & Drop
                      </span>{' '}
                      or Choose File to Upload
                    </p>
                    <p>Supported Format: SVG, JPG, PNG (up to 10mb)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex py-spacing-2xl justify-end mt-spacing-4xl gap-spacing-sm">
        <Button
          variant="outline"
          disabled
          className=" border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
        >
          Previous
        </Button>
        <Button
          onClick={() => next(2)}
          className=" bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
        >
          Continue
        </Button>
      </div>
    </>
  );
}
