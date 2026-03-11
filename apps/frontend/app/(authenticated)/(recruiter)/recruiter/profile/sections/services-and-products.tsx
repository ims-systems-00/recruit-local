import React from 'react';

export default function ServicesAndProducts() {
  return (
    <div className=" space-y-spacing-4xl">
      <div className=" flex justify-between items-center">
        <h4 className=" text-text-gray-secondary text-heading-sm font-heading-sm-strong!">
          Services and Products
        </h4>
      </div>
      <div className=" space-y-spacing-2xl">
        <div className=" space-y-spacing-lg">
          <p className=" text-label-lg font-label-lg-strong! text-text-gray-secondary">
            Mission Statement
          </p>
          <p className=" text-body-lg text-text-gray-tertiary">
            To empower businesses and individuals by delivering smart, scalable,
            and user-focused technology solutions that drive growth, efficiency,
            and innovation.
          </p>
        </div>
        <div className=" space-y-spacing-lg">
          <p className=" text-label-lg font-label-lg-strong! text-text-gray-secondary">
            Vision Statement
          </p>
          <p className=" text-body-lg text-text-gray-tertiary">
            To empower businesses and individuals by delivering smart, scalable,
            and user-focused technology solutions that drive growth, efficiency,
            and innovation.
          </p>
        </div>
        <div className=" grid grid-cols-2 gap-spacing-2xl items-center">
          <div className=" space-y-spacing-lg">
            <p className=" text-label-lg font-label-lg-strong! text-text-gray-secondary">
              Mission Statement
            </p>
            <ul className=" list-disc list-inside text-text-gray-secondary text-body-md">
              <li>Custom Software & App Development</li>
              <li>UI/UX Design</li>
              <li>AI & Automation Solutions</li>
              <li>Cloud & DevOps</li>
              <li>IT Consulting</li>
            </ul>
          </div>
          <div className=" space-y-spacing-lg">
            <p className=" text-label-lg font-label-lg-strong! text-text-gray-secondary">
              Core Products
            </p>
            <ul className=" list-decimal list-inside text-text-gray-secondary text-body-md">
              <li>Custom Software & App Development</li>
              <li>UI/UX Design</li>
              <li>AI & Automation Solutions</li>
              <li>Cloud & DevOps</li>
              <li>IT Consulting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
