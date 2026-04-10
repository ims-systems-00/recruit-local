import { Button } from '@/components/ui/button';
import { JobData } from '@/services/jobs/job.type';
import {
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Briefcase,
  Users,
  Sun,
  Moon,
  Cable,
  TriangleAlert,
  Dot,
  Mailbox,
  PhoneCall,
  Globe,
} from 'lucide-react';
import moment from 'moment';
import React from 'react';
import InfoCard from './info-card';
import { REQUIRED_DOCUMENTS_ENUMS } from '@rl/types';
import Image from 'next/image';

import RelatedAttachmentDefault from '@/public/images/related_attachment_default.png';
import MapByAddress from '@/components/map-by-address';

const documentLabels: Record<REQUIRED_DOCUMENTS_ENUMS, string> = {
  [REQUIRED_DOCUMENTS_ENUMS.RESUME]: 'CV',
  [REQUIRED_DOCUMENTS_ENUMS.COVER_LETTER]: 'Cover Letter',
  [REQUIRED_DOCUMENTS_ENUMS.PORTFOLIO]: 'Portfolio',
  [REQUIRED_DOCUMENTS_ENUMS.CERTIFICATES]: 'Certificates',
};

const formatDate = (date: string | Date, format = 'MMMM D, YYYY') => {
  if (!date) return '';

  return moment(date).format(format);
};

export default function Preview({
  prev,
  defaultValues,
}: {
  prev: (step: number) => void;
  defaultValues: JobData;
}) {
  const formattedSalary = defaultValues?.salary
    ? `$${defaultValues.salary.toLocaleString()} ${defaultValues.period}`
    : null;

  // Format working hours
  const workingHoursText = defaultValues?.workingHours
    ? `${defaultValues.workingHours.startTime} – ${defaultValues.workingHours.endTime}`
    : null;

  // Format weekends
  const weekendsText = defaultValues?.weekends?.length
    ? defaultValues.weekends.join(' and ')
    : null;
  return (
    <>
      <div className=" space-y-spacing-4xl pb-10">
        <div className=" flex justify-between items-center gap-spacing-4xl">
          <div className=" space-y-spacing-2xs">
            <h4 className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
              {defaultValues.title}
            </h4>
            <p className=" text-label-sm text-text-gray-tertiary">
              Last Updated{' '}
              {defaultValues?.endDate
                ? formatDate(defaultValues.endDate)
                : 'N/A'}
            </p>
          </div>
          <div className=" flex gap-spacing-sm items-center">
            <Button
              variant="outline"
              onClick={() => prev(3)}
              className=" border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
            >
              Previous
            </Button>
            <Button
              type="submit"
              className=" bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
            >
              Post Now
            </Button>
          </div>
        </div>

        <div className=" grid grid-cols-3 gap-spacing-2xl">
          <InfoCard
            icon={<Briefcase size={20} />}
            title="Job Category"
            subtitle={defaultValues?.category || 'Tech Lead'}
          />

          {/* Workplace */}
          <InfoCard
            icon={<Building2 size={20} />}
            title="Workplace"
            subtitle={defaultValues?.workplace}
          />

          {/* Employment Type */}
          <InfoCard
            icon={<Clock size={20} />}
            title="Employment Type"
            subtitle={defaultValues?.employmentType}
          />

          {/* Salary */}
          <InfoCard
            icon={<DollarSign size={20} />}
            title="Salary"
            subtitle={formattedSalary}
          />

          {/* Year of Experience */}
          <InfoCard
            icon={<Sun size={20} />}
            title="Year of Experience"
            subtitle={defaultValues?.yearOfExperience}
          />

          {/* Vacancy */}
          <InfoCard
            icon={<Users size={20} />}
            title="Number of Vacancy"
            subtitle={defaultValues?.vacancy}
          />

          {/* Working Days */}
          <InfoCard
            icon={<Calendar size={20} />}
            title="Working Days"
            subtitle={defaultValues?.workingDays}
          />

          {/* Weekends */}
          <InfoCard
            icon={<Moon size={20} />}
            title="Weekends"
            subtitle={weekendsText}
          />

          {/* Working Hours */}
          <InfoCard
            icon={<Clock size={20} />}
            title="Working Hours"
            subtitle={workingHoursText}
          />
        </div>

        <div className="space-y-spacing-2xl">
          <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
            About Organization
          </p>
          <p className=" text-body-md text-text-gray-secondary">
            {defaultValues?.aboutUs || 'N/A'}
          </p>
        </div>

        <div className="space-y-spacing-2xl">
          <div className=" flex justify-between items-center gap-spacing-2xl">
            <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
              Locations
            </p>
            <p className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              {defaultValues?.location || 'N/A'}
            </p>
          </div>
          {defaultValues?.location && (
            <MapByAddress address={defaultValues.location} />
          )}
        </div>
        <div className="space-y-spacing-2xl">
          <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
            About the Role
          </p>
          <p className=" text-body-md text-text-gray-secondary">
            {defaultValues?.description || 'N/A'}
          </p>
        </div>
        <div className="space-y-spacing-2xl">
          <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
            Key Responsibilities
          </p>
          <p className=" text-body-md text-text-gray-secondary">
            {defaultValues?.responsibility || 'N/A'}
          </p>
        </div>

        <div className="rounded-2xl border border-border-gray-secondary p-spacing-4xl flex gap-spacing-lg items-center">
          <div className="w-12 h-12 rounded-md flex items-center justify-center border border-others-gray-light bg-others-gray-gray-zero">
            <TriangleAlert size={20} />
          </div>

          <div className="space-y-spacing-3xs">
            <p className="text-label-md font-label-md-strong! text-text-gray-primary">
              Required
            </p>
            <div className="flex items-center gap-spacing-sm">
              {defaultValues?.requiredDocuments?.map((doc) => (
                <div key={doc} className="flex items-center gap-spacing-sm">
                  <div className=" w-1.5 h-1.5 bg-fg-gray-tertiary rounded-full"></div>

                  <span className="text-label-sm text-text-gray-tertiary">
                    {documentLabels[doc as REQUIRED_DOCUMENTS_ENUMS]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-spacing-2xl">
          <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
            Related Attachment
          </p>
          <div className=" grid grid-cols-3 gap-spacing-sm">
            <div>
              <Image
                className="w-full aspect-video rounded-md "
                alt="Logo"
                src={RelatedAttachmentDefault}
                width={370}
                height={214}
              />
            </div>
            <div>
              <Image
                className="w-full aspect-video rounded-md "
                alt="Logo"
                src={RelatedAttachmentDefault}
                width={370}
                height={214}
              />
            </div>
            <div>
              <Image
                className="w-full aspect-video rounded-md "
                alt="Logo"
                src={RelatedAttachmentDefault}
                width={370}
                height={214}
              />
            </div>
          </div>
        </div>
        <div className=" grid grid-cols-3 gap-spacing-2xl">
          <InfoCard
            icon={<Mailbox size={20} />}
            title="Contact Email"
            subtitle={defaultValues?.email}
          />

          {/* Workplace */}
          <InfoCard
            icon={<PhoneCall size={20} />}
            title="Contact Number"
            subtitle={defaultValues?.number}
          />

          {/* Employment Type */}
          <InfoCard
            icon={<Globe size={20} />}
            title="Website URl"
            subtitle={'www.boottech.com'}
          />
        </div>
      </div>
    </>
  );
}
