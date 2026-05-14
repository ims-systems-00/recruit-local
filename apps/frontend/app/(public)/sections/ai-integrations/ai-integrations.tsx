import { HeartHandshake, MapPin, Target } from 'lucide-react';
import React from 'react';

export default function AiIntegrations() {
  return (
    <section>
      <div className="max-w-[1280px] mx-auto px-spacing-5xl py-spacing-10xl flex flex-col gap-y-spacing-8xl">
        <div className=" flex flex-col items-center justify-center text-center gap-y-spacing-4xl">
          <p className=" text-label-sm font-label-sm-strong! text-text-brand-secondary uppercase">
            AI INTEGRATIONS
          </p>
          <div className=" space-y-spacing-2xl">
            <p className=" text-heading-xl font-heading-xl-strong! max-w-[768px] text-text-gray-primary">
              Powered by Alice AI
            </p>
            <p className="text-body-md text-text-gray-secondary max-w-[768px]">
              Ethical. Transparent. Designed to support people — not replace
              them.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-spacing-4xl">
          <CardItem
            icon={<Target className="w-6 h-6 text-others-brand-dark" />}
            title="Skills and experience"
            description="We look beyond keywords to understand your true capabilities and potential."
          />
          <CardItem
            icon={<MapPin className="w-6 h-6 text-others-brand-dark" />}
            title="Location and availability"
            description="Prioritizing local connections that respect your time and community ties."
          />
          <CardItem
            icon={<HeartHandshake className="w-6 h-6 text-others-brand-dark" />}
            title="Values and Culture"
            description="Preferences for workplace behaviors that lead to better long-term happiness."
          />
          <CardItem
            icon={<HeartHandshake className="w-6 h-6 text-others-brand-dark" />}
            title="Values and Culture"
            description="Preferences for workplace behaviors that lead to better long-term happiness."
          />
        </div>
      </div>
    </section>
  );
}

const CardItem = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <div className="bg-bg-gray-soft-primary rounded-2xl p-spacing-4xl border border-border-gray-secondary space-y-spacing-3xl">
      <div className=" w-12 h-12 bg-others-brand-brand-zero rounded-full flex items-center justify-center border border-others-brand-light">
        {icon}
      </div>
      <div className="space-y-spacing-2xl">
        <p className="text-body-lg font-body-lg-strong! text-text-gray-primary">
          {title}
        </p>
        <p className="text-body-md text-text-gray-secondary">{description}</p>
      </div>
    </div>
  );
};
