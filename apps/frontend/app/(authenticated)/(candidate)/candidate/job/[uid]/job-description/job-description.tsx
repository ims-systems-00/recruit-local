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
import {
  JOB_MATCH_PART_ENUMS,
  JOB_SKILL_LEVEL_ENUMS,
  JOB_SKILL_REQUIREMENT_ENUMS,
  JobSkillResponseDto,
  MATCH_SCORE_BAND_FLOORS,
  MATCH_SCORE_SCALE,
  REQUIRED_DOCUMENTS_ENUMS,
} from '@rl/types';
import { formatMatchPercent } from '@/services/application/application.match';
import Image from 'next/image';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import RelatedAttachmentDefault from '@/public/images/related_attachment_default.png';
import MapByAddress from '@/components/map-by-address';
import DraftViewer from '@/components/draft-editor/draft-viewer';
import { cn } from '@/lib/utils';

const documentLabels: Record<REQUIRED_DOCUMENTS_ENUMS, string> = {
  [REQUIRED_DOCUMENTS_ENUMS.RESUME]: 'CV',
  [REQUIRED_DOCUMENTS_ENUMS.COVER_LETTER]: 'Cover Letter',
  [REQUIRED_DOCUMENTS_ENUMS.PORTFOLIO]: 'Portfolio',
  [REQUIRED_DOCUMENTS_ENUMS.CERTIFICATES]: 'Certificates',
};

const DEFAULT_PREVIEW_SKILLS: JobSkillResponseDto[] = [
  {
    skill: {
      _id: '1',
      name: 'Medication Administration',
    },
    level: JOB_SKILL_LEVEL_ENUMS.INTERMEDIATE,
    requirement: JOB_SKILL_REQUIREMENT_ENUMS.REQUIRED,
  },
  {
    skill: {
      _id: '2',
      name: 'Manual handling',
    },
    level: JOB_SKILL_LEVEL_ENUMS.BEGINNER,
    requirement: JOB_SKILL_REQUIREMENT_ENUMS.PREFERRED,
  },
];

// The label under the gauge: the applicant view's match bands, or nothing to
// compare yet.
const ALIGNMENT = {
  strong: { label: 'Strong Alignment', color: '#12B76A' },
  good: { label: 'Good Alignment', color: '#F79009' },
  weak: { label: 'Weak Alignment', color: '#F04438' },
  unscored: { label: 'Not scored yet', color: '#98A2B3' },
};

