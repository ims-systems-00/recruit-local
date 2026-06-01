import { BadgeCheck, Brain, CheckCheck, Scale, Target } from 'lucide-react';
import React from 'react';

export default function Benifits() {
  return (
    <section>
      <div className="max-w-[1280px] mx-auto px-spacing-5xl py-spacing-10xl flex flex-col gap-y-spacing-8xl">
        <div className=" flex flex-col items-center justify-center text-center gap-y-spacing-4xl">
          <p className=" text-label-sm font-label-sm-strong! text-text-brand-secondary uppercase">
            BENIFITS
          </p>
          <div className=" space-y-spacing-2xl">
            <p className=" text-heading-xl font-heading-xl-strong! max-w-[768px] text-text-gray-primary">
              Hire faster. Hire better. Hire with confidence.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-spacing-4xl">
          <CardItem
            icon={<CheckCheck className="w-6 h-6 text-others-brand-dark" />}
            title="Faster hiring"
          />
          <CardItem
            icon={<CheckCheck className="w-6 h-6 text-others-brand-dark" />}
            title="Better quality candidates"
          />
          <CardItem
            icon={<CheckCheck className="w-6 h-6 text-others-brand-dark" />}
            title="Reduced risk"
          />
          <CardItem
            icon={<CheckCheck className="w-6 h-6 text-others-brand-dark" />}
            title="Values‑based recruitment"
          />
          <CardItem
            icon={<CheckCheck className="w-6 h-6 text-others-brand-dark" />}
            title="One trusted team"
          />
        </div>
      </div>
    </section>
  );
}

const CardItem = ({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
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
      </div>
    </div>
  );
};
