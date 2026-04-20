'use client';
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
import PreviewQueryCard from '../../edit/steps/preview-query-card';
import { QueryCard } from '../../edit/steps/additional-queries';

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

export default function JobDescription({ job }: { job: JobData }) {
  const formattedSalary = job?.salary
    ? `$${job.salary.toLocaleString()} ${job.period}`
    : null;

  // Format working hours
  const workingHoursText = job?.workingHours
    ? `${job.workingHours.startTime} – ${job.workingHours.endTime}`
    : null;

  // Format weekends
  const weekendsText = job?.weekends?.length
    ? job.weekends.join(' and ')
    : null;
  return (
    <>
      <div className=" space-y-spacing-4xl pb-10">
        <div className=" grid grid-cols-3 gap-spacing-2xl">
          {/* <InfoCard
            icon={<Briefcase size={20} />}
            title="Job Category"
            subtitle={job?.category || 'Tech Lead'}
          /> */}

          {/* Workplace */}
          <InfoCard
            icon={<Building2 size={20} />}
            title="Workplace"
            subtitle={job?.workplace}
          />

          {/* Employment Type */}
          <InfoCard
            icon={<Clock size={20} />}
            title="Employment Type"
            subtitle={job?.employmentType}
          />

          {/* Salary */}
          <InfoCard
            icon={<DollarSign size={20} />}
            title="Salary"
            subtitle={formattedSalary}
          />

          <InfoCard
            icon={<Clock size={20} />}
            title="Period"
            subtitle={job?.period}
          />

          {/* Year of Experience */}
          <InfoCard
            icon={<Sun size={20} />}
            title="Year of Experience"
            subtitle={job?.yearOfExperience}
          />

          {/* Vacancy */}
          <InfoCard
            icon={<Users size={20} />}
            title="Number of Vacancy"
            subtitle={job?.vacancy}
          />

          {/* Working Days */}
          <InfoCard
            icon={<Calendar size={20} />}
            title="Working Days"
            subtitle={job?.workingDays}
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
            {job?.aboutUs || 'N/A'}
          </p>
        </div>

        <div className="space-y-spacing-2xl">
          <div className=" flex justify-between items-center gap-spacing-2xl">
            <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
              Locations
            </p>
            <p className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              {job?.location || 'N/A'}
            </p>
          </div>
          {job?.location && <MapByAddress address={job.location} />}
        </div>
        <div className="space-y-spacing-2xl">
          <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
            About the Role
          </p>
          <p className=" text-body-md text-text-gray-secondary">
            {job?.description || 'N/A'}
          </p>
        </div>
        <div className="space-y-spacing-2xl">
          <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
            Key Responsibilities
          </p>
          <p className=" text-body-md text-text-gray-secondary">
            {job?.responsibility || 'N/A'}
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
              {job?.requiredDocuments?.map((doc) => (
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
        {Boolean(job?.attachments?.length) && (
          <div className="space-y-spacing-2xl">
            <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
              Related Attachment
            </p>
            <div className=" grid grid-cols-3 gap-spacing-sm">
              {job?.attachments?.map((attachment) => (
                <div key={attachment.storageInformation.Key}>
                  <Image
                    className="w-full aspect-video rounded-md "
                    alt="Logo"
                    src={attachment.src || RelatedAttachmentDefault}
                    width={370}
                    height={214}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        <div className=" grid grid-cols-2 gap-spacing-2xl">
          <InfoCard
            icon={<Mailbox size={20} />}
            title="Contact Email"
            subtitle={job?.email}
          />

          {/* Workplace */}
          <InfoCard
            icon={<PhoneCall size={20} />}
            title="Contact Number"
            subtitle={job?.number}
          />

          {/* Employment Type */}
          {/* <InfoCard
            icon={<Globe size={20} />}
            title="Website URl"
            subtitle={'www.boottech.com'}
          /> */}
        </div>
        {Boolean(job?.additionalQueries?.length) && (
          <div className="space-y-spacing-2xl">
            <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
              Additional Queries
            </p>
            <div className=" grid grid-cols-1 gap-spacing-sm">
              {job?.additionalQueries?.map((card, idx) => (
                <PreviewQueryCard key={idx} card={card as Partial<QueryCard>} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