// The bands are on MATCH_SCORE_SCALE; a job match is a percentage.
const bandFloorPercent = (floor: number) => (floor / MATCH_SCORE_SCALE) * 100;

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

  // The viewer's match, and each part of it, 0-100. Null while their profile
  // has nothing to compare, and shown as "—".
  const overallScore = job?.matchPercentage ?? null;
  const partScore = (key: JOB_MATCH_PART_ENUMS) =>
    job?.matchBreakdown?.find((part) => part.key === key)?.percentage ?? null;
  const valueMatchScore = partScore(JOB_MATCH_PART_ENUMS.VALUES);
  const skillsScore = partScore(JOB_MATCH_PART_ENUMS.SKILLS);
  const rolesScore = partScore(JOB_MATCH_PART_ENUMS.ROLE);
  const locationScore = partScore(JOB_MATCH_PART_ENUMS.LOCATION);

  const alignment =
    overallScore == null
      ? ALIGNMENT.unscored
      : overallScore >= bandFloorPercent(MATCH_SCORE_BAND_FLOORS.strong)
        ? ALIGNMENT.strong
        : overallScore >= bandFloorPercent(MATCH_SCORE_BAND_FLOORS.good)
          ? ALIGNMENT.good
          : ALIGNMENT.weak;

  const ARC_RADIUS = 76;
  const ARC_LENGTH = Math.PI * ARC_RADIUS;
  const arcDashOffset =
    ARC_LENGTH * (1 - Math.min(Math.max(overallScore ?? 0, 0), 100) / 100);

  const hasCustomSkills = Boolean(job?.skills && job.skills.length > 0);

  const skillsToRender = hasCustomSkills ? job.skills! : DEFAULT_PREVIEW_SKILLS;

  return (
    <>
      <div className=" space-y-spacing-4xl pb-10">
        <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-lg lg:gap-spacing-4xl">
          <div className=" col-span-1 lg:col-span-2 grid md:grid-cols-2 gap-spacing-2xl">
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

          {/* Right Column: Values and Potentials Card */}
          <div className="w-full  bg-white border border-border-gray-secondary rounded-2xl p-spacing-3xl space-y-spacing-3xl shadow-xs">
            <div>
              <h3 className="text-label-xl font-label-xl-strong! text-text-gray-primary">
                Values and Potentials
              </h3>

              {/* Semicircular Gauge */}
              <div className="w-full max-w-[240px] mx-auto flex flex-col items-center">
                <svg
                  viewBox="0 0 200 120"
                  className="w-full h-auto overflow-visible"
                >
                  {/* Background Track Arc */}
                  <path
                    d="M 24 105 A 76 76 0 0 1 176 105"
                    fill="none"
                    stroke="#F1F3F5"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  {/* Active Brand Arc */}
                  <path
                    d="M 24 105 A 76 76 0 0 1 176 105"
                    fill="none"
                    stroke="var(--colors-bg-brand-solid-primary, #E60076)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={ARC_LENGTH}
                    strokeDashoffset={arcDashOffset}
                    className="transition-all duration-700 ease-out"
                  />
                  {/* Overall Match Text */}
                  <text
                    x="100"
                    y="72"
                    textAnchor="middle"
                    fill="var(--colors-text-gray-tertiary, #667085)"
                    fontSize="10"
                    fontWeight="500"
                    className="select-none font-sans"
                  >
                    Overall Match
                  </text>
                  {/* Overall Match Percentage */}
                  <text
                    x="100"
                    y="98"
                    textAnchor="middle"
                    fill="var(--colors-text-gray-primary, #101828)"
                    fontSize="24"
                    fontWeight="700"
                    className="select-none font-sans"
                  >
                    {formatMatchPercent(overallScore)}
                  </text>
                </svg>
              </div>
            </div>

            {/* Alignment Status */}
            <div className="flex items-center gap-spacing-md">
              <div
                className="size-5 rounded-full border-2 flex items-center justify-center shrink-0 font-bold text-xs select-none"
                style={{ borderColor: alignment.color, color: alignment.color }}
              >
                !
              </div>
              <span className="text-label-md font-label-md-strong! text-text-gray-primary">
                {alignment.label}
              </span>
            </div>

            {/* Breakdown Bars */}
            <div className="space-y-spacing-xl">
              {/* Value match */}
              <div className="space-y-spacing-xs">
                <div className="flex items-center gap-spacing-xs">
                  <span className="text-label-sm font-label-sm-strong! text-text-gray-secondary">
                    Value match
                  </span>
                </div>
                <div className="flex items-center gap-spacing-lg">
                  <div className="flex-1 h-2 rounded-full bg-bg-gray-soft-quaternary overflow-hidden">
                    <div
                      className="h-full bg-bg-brand-solid-primary rounded-full transition-all duration-500"
                      style={{ width: `${valueMatchScore ?? 0}%` }}
                    />
                  </div>
                  <span className="text-label-sm font-label-sm-strong! text-text-gray-tertiary w-9 text-right shrink-0">
                    {formatMatchPercent(valueMatchScore)}
                  </span>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-spacing-xs">
                <span className="text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  Skills
                </span>
                <div className="flex items-center gap-spacing-lg">
                  <div className="flex-1 h-2 rounded-full bg-bg-gray-soft-quaternary overflow-hidden">
                    <div
                      className="h-full bg-bg-brand-solid-primary rounded-full transition-all duration-500"
                      style={{ width: `${skillsScore ?? 0}%` }}
                    />
                  </div>
                  <span className="text-label-sm font-label-sm-strong! text-text-gray-tertiary w-9 text-right shrink-0">
                    {formatMatchPercent(skillsScore)}
                  </span>
                </div>
              </div>

              {/* Roles */}
              <div className="space-y-spacing-xs">
                <span className="text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  Roles
                </span>
                <div className="flex items-center gap-spacing-lg">
                  <div className="flex-1 h-2 rounded-full bg-bg-gray-soft-quaternary overflow-hidden">
                    <div
                      className="h-full bg-bg-brand-solid-primary rounded-full transition-all duration-500"
                      style={{ width: `${rolesScore ?? 0}%` }}
                    />
                  </div>
                  <span className="text-label-sm font-label-sm-strong! text-text-gray-tertiary w-9 text-right shrink-0">
                    {formatMatchPercent(rolesScore)}
                  </span>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-spacing-xs">
                <span className="text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  Location
                </span>
                <div className="flex items-center gap-spacing-lg">
                  <div className="flex-1 h-2 rounded-full bg-bg-gray-soft-quaternary overflow-hidden">
                    <div
                      className="h-full bg-bg-brand-solid-primary rounded-full transition-all duration-500"
                      style={{ width: `${locationScore ?? 0}%` }}
                    />
                  </div>
                  <span className="text-label-sm font-label-sm-strong! text-text-gray-tertiary w-9 text-right shrink-0">
                    {formatMatchPercent(locationScore)}
                  </span>
                </div>
              </div>
            </div>
          </div>
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
                <TableRow className="border-border-gray-secondary bg-bg-gray-soft-secondary">
                  <TableHead className="w-16 p-spacing-2xl text-label-sm font-label-sm-strong! text-text-gray-secondary"></TableHead>
                  <TableHead className="p-spacing-2xl text-label-sm font-label-sm-strong! text-text-gray-secondary">
                    Skills
                  </TableHead>
                  <TableHead className="w-48 p-spacing-2xl text-label-sm font-label-sm-strong! text-text-gray-secondary">
                    Required Level
                  </TableHead>
                  <TableHead className="w-40 p-spacing-2xl text-label-sm font-label-sm-strong! text-text-gray-secondary">
                    Requirements
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skillsToRender.map((skill, index) => {
                  const sl = String(index + 1).padStart(2, '0');
                  return (
                    <TableRow
                      key={skill.skill._id || index}
                      className=" border-none! hover:bg-bg-gray-soft-primary/40 transition-colors"
                    >
                      <TableCell className="w-16 p-spacing-2xl text-label-sm text-text-gray-secondary">
                        {sl}
                      </TableCell>
                      <TableCell className="p-spacing-2xl text-label-sm text-text-gray-secondary">
                        {skill.skill.name}
                      </TableCell>
                      <TableCell className="w-48 p-spacing-2xl text-label-sm text-text-gray-secondary">
                        {skill.level}
                      </TableCell>
                      <TableCell className="w-40 p-spacing-2xl">
                        <span
                          className={cn(
                            'inline-flex items-center px-spacing-md py-0.5 rounded-full text-label-xs font-label-xs-strong!',
                            skill.requirement ===
                              JOB_SKILL_REQUIREMENT_ENUMS.REQUIRED
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
      </div>
    </>
  );
}
