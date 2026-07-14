import { BadgeCheck, Brain, Scale, Target } from 'lucide-react';
import Link from 'next/link';
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
            <p className=" text-heading-md md:text-heading-xl font-heading-xl-strong! max-w-[768px] text-text-gray-primary">
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
            title="Skills + Values matching"
            description="Deeper intelligence for better fit and long- term retention."
          />
          <CardItem
            icon={<Scale className="w-6 h-6 text-others-brand-dark" />}
            title="Reduced Bias"
            description="Focusing on what truly matters to remove unfair hiring barriers."
          />
          <CardItem
            icon={<BadgeCheck className="w-6 h-6 text-others-brand-dark" />}
            title="Quality over Quantity"
            description="Stop filtering noise. Alice presents only the best matches."
          />
          <CardItem
            icon={<Brain className="w-6 h-6 text-others-brand-dark" />}
            title="Continuous Learning"
            description="Alice improves with every successful hire your team makes."
          />
        </div>
        <Link
          href="/login"
          className="text-label-md rounded-full font-label-md-strong! flex items-center h-12 justify-center gap-spacing-xs py-spacing-xl px-spacing-3xl bg-bg-brand-solid-primary text-text-white w-fit mx-auto"
        >
          {`Let’s Get Start`}
        </Link>
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
