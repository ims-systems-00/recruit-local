'use client';
import { JobData, JobSkillItem } from '@/services/jobs/job.type';
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
  Lock,
  Target,
} from 'lucide-react';
import moment from 'moment';
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import InfoCard from './info-card';
import { REQUIRED_DOCUMENTS_ENUMS } from '@rl/types';
import Image from 'next/image';

import RelatedAttachmentDefault from '@/public/images/related_attachment_default.png';
import MapByAddress from '@/components/map-by-address';
import PreviewQueryCard from '../../edit/steps/preview-query-card';
import { QueryCard } from '../../edit/steps/additional-queries';
import DraftViewer from '@/components/draft-editor/draft-viewer';
import { cn } from '@/lib/utils';

const documentLabels: Record<REQUIRED_DOCUMENTS_ENUMS, string> = {
  [REQUIRED_DOCUMENTS_ENUMS.RESUME]: 'CV',
  [REQUIRED_DOCUMENTS_ENUMS.COVER_LETTER]: 'Cover Letter',
  [REQUIRED_DOCUMENTS_ENUMS.PORTFOLIO]: 'Portfolio',
  [REQUIRED_DOCUMENTS_ENUMS.CERTIFICATES]: 'Certificates',
};

const PREVIEW_VALUE_CATEGORIES = [
  {
    id: 'culture-and-behavior',
    name: 'Culture & Behavior',
    icon: (
      <svg
        className="size-5 text-fg-gray-secondary"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m19 20-7-14-7 14h14Z" />
        <path d="M12 6v14" />
      </svg>
    ),
    defaultValues: [
      { name: 'Empathy' },
      { name: 'Integrity' },
      { name: 'Respect' },
      { name: 'Transparency' },
    ],
  },
  {
    id: 'mindset',
    name: 'Mindset',
    icon: (
      <svg
        className="size-5 text-fg-gray-secondary"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 4v16" />
        <path d="M12 12c-2.5-4-7-4-7 0s4 4.5 7 1" />
        <path d="M12 13c-3.5 3-5 7-2 7s5-3.5 2-7" />
        <path d="M12 12c2.5-4 7-4 7 0s-4 4.5-7 1" />
        <path d="M12 13c3.5 3 5 7 2 7s-5-3.5-2-7" />
      </svg>
    ),
    defaultValues: [
      { name: 'Growth-oriented' },
      { name: 'Entrepreneurial' },
      { name: 'Proactive' },
      { name: 'Resilient' },
      { name: 'Problem solve' },
    ],
  },
  {
    id: 'working-style',
    name: 'Working Style',
    icon: (
      <svg
        className="size-5 text-fg-gray-secondary"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="5" r="2" />
        <path d="m9 20 3-6 3 2 2 4" />
        <path d="m6 16 3-4 3 1" />
        <path d="m14 10 3-2" />
      </svg>
    ),
    defaultValues: [
      { name: 'Ownership mentality' },
      { name: 'Collaborative' },
      { name: 'independent' },
    ],
  },
  {
    id: 'leadership',
    name: 'Leadership & Team Dynamics',
    icon: (
      <svg
        className="size-5 text-fg-gray-secondary"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="10" cy="8" r="4" />
        <path d="M4 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <path d="M18 8a6 6 0 0 1 0 8" />
        <path d="M20 6a9 9 0 0 1 0 12" />
      </svg>
    ),
    defaultValues: [
      { name: 'Mentorship' },
      { name: 'Coaching culture' },
      { name: 'Empowerment' },
    ],
  },
  {
    id: 'motivation',
    name: 'Purpose & Motivation',
    icon: <Target className="size-5 text-fg-gray-secondary" />,
    defaultValues: [{ name: 'Career progression' }],
  },
];

