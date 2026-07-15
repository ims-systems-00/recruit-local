'use client';

import Image from 'next/image';

import Avatar1 from '@/public/images/stats1.png';
import Avatar2 from '@/public/images/stats2.png';
import Avatar3 from '@/public/images/stats3.png';
import Avatar4 from '@/public/images/stats4.png';

export default function StatSection() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 min-h-[400px] lg:max-h-[400px] gap-spacing-3xl">
        <div className="flex items-center flex-col gap-spacing-4xl p-spacing-5xl h-full bg-bg-gray-solid-secondary rounded-2xl ">
          <div className="pb-spacing-4xl px-spacing-4xl">
            <div className=" min-w-40 min-h-40 max-w-40 max-h-40  flex justify-center items-center">
              <div className=" min-w-30 min-h-30 w-30 h-30 rounded-full border border-dashed border-border-gray-secondary relative">
                <span className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <Image
                    src={Avatar3}
                    alt="avatar"
                    width={36}
                    height={36}
                    className="  w-9 h-9 max-w-9 max-h-9 object-cover rounded-lg border border-border-gray-secondary"
                  />
                </span>
                <span className="absolute -left-5 bottom-3">
                  <Image
                    src={Avatar2}
                    alt="avatar"
                    width={36}
                    height={36}
                    className=" w-9 h-9 max-w-9 max-h-9 object-cover rounded-lg border border-border-gray-secondary"
                  />
                </span>
                <span className="absolute -right-5 bottom-3">
                  <Image
                    src={Avatar4}
                    alt="avatar"
                    width={36}
                    height={36}
                    className=" w-9 h-9 max-w-9 max-h-9 object-cover rounded-lg border border-border-gray-secondary"
                  />
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-spacing-3xl text-center">
            <p className="text-heading-lg font-heading-lg-strong! text-white tracking-tight">
              1,800+
            </p>
            <p className="text-body-sm">Successful Local Hires</p>
          </div>
        </div>

        <div className="flex flex-col gap-spacing-3xl h-full">
          <div className="rounded-2xl p-spacing-4xl flex-1 space-y-spacing-3xl bg-bg-brand-solid-primary">
            <p className="text-label-xs font-label-xs-strong! uppercase">
              Unique Assessments
            </p>
            <h2 className="text-heading-md font-heading-md-strong! text-white">
              Value Based
            </h2>
            <p className="text-body-sm text-white">
              Countless applicants continue to pursue opportunities using our
              platform's support.
            </p>
          </div>
          <div className="relative rounded-2xl overflow-hidden flex-1 min-h-[190px]">
            <Image
              src={Avatar1}
              alt="avatar"
              width={292}
              height={190}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-spacing-3xl -translate-x-1/2 left-1/2 text-center space-y-spacing-sm">
              <p className="text-heading-lg font-heading-lg-strong! text-white">
                2500+
              </p>
              <p className="text-body-sm text-white">Job Seekers </p>
            </div>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-white h-full min-h-[400px]">
          <Image
            src={Avatar3}
            alt="avatar"
            width={292}
            height={400}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-spacing-3xl -translate-x-1/2 left-1/2 text-center space-y-spacing-sm">
            <p className="text-heading-lg font-heading-lg-strong! text-white">
              350+
            </p>
            <p className="text-body-sm text-white">Employers</p>
          </div>
        </div>

        <div className="flex flex-col gap-spacing-3xl h-full">
          <div className="relative rounded-2xl overflow-hidden flex-1 min-h-[190px]">
            <Image
              src={Avatar4}
              alt="avatar"
              width={292}
              height={190}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-spacing-3xl -translate-x-1/2 left-1/2 text-center space-y-spacing-sm">
              <p className="text-heading-lg font-heading-lg-strong! text-white">
                12,000+
              </p>
              <p className="text-body-sm text-white">Applications</p>
            </div>
          </div>
          <div className="rounded-2xl p-spacing-4xl flex-1 space-y-spacing-3xl bg-bg-gray-solid-secondary">
            <p className="text-label-xs font-label-xs-strong! text-text-gray-quinary uppercase">
              AI Integration
            </p>
            <h2 className="text-heading-md font-heading-md-strong! text-text-brand-secondary">
              Alice AI
            </h2>
            <p className="text-body-sm text-text-gray-quinary">
              Streamlining Sales Hiring to Boost Your Growth
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
