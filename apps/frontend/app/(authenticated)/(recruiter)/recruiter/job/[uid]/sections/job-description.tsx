import { Button } from '@/components/ui/button';
import { Bookmark, Cable, MousePointerClick, Share2 } from 'lucide-react';
import React from 'react';

export default function JobDescription() {
  return (
    <div className=" space-y-spacing-4xl">
      <div className="space-y-spacing-2xl">
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
  );
}
