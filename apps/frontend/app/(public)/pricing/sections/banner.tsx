import React from 'react';

export default function Banner() {
  return (
    <section className="bg-bg-brand-solid-alt border-b border-border-gray-secondary">
      <div className="max-w-[1280px] mx-auto px-spacing-5xl py-spacing-9xl text-white flex flex-col gap-y-spacing-4xl">
        <div className=" space-y-spacing-lg">
          <p className=" text-heading-md">
            <span className=" text-text-brand-secondary">Flexible</span> pricing
            for employers
          </p>
          <p className=" text-body-md text-text-gray-quinary">
            Flexible pricing options for every stage of your hiring journey.
          </p>
        </div>
      </div>
    </section>
  );
}
