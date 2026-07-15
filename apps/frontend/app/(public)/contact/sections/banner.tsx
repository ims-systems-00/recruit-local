import React from 'react';

export default function Banner() {
  return (
    <section className="bg-bg-brand-solid-alt border-b border-border-gray-secondary">
      <div className="max-w-[1280px] mx-auto px-spacing-5xl py-spacing-9xl text-white flex flex-col gap-y-spacing-4xl">
        <div className=" space-y-spacing-lg">
          <p className=" text-heading-md">
            <span className=" text-text-brand-secondary">Doubts</span>{' '}
            {`in Mind? Let’s Clear Them`}
          </p>
          <p className=" text-body-md text-text-gray-quinary">
            From guidance to a fresh start, our team is always ready to support
            you.
          </p>
        </div>
      </div>
    </section>
  );
}
