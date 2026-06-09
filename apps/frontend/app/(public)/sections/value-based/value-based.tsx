import { HeartHandshake, MapPin, Target } from 'lucide-react';
import React from 'react';

export default function ValueBased() {
  return (
    <section className="bg-bg-brand-solid-alt">
      <div className="max-w-[1280px] mx-auto px-spacing-5xl py-spacing-10xl text-white flex flex-col gap-y-spacing-8xl">
        <div className=" flex flex-col items-center justify-center text-center gap-y-spacing-4xl">
          <p className=" text-label-sm font-label-sm-strong! text-text-brand-secondary uppercase">
            VALUE BASED ASSESSMENT
          </p>
          <div className=" space-y-spacing-2xl">
            <p className=" text-heading-xl font-heading-xl-strong! max-w-[768px]">
              Not Just matching skills Matching Values
            </p>
            <p className="text-body-md text-text-gray-quinary max-w-[768px]">
              Stronger teams, better retention, inclusive hiring and better
              long‑term outcomes.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-4xl">
          <ValueCard
            icon={<Target className="w-6 h-6 text-white" />}
            title="Skills and experience"
            description="We look beyond keywords to understand your true capabilities and potential."
          />
          <ValueCard
            icon={<MapPin className="w-6 h-6 text-white" />}
            title="Location and availability"
            description="Prioritizing local connections that respect your time and community ties."
          />
          <ValueCard
            icon={<HeartHandshake className="w-6 h-6 text-white" />}
            title="Values and Culture"
            description="Preferences for workplace behaviors that lead to better long-term happiness."
          />
        </div>
      </div>
    </section>
  );
}

const ValueCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <div className="bg-bg-gray-solid-secondary rounded-4xl p-spacing-5xl border border-alpha-white-20 space-y-spacing-3xl">
      <div className=" w-12 h-12 bg-bg-brand-solid-primary rounded-full flex items-center justify-center">
        {icon}
      </div>
      <div className="space-y-spacing-2xl">
        <p className="text-body-lg font-body-lg-strong!">{title}</p>
        <p className="text-body-md text-text-gray-quinary">{description}</p>
      </div>
    </div>
  );
};
