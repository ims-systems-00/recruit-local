import { Button } from '@/components/ui/button';
import { Bookmark, Cable, MousePointerClick, Share2 } from 'lucide-react';
import React from 'react';

export default function Preview({ prev }: { prev: (step: number) => void }) {
  return (
    <>
      <div className=" space-y-spacing-4xl">
        <div className=" flex justify-between items-center gap-spacing-4xl">
          <div className=" space-y-spacing-2xs">
            <h4 className=" text-body-lg font-body-lg-strong! text-text-gray-primary">
              UI/UX Designer Wanted – Join Our Creative Team!
            </h4>
            <p className=" text-body-sm text-text-gray-tertiary">
              25 July, 2025 | 10 : 03 am
            </p>
          </div>
          <div className=" flex gap-spacing-sm items-center">
            <Button
              variant="outline"
              className=" flex gap-spacing-2xs items-center border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
            >
              <Share2 />
            </Button>
            <Button
              variant="outline"
              className=" flex gap-spacing-2xs items-center border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
            >
              <Bookmark />
              save
            </Button>
            <Button className="flex gap-spacing-2xs items-center bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!">
              <MousePointerClick /> Apply Now
            </Button>
          </div>
        </div>
        <div className="space-y-spacing-2xl">
          <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
            Basic Information
          </p>
          <div className=" grid grid-cols-3 gap-spacing-lg">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className=" rounded-2xl border border-border-gray-secondary p-spacing-4xl flex gap-spacing-lg items-center"
              >
                <div className=" w-8 h-8 rounded-md flex items-center justify-center border border-others-gray-light bg-others-gray-gray-zero ">
                  <Cable />
                </div>
                <div className=" space-y-spacing-3xs">
                  <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
                    Full Time
                  </p>
                  <p className=" text-label-sm text-text-gray-tertiary">
                    Employment Type
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-spacing-2xl">
          <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
            Locations
          </p>
          <div className=" rounded-lg border border-border-gray-secondary">
            Google map
          </div>
        </div>
        <div className="space-y-spacing-2xl">
          <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
            Job Description
          </p>
          <div className=" space-y-spacing-lg">
            <div className=" space-y-spacing-2xs">
              <p className=" text-label-md font-body-md-strong! text-text-gray-secondary">
                About the role
              </p>
              <p className=" text-body-md text-text-gray-secondary">
                As a UI/UX Designer, you will be at the heart of our product
                design process. You will lead the design of user interfaces that
                are not only visually appealing but also intuitive, accessible,
                and user-centered. This role requires a creative thinker who can
                transform complex problems into elegant design solutions.
              </p>
            </div>
            <div className=" space-y-spacing-2xl">
              <p className=" text-label-md text-text-gray-secondary">
                Key Responsibility
              </p>
              <ul className=" list-disc list-inside text-text-gray-secondary text-body-md">
                <li>
                  Conduct user research, competitor analysis, and market trend
                  analysis.
                </li>
                <li>
                  Conduct user research, competitor analysis, and market trend
                  analysis.
                </li>
                <li>
                  Conduct user research, competitor analysis, and market trend
                  analysis.
                </li>
                <li>
                  Conduct user research, competitor analysis, and market trend
                  analysis.
                </li>
              </ul>
            </div>
            <div className=" grid grid-cols-2 gap-spacing-lg">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className=" rounded-2xl border border-border-gray-secondary p-spacing-4xl flex gap-spacing-lg items-center"
                >
                  <div className=" w-8 h-8 rounded-md flex items-center justify-center border border-others-gray-light bg-others-gray-gray-zero ">
                    <Cable />
                  </div>
                  <div className=" space-y-spacing-3xs">
                    <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
                      Full Time
                    </p>
                    <p className=" text-label-sm text-text-gray-tertiary">
                      Employment Type
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex py-spacing-2xl justify-end mt-spacing-4xl gap-spacing-sm">
        <Button
          variant="outline"
          onClick={() => prev(3)}
          className=" border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
        >
          Previous
        </Button>
        <Button className=" bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!">
          Continue
        </Button>
      </div>
    </>
  );
}
