'use client';
import React from 'react';
import Banner from './sections/banner';
import Benifits from './sections/benifits';
import PricingCardItem from './sections/pricing-card-item';
import { CheckCheck } from 'lucide-react';

const features = [
  {
    feature: 'Job postings',
    starterPlan: true,
    proPlan: true,
    premiumPlan: true,
  },
  {
    feature: 'AI skills + values matching',
    starterPlan: true,
    proPlan: true,
    premiumPlan: true,
  },
  {
    feature: 'Candidate dashboard',
    starterPlan: true,
    proPlan: true,
    premiumPlan: true,
  },
  {
    feature: 'Email Support',
    starterPlan: true,
    proPlan: true,
    premiumPlan: true,
  },
  {
    feature: 'Priority support',
    starterPlan: false,
    proPlan: true,
    premiumPlan: true,
  },
  {
    feature: 'Featured listings',
    starterPlan: false,
    proPlan: true,
    premiumPlan: true,
  },
  {
    feature: 'Values-based insights',
    starterPlan: false,
    proPlan: true,
    premiumPlan: true,
  },
  {
    feature: 'Enhanced AI shortlisting',
    starterPlan: false,
    proPlan: true,
    premiumPlan: true,
  },
  {
    feature: 'Dedicated RecruitLocal contact',
    starterPlan: false,
    proPlan: false,
    premiumPlan: true,
  },
  {
    feature: 'Professional HR advice',
    starterPlan: false,
    proPlan: false,
    premiumPlan: true,
  },
  {
    feature: 'End-to-end recruitment support',
    starterPlan: false,
    proPlan: false,
    premiumPlan: true,
  },
];

export default function PricingPage() {
  return (
    <div>
      <Banner />
      <div className="max-w-[1280px] mx-auto px-spacing-5xl py-spacing-10xl space-y-spacing-9xl">
        <div className=" flex flex-col items-center justify-center text-center gap-y-spacing-3xl">
          <p className=" text-label-sm font-label-sm-strong! text-text-brand-secondary">
            PRICING
          </p>
          <p className=" text-heading-lg font-heading-lg-strong! text-text-gray-primary">
            Pick Your Hiring Plan
          </p>
          <p className=" text-body-md text-text-gray-secondary">
            Try our basic plan risk free for 30 days . Switch plans or cancel
            any time
          </p>
          <div className="flex items-center h-12 justify-center gap-spacing-xs py-spacing-xl px-spacing-2xl bg-bg-gray-soft-secondary border border-border-gray-secondary rounded-full">
            <span className=" h-9 inline-flex items-center justify-center rounded-full px-spacing-lg text-label-md font-label-md-strong! text-text-gray-quaternary">
              Monthly
            </span>
            <span className=" bg-bg-gray-soft-quaternary gap-spacing-sm h-9 inline-flex items-center justify-center rounded-full px-spacing-lg text-label-md font-label-md-strong! text-text-gray-quaternary">
              Yearly{' '}
              <span className=" flex items-center justify-center rounded-full h-6 bg-bg-white text-others-gray-dark px-spacing-md text-label-sm font-label-sm-strong!">
                Save 35%
              </span>
            </span>
          </div>
        </div>
        <div className=" space-y-spacing-7xl">
          <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-4xl items-center">
            <PricingCardItem
              isPopular={false}
              title="Starter Plan"
              price="0"
              subtitle="Best for Start"
              buttonText="Get Started"
              onClickFunction={() => {}}
            />
            <PricingCardItem
              isPopular={true}
              title="Pro Plan"
              price="39.99"
              subtitle="Best for growing teams"
              buttonText="Explore Premium"
              onClickFunction={() => {}}
            />
            <PricingCardItem
              isPopular={false}
              title="Premium Plan"
              price="59.99"
              subtitle="Best for hands‑on support"
              buttonText="Choose Pro"
              onClickFunction={() => {}}
            />
          </div>
          <div className=" overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className=" border-b border-border-gray-secondary bg-bg-gray-soft-secondary">
                  <th className=" whitespace-nowrap text-left p-spacing-2xl text-label-lg font-label-lg-strong! text-text-gray-secondary">
                    <span className=" flex w-full border-r border-border-gray-primary">
                      Features
                    </span>
                  </th>
                  <th className=" whitespace-nowrap text-left p-spacing-2xl text-label-lg font-label-lg-strong! text-text-gray-secondary">
                    <span className="flex w-full border-r border-border-gray-primary">
                      Starter Plan
                    </span>
                  </th>
                  <th className=" whitespace-nowrap text-left p-spacing-2xl text-label-lg font-label-lg-strong! text-text-gray-secondary">
                    <span className="flex w-full border-r border-border-gray-primary">
                      Pro Plan
                    </span>
                  </th>
                  <th className=" whitespace-nowrap text-left p-spacing-2xl text-label-lg font-label-lg-strong! text-text-gray-secondary">
                    <span className="flex w-full">Premium Plan</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr
                    key={index}
                    className=" border-b border-border-gray-secondary"
                  >
                    <td className=" whitespace-nowrap text-left p-spacing-2xl text-label-lg font-label-lg-strong! text-text-gray-secondary">
                      <span className=" flex w-full ">{feature.feature}</span>
                    </td>
                    <td className=" whitespace-nowrap text-left p-spacing-2xl text-label-lg font-label-lg-strong! text-text-gray-secondary">
                      {feature.starterPlan ? (
                        <span className=" flex w-6 h-6 items-center justify-center rounded-full border border-others-brand-light bg-others-brand-brand-zero">
                          <CheckCheck className="size-3 text-others-brand-default" />
                        </span>
                      ) : (
                        <span className="flex w-6 h-6 items-center justify-center text-others-gray-default">
                          -
                        </span>
                      )}
                    </td>
                    <td className=" whitespace-nowrap text-left p-spacing-2xl text-label-lg font-label-lg-strong! text-text-gray-secondary">
                      {feature.proPlan ? (
                        <span className=" flex w-6 h-6 items-center justify-center rounded-full border border-others-brand-light bg-others-brand-brand-zero">
                          <CheckCheck className="size-3 text-others-brand-default" />
                        </span>
                      ) : (
                        <span className="flex w-6 h-6 items-center justify-center text-others-gray-default">
                          -
                        </span>
                      )}
                    </td>
                    <td className=" whitespace-nowrap text-left p-spacing-2xl text-label-lg font-label-lg-strong! text-text-gray-secondary">
                      {feature.premiumPlan ? (
                        <span className=" flex w-6 h-6 items-center justify-center rounded-full border border-others-brand-light bg-others-brand-brand-zero">
                          <CheckCheck className="size-3 text-others-brand-default" />
                        </span>
                      ) : (
                        <span className="flex w-6 h-6 items-center justify-center text-others-gray-default">
                          -
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Benifits />
    </div>
  );
}