const DEFAULT_PREVIEW_SKILLS: JobSkillItem[] = [
  {
    id: '1',
    name: 'Medication Administration',
    level: 'Intermediate',
    requirement: 'Required',
  },
  {
    id: '2',
    name: 'Manual handling',
    level: 'Beginner',
    requirement: 'Preferred',
  },
];

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
  const hasCustomValues = Boolean(job?.values && job.values.length > 0);

  const categoriesToRender = PREVIEW_VALUE_CATEGORIES.map((cat) => {
    const matched =
      job?.values?.filter(
        (v) =>
          v.category === cat.id ||
          v.category?.toLowerCase() === cat.name.toLowerCase(),
      ) || [];
    return {
      ...cat,
      values: hasCustomValues ? matched : cat.defaultValues,
    };
  }).filter((cat) => cat.values.length > 0);

  const hasCustomSkills = Boolean(job?.skills && job.skills.length > 0);

  const skillsToRender = hasCustomSkills ? job.skills! : DEFAULT_PREVIEW_SKILLS;

  return (
    <>
      <div className=" space-y-spacing-4xl pb-10">
        <div className=" grid md:grid-cols-2 lg:grid-cols-3 gap-spacing-2xl">
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
            title="Working Period"
            subtitle={job?.period}
          />

          {/* Year of Experience */}
          <InfoCard
            icon={<Sun size={20} />}
            title="Years of Experience"
            subtitle={job?.yearOfExperience}
          />

          {/* Vacancy */}
          <InfoCard
            icon={<Users size={20} />}
            title="Number of Vacancy"
            subtitle={job?.vacancy}
          />

          {/* Working Day(s) per Week */}
          <InfoCard
            icon={<Calendar size={20} />}
            title="Working Day(s) per Week"
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
            About Organisation
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
          <DraftViewer content={job?.description} />
        </div>

        {/* Values and Potentials (bottom of About the Role) */}
        <div className="space-y-spacing-2xl">
          <div className="flex items-center gap-spacing-sm">
            <p className="text-label-lg font-label-lg-strong! text-text-gray-primary">
              Values and Potentials
            </p>
            <span className="inline-flex items-center gap-1 px-spacing-sm py-0.5 rounded-full text-label-xs font-label-xs-strong! bg-pink-50 text-pink-600 border border-pink-200">
              <Lock className="size-3 text-pink-600" />
              Recruiters only
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-2xl">
            {categoriesToRender.map((cat) => (
              <div
                key={cat.id}
                className="rounded-2xl border border-border-gray-secondary bg-white p-spacing-4xl space-y-spacing-4xl"
              >
                <div className="flex items-center gap-spacing-2xl">
                  <div className="flex size-10 items-center justify-center rounded-lg border border-others-gray-light bg-others-gray-gray-zero">
                    {cat.icon}
                  </div>
                  <p className="text-label-md font-label-md-strong! text-text-gray-primary">
                    {cat.name}
                  </p>
                </div>
                <div className="flex flex-wrap gap-spacing-sm">
                  {cat.values.map((v, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-lg border border-border-gray-secondary bg-white px-spacing-md py-spacing-xs text-label-xs font-label-xs-strong! text-text-gray-secondary"
                    >
                      {v.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-spacing-2xl">
          <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
            Key Responsibilities
          </p>
          <DraftViewer content={job?.responsibility} />
        </div>

        {/* Skills & Requirements (bottom of Key Responsibilities) */}
        <div className="space-y-spacing-2xl">
          <p className="text-label-lg font-label-lg-strong! text-text-gray-primary">
            Skills &amp; Requirements
          </p>

          <div className="overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow className="border-border-gray-secondary bg-bg-gray-soft-primary hover:bg-bg-gray-soft-primary">
                  <TableHead className="w-16 px-spacing-4xl py-spacing-md text-label-sm font-label-sm-strong! text-text-gray-secondary"></TableHead>
                  <TableHead className="px-spacing-4xl py-spacing-md text-label-sm font-label-sm-strong! text-text-gray-secondary">
                    Skills
                  </TableHead>
                  <TableHead className="w-48 px-spacing-4xl py-spacing-md text-label-sm font-label-sm-strong! text-text-gray-secondary">
                    Required Level
                  </TableHead>
                  <TableHead className="w-40 px-spacing-4xl py-spacing-md text-label-sm font-label-sm-strong! text-text-gray-secondary">
                    Requirements
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skillsToRender.map((skill, index) => {
                  const sl = String(index + 1).padStart(2, '0');
                  return (
                    <TableRow
                      key={skill.id || index}
                      className=" border-none! hover:bg-bg-gray-soft-primary/40 transition-colors"
                    >
                      <TableCell className="w-16 px-spacing-4xl py-spacing-md text-label-sm text-text-gray-secondary">
                        {sl}
                      </TableCell>
                      <TableCell className="px-spacing-4xl py-spacing-md text-label-sm text-text-gray-secondary">
                        {skill.name}
                      </TableCell>
                      <TableCell className="w-48 px-spacing-4xl py-spacing-md text-label-sm text-text-gray-secondary">
                        {skill.level}
                      </TableCell>
                      <TableCell className="w-40 px-spacing-4xl py-spacing-md">
                        <span
                          className={cn(
                            'inline-flex items-center px-spacing-md py-0.5 rounded-full text-label-xs font-label-xs-strong!',
                            skill.requirement === 'Required'
                              ? 'bg-pink-50 text-pink-600 border border-pink-200'
                              : 'bg-bg-gray-soft-secondary text-text-gray-secondary border border-border-gray-secondary',
                          )}
                        >
                          {skill.requirement}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
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
              Related Attachment(s)
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
        <div className=" grid grid-cols-1 sm:grid-cols-2 gap-spacing-2xl">
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
