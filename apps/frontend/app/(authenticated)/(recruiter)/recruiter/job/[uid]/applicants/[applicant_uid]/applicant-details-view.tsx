'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Copy, Download, Check, Info } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, cn } from '@/lib/utils';
import { Application } from '@/services/application/application.type';
import {
  formatMatchPercent,
  overallMatchPercent,
  partMatchPercent,
  toMatchPercent,
} from '@/services/application/application.match';
import { JobData } from '@/services/jobs/job.type';
import {
  APPLICATION_MATCH_PART_ENUMS,
  MATCH_SCORE_BAND_FLOORS,
  QUERY_TYPE_ENUMS,
  VALUE_TYPE_LABELS,
} from '@rl/types';

type ApplicantDetailsViewProps = {
  jobId: string;
  applicantId: string;
  jobData?: JobData | null;
  applicationData?: Application | null;
};

const DEFAULT_COVER_LETTER =
  'Dear Hiring Manager,I am excited to apply for the UI/UX Designer position at CreativeTech Ltd. With my background in user interface design, prototyping, and usability testing, I am confident I can create designs that enhance user experience and align with your company’s vision. I admire CreativeTech’s innovative approach to digital products and would be glad to bring my creativity and skills to your team.';

const DEFAULT_PORTFOLIO_URL = 'www.designs/pias.com';

const DEFAULT_CASE_STUDIES = [
  { name: 'customer_journey_v1.pdf', size: '100KB' },
  { name: 'user_research_insights.pdf', size: '100KB' },
  { name: 'ux_strategy_deck_2023.pdf', size: '100KB' },
];

// The label under the gauge: the overview's match bands, or not scored yet.
const ALIGNMENT = {
  strong: { label: 'Strong Alignment', color: '#12B76A' },
  good: { label: 'Good Alignment', color: '#F79009' },
  weak: { label: 'Weak Alignment', color: '#F04438' },
  unscored: { label: 'Not scored yet', color: '#98A2B3' },
};

const APPLICANT_SKILLS_DATA = [
  {
    id: 1,
    name: 'Medication Administration',
    level: 'Intermediate',
  },
  {
    id: 2,
    name: 'Manual handling',
    level: 'Beginner',
  },
  {
    id: 3,
    name: 'Personal care',
    level: 'Advance',
  },
  {
    id: 4,
    name: 'Dosage Calculation',
    level: 'Beginner',
  },
  {
    id: 5,
    name: 'Prescription Management',
    level: 'Beginner',
  },
  {
    id: 6,
    name: 'Pharmaceutical Dispensing',
    level: 'Advance',
  },
];

const ALL_SKILLS_MODAL_DATA = [
  { id: 1, title: '1. Medication Administration', level: 'Intermediate' },
  { id: 2, title: '2. Manual handling', level: 'Beginner' },
  { id: 3, title: '3. Personal care', level: 'Advance' },
  { id: 4, title: '4. Dosage Calculation', level: 'Beginner' },
  { id: 5, title: '5. Prescription Management', level: 'Beginner' },
  { id: 6, title: '5. Prescription Management', level: 'Advance' },
  { id: 7, title: '5. Prescription Management', level: 'Beginner' },
  { id: 8, title: '5. Prescription Management', level: 'Intermediate' },
  { id: 9, title: '5. Prescription Management', level: 'Beginner' },
  { id: 10, title: '5. Prescription Management', level: 'Advance' },
];

const SKILL_FILTER_TABS = [
  'All',
  'Beginner',
  'Intermediate',
  'Advance',
] as const;
type SkillFilterTab = (typeof SKILL_FILTER_TABS)[number];

const getSkillBadgeStyles = (level: string) => {
  switch (level.toLowerCase()) {
    case 'intermediate':
      return 'bg-[#FEFCE8] text-[#B45309] border border-[#FEF08A]';
    case 'beginner':
      return 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]';
    case 'advance':
    case 'advanced':
      return 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]';
    default:
      return 'bg-bg-gray-soft-primary text-text-gray-secondary border border-border-gray-secondary';
  }
};

export default function ApplicantDetailsView({
  jobId,
  applicantId: _applicantId,
  jobData,
  applicationData,
}: ApplicantDetailsViewProps) {
  const [copied, setCopied] = useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [isAllSkillsOpen, setIsAllSkillsOpen] = useState(false);
  const [activeSkillTab, setActiveSkillTab] = useState<SkillFilterTab>('All');

  const filteredSkills =
    activeSkillTab === 'All'
      ? ALL_SKILLS_MODAL_DATA
      : ALL_SKILLS_MODAL_DATA.filter(
          (skill) => skill.level.toLowerCase() === activeSkillTab.toLowerCase(),
        );

  const applicantName = applicationData?.jobProfile?.name || 'Alifun Nahar';
  const statusLabel = applicationData?.status?.label || 'New applicant';

  const appliedDateText = applicationData?.appliedAt
    ? `Applied ${formatDate(applicationData.appliedAt)}`
    : 'Applied 15 February , 2026';

  const jobReference = jobData?.reference || 'JL - 01';
  const applicationReference = applicationData?.reference || 'XJ-487';

  const coverLetterText = applicationData?.coverLetter || DEFAULT_COVER_LETTER;

  const rawPortfolioUrl =
    applicationData?.portfolioUrl || DEFAULT_PORTFOLIO_URL;
  const cleanPortfolioUrl = rawPortfolioUrl.replace(/^https?:\/\//i, '');
  const fullPortfolioUrl = rawPortfolioUrl.startsWith('http')
    ? rawPortfolioUrl
    : `https://${rawPortfolioUrl}`;

  const cvFileName =
    applicationData?.resume?.storageInformation?.Name || 'resume_v3.pdf';
  const cvFileSize = '100KB';

  const caseStudiesList =
    applicationData?.caseStudies && applicationData.caseStudies.length > 0
      ? applicationData.caseStudies.map((item) => ({
          name: item.storageInformation.Name,
          size: '100KB',
        }))
      : DEFAULT_CASE_STUDIES;

  const workingDaysText =
    jobData?.workingDays != null ? `${jobData.workingDays} Days` : '5 Days';

  const workingHoursText = jobData?.workingHours
    ? typeof jobData.workingHours === 'object' && jobData.workingHours.startTime
      ? `${jobData.workingHours.startTime} - ${jobData.workingHours.endTime}`
      : String(jobData.workingHours)
    : '8 Hours';

  // Not scored yet, and a part the job gave nothing to compare, both show as
  // "—" rather than as 0%.
  const matchScore = applicationData?.matchScore;
  const overallScore = overallMatchPercent(applicationData);
  const { VALUES, SKILLS, ROLE, LOCATION } = APPLICATION_MATCH_PART_ENUMS;
  const valueMatchScore = partMatchPercent(applicationData, VALUES);
  const skillsScore = partMatchPercent(applicationData, SKILLS);
  const rolesScore = partMatchPercent(applicationData, ROLE);
  const locationScore = partMatchPercent(applicationData, LOCATION);

  // The values part split by value type, for the breakdown dialog and the
  // values section: every type, null where the job lists no values of it.
  // Empty until the application is ranked by a pipeline that stores the split.
  const valueCategories = (
    applicationData?.matchBreakdown?.find((part) => part.key === VALUES)
      ?.categories ?? []
  ).map((category) => ({
    type: category.type,
    name: VALUE_TYPE_LABELS[category.type] ?? category.type,
    percentage: toMatchPercent(category.score),
    values: category.values,
  }));
  // One card per type the job lists values of. A ranking older than the
  // per-value list has no `values` on any type, so nothing to show.
  const valueCards = valueCategories.filter(
    (category) => (category.values?.length ?? 0) > 0,
  );
  const valuesEmptyHint =
    overallScore == null
      ? 'Not scored yet'
      : valueCategories.some((category) => category.values)
        ? 'This job lists no values'
        : 'Values available once this application is re-scored';
  const canShowBreakdown = valueCategories.some(
    (category) => category.percentage != null,
  );
  const breakdownHint = canShowBreakdown
    ? 'See breakdown'
    : overallScore == null
      ? 'Not scored yet'
      : valueCategories.length === 0
        ? 'Breakdown available once this application is re-scored'
        : 'This job lists no values to break down';

  const alignment =
    overallScore == null || matchScore == null
      ? ALIGNMENT.unscored
      : matchScore >= MATCH_SCORE_BAND_FLOORS.strong
        ? ALIGNMENT.strong
        : matchScore >= MATCH_SCORE_BAND_FLOORS.good
          ? ALIGNMENT.good
          : ALIGNMENT.weak;

  // Semicircle arc calculation: R = 76, circumference = pi * R ≈ 238.76
  const ARC_RADIUS = 76;
  const ARC_LENGTH = Math.PI * ARC_RADIUS;
  const arcDashOffset =
    ARC_LENGTH * (1 - Math.min(Math.max(overallScore ?? 0, 0), 100) / 100);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(fullPortfolioUrl);
    setCopied(true);
    toast.success('Portfolio URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (filename: string) => {
    if (!filename || filename === 'N/A') {
      toast.error('No file available to download');
      return;
    }
    toast.info(`Downloading ${filename}...`);
  };

  return (
    <div className="w-full">
      {/* Breadcrumb Bar */}
      <div className="py-spacing-lg px-spacing-xl sm:px-spacing-4xl border-b border-border-gray-secondary overflow-x-auto whitespace-nowrap">
        <Breadcrumb className="min-h-10 flex items-center">
          <BreadcrumbList className="flex-nowrap">
            <BreadcrumbItem>
              <Link
                href="/recruiter/jobs"
                className="text-label-sm font-label-sm-strong! text-text-gray-quaternary hover:text-text-gray-primary transition-colors"
              >
                My Jobs
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-fg-gray-tertiary" />
            <BreadcrumbItem>
              <Link
                href={`/recruiter/job/${jobId}`}
                className="text-label-sm font-label-sm-strong! text-text-gray-quaternary hover:text-text-gray-primary transition-colors"
              >
                {jobReference}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-fg-gray-tertiary" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-label-sm font-label-sm-strong! py-spacing-2xs px-spacing-md rounded-md bg-bg-brand-soft-primary text-text-brand-primary">
                {applicationReference}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main Container */}
      <div className="p-spacing-xl sm:p-spacing-3xl lg:p-spacing-4xl space-y-spacing-4xl max-w-[1600px] mx-auto">
        {/* Header Profile Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-spacing-xl">
          <div className="space-y-spacing-2xs min-w-0">
            <div className="flex items-center gap-spacing-md flex-wrap">
              <h3 className="text-label-xl sm:text-display-xs font-label-xl-strong! text-text-gray-primary truncate">
                {applicantName}
              </h3>
              <span className="px-spacing-md py-spacing-3xs rounded-full text-label-xs font-label-xs-strong! text-text-gray-secondary bg-bg-gray-soft-primary border border-border-gray-secondary shrink-0">
                {statusLabel}
              </span>
            </div>

            <div className="flex items-center gap-spacing-sm text-label-sm text-text-gray-tertiary flex-wrap">
              <p className="capitalize">{appliedDateText}</p>
              <span className="w-1.5 h-1.5 bg-fg-gray-tertiary rounded-full shrink-0" />
              <p className="capitalize">{jobReference}</p>
            </div>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            {/* <Button
              type="button"
              onClick={() => toast.success('Interview invitation sent!')}
              className="w-full sm:w-auto cursor-pointer bg-bg-brand-solid-primary hover:bg-bg-brand-solid-hover text-white h-10 px-spacing-2xl rounded-lg text-label-sm font-label-sm-strong! shadow-xs transition-colors"
            >
              Invite for interview
            </Button> */}
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="flex flex-col xl:flex-row gap-spacing-4xl items-start">
          {/* Left Column: Applicant Form & Submission Details */}
          <div className="flex-1 w-full min-w-0 space-y-spacing-4xl">
            {/* Cover Letter Section */}
            <div className="space-y-spacing-xs">
              <label className="text-label-sm font-label-sm-strong! text-text-gray-secondary flex items-center gap-1">
                Cover letter <span className="text-text-error-primary">*</span>
              </label>
              <textarea
                readOnly
                value={coverLetterText}
                placeholder="N/A"
                rows={5}
                className="w-full min-h-36 p-spacing-xl rounded-xl border border-border-gray-primary bg-white text-text-gray-primary text-label-md font-label-md-base leading-relaxed focus:outline-none resize-y"
              />
            </div>

            {/* Application Package Section */}
            <div className="space-y-spacing-2xl">
              <h4 className="text-label-xl font-label-xl-strong! text-text-gray-primary">
                Application Package
              </h4>

              <div className="space-y-spacing-2xl">
                {/* Portfolio URL */}
                <div className="space-y-spacing-xs">
                  <label className="text-label-sm font-label-sm-strong! text-text-gray-secondary flex items-center gap-1">
                    Portfolio URL{' '}
                    <span className="text-text-gray-quaternary font-normal">
                      (Optional)
                    </span>
                  </label>
                  <div className="flex items-center rounded-lg border border-border-gray-primary bg-white h-10 w-full overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-bg-brand-solid-primary/20">
                    <div className="h-full px-spacing-xl flex items-center bg-bg-gray-soft-primary border-r border-border-gray-primary text-text-gray-quaternary text-label-sm font-normal select-none shrink-0">
                      http://
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={cleanPortfolioUrl}
                      className="flex-1 px-spacing-xl text-label-sm font-label-sm-strong! text-text-gray-primary focus:outline-none bg-transparent truncate"
                    />
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="px-spacing-xl text-fg-gray-tertiary hover:text-text-gray-primary transition-colors cursor-pointer shrink-0"
                      title="Copy URL"
                    >
                      {copied ? (
                        <Check size={16} className="text-text-success" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* CV */}
                <div className="space-y-spacing-xs">
                  <label className="text-label-sm font-label-sm-strong! text-text-gray-secondary flex items-center gap-1">
                    CV <span className="text-text-error-primary">*</span>
                  </label>
                  <div className="w-full p-spacing-xl rounded-2xl border border-border-gray-secondary bg-white flex items-center justify-between gap-spacing-2xl shadow-xs">
                    <div className="flex gap-spacing-lg items-center min-w-0">
                      <div className="size-10 rounded-lg bg-[#FF3B30] flex flex-col items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-xs">
                        PDF
                      </div>
                      <div className="space-y-spacing-3xs min-w-0">
                        <p className="text-label-sm font-label-sm-strong! text-text-gray-primary truncate">
                          {cvFileName}
                        </p>
                        <p className="text-label-xs text-text-gray-tertiary">
                          {cvFileSize}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownload(cvFileName)}
                      className="size-9 rounded-lg border border-border-gray-primary flex items-center justify-center text-fg-gray-secondary hover:bg-bg-gray-soft-primary transition-colors cursor-pointer shrink-0"
                      title="Download CV"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>

                {/* Case Studies */}
                <div className="space-y-spacing-xs">
                  <label className="text-label-sm font-label-sm-strong! text-text-gray-secondary flex items-center gap-1">
                    Case Studies{' '}
                    <span className="text-text-gray-quaternary font-normal">
                      (Optional)
                    </span>
                  </label>

                  <div className="space-y-spacing-md">
                    {caseStudiesList.map((file, idx) => (
                      <div
                        key={idx}
                        className="w-full p-spacing-xl rounded-2xl border border-border-gray-secondary bg-white flex items-center justify-between gap-spacing-2xl shadow-xs"
                      >
                        <div className="flex gap-spacing-lg items-center min-w-0">
                          <div className="size-10 rounded-lg bg-[#FF3B30] flex flex-col items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-xs">
                            PDF
                          </div>
                          <div className="space-y-spacing-3xs min-w-0">
                            <p className="text-label-sm font-label-sm-strong! text-text-gray-primary truncate">
                              {file.name}
                            </p>
                            <p className="text-label-xs text-text-gray-tertiary">
                              {file.size}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownload(file.name)}
                          className="size-9 rounded-lg border border-border-gray-primary flex items-center justify-center text-fg-gray-secondary hover:bg-bg-gray-soft-primary transition-colors cursor-pointer shrink-0"
                          title="Download Case Study"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Values Section */}
            <div className="space-y-spacing-2xl">
              <h4 className="text-label-xl font-label-xl-strong! text-text-gray-primary">
                Values
              </h4>

              {valueCards.length > 0 ? (
                <>
                  {/* Matching Values Legend Banner */}
                  <div className="p-spacing-lg rounded-xl border border-border-gray-secondary bg-white flex items-center flex-wrap gap-x-spacing-sm gap-y-1">
                    <span className="size-2 rounded-full bg-bg-brand-solid-primary shrink-0" />
                    <span className="text-label-sm font-label-sm-strong! text-text-gray-primary">
                      Matching Values
                    </span>
                    <span className="text-label-sm text-text-gray-tertiary">
                      Pink dots highlight the values that align with your
                      profile and responses.
                    </span>
                  </div>

                  {/* Value Category Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-xl">
                    {valueCards.map((category, idx) => {
                      const isLastOdd =
                        idx === valueCards.length - 1 &&
                        valueCards.length % 2 === 1;

                      return (
                        <div
                          key={category.type}
                          className={cn(
                            'rounded-2xl border border-border-gray-secondary bg-white p-spacing-xl sm:p-spacing-2xl space-y-spacing-xl shadow-xs',
                            isLastOdd && 'md:col-span-2',
                          )}
                        >
                          <div className="flex items-center justify-between gap-spacing-md">
                            <h5 className="text-label-md font-label-md-strong! text-text-gray-primary">
                              {category.name}
                            </h5>
                            <span className="px-spacing-md py-spacing-3xs rounded-md text-label-xs font-label-xs-strong! text-text-brand-primary bg-bg-brand-soft-primary">
                              {formatMatchPercent(category.percentage)} match
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-spacing-md">
                            {category.values?.map((v) => (
                              <span
                                key={v.value}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-border-gray-secondary bg-white px-spacing-md py-spacing-3xs text-label-sm font-label-sm-strong! text-text-gray-secondary"
                              >
                                {v.matched && (
                                  <span className="size-1.5 rounded-full bg-bg-brand-solid-primary shrink-0" />
                                )}
                                {v.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-label-sm text-text-gray-tertiary">
                  {valuesEmptyHint}
                </p>
              )}
            </div>

            {/* Skills Section */}
            <div className="space-y-spacing-2xl">
              <div className="flex items-center justify-between">
                <h4 className="text-label-xl font-label-xl-strong! text-text-gray-primary">
                  Skills
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAllSkillsOpen(true)}
                  className="text-label-sm font-label-sm-strong! text-text-brand-primary hover:underline transition-colors cursor-pointer"
                >
                  View All Skills
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-xl">
                {APPLICANT_SKILLS_DATA.map((skill) => (
                  <div
                    key={skill.id}
                    className="rounded-2xl border border-border-gray-secondary bg-white p-spacing-xl sm:p-spacing-2xl space-y-spacing-md shadow-xs"
                  >
                    <p className="text-label-md font-label-md-strong! text-text-gray-primary">
                      {skill.id}. {skill.name}
                    </p>
                    <div>
                      <span
                        className={cn(
                          'inline-flex items-center px-spacing-md py-spacing-3xs rounded-md text-label-xs font-label-xs-strong!',
                          getSkillBadgeStyles(skill.level),
                        )}
                      >
                        {skill.level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Queries Section */}
            <div className="space-y-spacing-2xl">
              <h4 className="text-label-xl font-label-xl-strong! text-text-gray-primary">
                Additional Queries
              </h4>

              {Number(applicationData?.answers?.length) > 0 ? (
                <div className="space-y-spacing-2xl">
                  {applicationData?.answers?.map((answer, idx) => (
                    <div
                      key={answer.queryId ?? idx}
                      className="space-y-spacing-xs"
                    >
                      <label className="text-label-sm font-label-sm-strong! text-text-gray-secondary flex items-center gap-1">
                        {answer.question || `Query ${idx + 1}`}
                        {answer.isRequired && (
                          <span className="text-text-error-primary">*</span>
                        )}
                      </label>
                      {answer.type === QUERY_TYPE_ENUMS.PARAGRAPH ? (
                        <textarea
                          readOnly
                          value={formatAnswer(answer.answer)}
                          placeholder="N/A"
                          className="w-full min-h-32 p-spacing-xl rounded-xl border border-border-gray-primary bg-white text-text-gray-primary placeholder:text-text-gray-quaternary text-label-md font-label-md-base focus:outline-none resize-y"
                        />
                      ) : (
                        <ShowInputValue value={formatAnswer(answer.answer)} />
                      )}
                      {answer.expectedAnswer && (
                        <p className="text-label-xs text-text-gray-tertiary">
                          Expected answer: {answer.expectedAnswer}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <textarea
                  readOnly
                  placeholder="Write your thoughts here"
                  className="w-full min-h-32 p-spacing-xl rounded-xl border border-border-gray-primary bg-white text-text-gray-primary placeholder:text-text-gray-quaternary text-label-md font-label-md-base focus:outline-none resize-y"
                />
              )}
            </div>

            {/* State Expectation Section */}
            <div className="space-y-spacing-2xl">
              <h4 className="text-label-xl font-label-xl-strong! text-text-gray-primary">
                State Expectation
              </h4>

              <div className="space-y-spacing-2xl">
                {/* Salary */}
                <div className="space-y-spacing-xs">
                  <label className="text-label-sm font-label-sm-strong! text-text-gray-secondary flex items-center gap-1">
                    Salary <span className="text-text-error-primary">*</span>
                  </label>
                  <ShowInputValue
                    value={
                      applicationData?.expectedSalary != null
                        ? String(applicationData.expectedSalary)
                        : applicationData?.currentSalary != null
                          ? String(applicationData.currentSalary)
                          : ''
                    }
                    placeholder="eg.500"
                  />
                </div>

                {/* Working Days & Working Hours */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-2xl">
                  <div className="space-y-spacing-xs">
                    <label className="text-label-sm font-label-sm-strong! text-text-gray-secondary flex items-center gap-1">
                      Working Days{' '}
                      <span className="text-text-error-primary">*</span>
                    </label>
                    <ShowInputValue
                      value={workingDaysText}
                      placeholder="e.g. 5 Days"
                    />
                  </div>

                  <div className="space-y-spacing-xs">
                    <label className="text-label-sm font-label-sm-strong! text-text-gray-secondary flex items-center gap-1">
                      Working Hours{' '}
                      <span className="text-text-error-primary">*</span>
                    </label>
                    <ShowInputValue
                      value={workingHoursText}
                      placeholder="e.g. 8 Hours"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Values and Potentials Card */}
          <div className="w-full xl:w-[380px] shrink-0 bg-white border border-border-gray-secondary rounded-2xl p-spacing-3xl space-y-spacing-3xl shadow-xs xl:sticky xl:top-6">
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
                    y="62"
                    textAnchor="middle"
                    fill="var(--colors-text-gray-tertiary, #667085)"
                    fontSize="12"
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
                    fontSize="30"
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
                  {/* aria-disabled rather than disabled: a disabled button shows
                      no tooltip in some browsers, and the tooltip says why. */}
                  <button
                    type="button"
                    onClick={() => canShowBreakdown && setIsBreakdownOpen(true)}
                    aria-disabled={!canShowBreakdown}
                    className={
                      canShowBreakdown
                        ? 'text-text-gray-quaternary hover:text-text-brand-primary transition-colors cursor-pointer'
                        : 'text-text-gray-quaternary opacity-50 cursor-not-allowed'
                    }
                    title={breakdownHint}
                  >
                    <Info size={14} />
                  </button>
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
      </div>

      {/* Values and Potentials Breakdown Dialog */}
      <Dialog open={isBreakdownOpen} onOpenChange={setIsBreakdownOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-xl sm:max-w-2xl bg-white p-spacing-xl sm:p-spacing-3xl rounded-2xl border border-border-gray-secondary shadow-lg">
          <DialogHeader className="space-y-spacing-md text-left">
            <div className="size-10 rounded-xl bg-bg-brand-soft-primary border border-border-brand-secondary flex items-center justify-center text-text-brand-primary shrink-0">
              <Info size={20} />
            </div>
            <div className="space-y-spacing-3xs">
              <DialogTitle className="text-label-xl font-label-xl-strong! text-text-gray-primary">
                Values and Potentials breakdown
              </DialogTitle>
              <DialogDescription className="text-label-sm font-label-sm-base text-text-gray-tertiary">
                How the candidate&apos;s values match the values this job lists,
                by type.
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Chart Container */}
          <div className="mt-spacing-lg p-spacing-lg sm:p-spacing-2xl rounded-2xl border border-border-gray-secondary bg-white">
            <div className="relative flex">
              {/* Vertical Y-axis label */}
              <div className="shrink-0 flex items-center justify-center pr-2">
                <span className="text-[11px] sm:text-label-xs font-label-xs-strong! text-text-gray-tertiary [writing-mode:vertical-lr] rotate-180 select-none">
                  Percentage of values match
                </span>
              </div>

              {/* Chart area with Y-axis numbers and horizontal gridlines */}
              <div className="flex-1 relative flex flex-col min-w-0">
                <div className="relative h-56 sm:h-64 flex">
                  {/* Y-axis Ticks */}
                  <div className="w-8 shrink-0 flex flex-col justify-between items-end pr-2 text-label-xs text-text-gray-quaternary select-none py-0">
                    <span>100</span>
                    <span>80</span>
                    <span>60</span>
                    <span>40</span>
                    <span>20</span>
                    <span>0</span>
                  </div>

                  {/* Gridlines and Bars Container */}
                  <div className="relative flex-1 h-full min-w-0">
                    {/* Horizontal dashed gridlines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      <div className="w-full border-b border-dashed border-border-gray-secondary" />
                      <div className="w-full border-b border-dashed border-border-gray-secondary" />
                      <div className="w-full border-b border-dashed border-border-gray-secondary" />
                      <div className="w-full border-b border-dashed border-border-gray-secondary" />
                      <div className="w-full border-b border-dashed border-border-gray-secondary" />
                      <div className="w-full border-b border-border-gray-secondary" />
                    </div>

                    {/* 5 Bars */}
                    <div className="absolute inset-0 flex items-end justify-around px-1 sm:px-4">
                      {/* A type the job lists no values of keeps its slot, with no bar. */}
                      {valueCategories.map((item) => (
                        <div
                          key={item.type}
                          className="flex flex-col items-center h-full justify-end"
                        >
                          <div
                            className="w-7 sm:w-11 bg-[#FACFE5] rounded-t-sm sm:rounded-t-md transition-all duration-500 hover:brightness-95"
                            style={{ height: `${item.percentage ?? 0}%` }}
                            title={`${item.name}: ${formatMatchPercent(item.percentage)}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* X-axis labels below the bars */}
                <div className="flex pt-3 pl-8">
                  <div className="w-full flex justify-around px-1 sm:px-4">
                    {valueCategories.map((item) => (
                      <div key={item.type} className="w-12 sm:w-16 text-center">
                        <span
                          className={`text-[10px] sm:text-label-xs font-label-xs-strong! leading-tight block ${
                            item.percentage == null
                              ? 'text-text-gray-quaternary'
                              : 'text-text-gray-secondary'
                          }`}
                          title={
                            item.percentage == null
                              ? 'This job lists no values of this type'
                              : undefined
                          }
                        >
                          {item.name}
                          {item.percentage == null && ' —'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom X-axis label */}
                <div className="text-center pt-4">
                  <span className="text-label-xs font-label-xs-strong! text-text-gray-tertiary">
                    Values Category
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View All Skills Dialog */}
      <Dialog open={isAllSkillsOpen} onOpenChange={setIsAllSkillsOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-2xl sm:max-w-3xl bg-white p-spacing-2xl sm:p-spacing-3xl rounded-3xl border border-border-gray-secondary shadow-xl max-h-[85vh] flex flex-col gap-spacing-2xl">
          <div className="space-y-spacing-2xl shrink-0">
            <DialogHeader className="text-left space-y-0">
              <DialogTitle className="text-label-xl sm:text-display-xs font-label-xl-strong! text-text-gray-primary">
                All Skills
              </DialogTitle>
              <DialogDescription className="sr-only">
                Complete list of skills and proficiencies assessed for this
                applicant.
              </DialogDescription>
            </DialogHeader>

            {/* Filter Tabs */}
            <div className="flex items-center gap-spacing-md flex-wrap">
              {SKILL_FILTER_TABS.map((tab) => {
                const isActive = activeSkillTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveSkillTab(tab)}
                    className={cn(
                      'px-spacing-xl py-spacing-xs rounded-xl text-label-sm font-label-sm-strong! transition-colors cursor-pointer border',
                      isActive
                        ? 'bg-bg-brand-solid-primary text-white border-transparent'
                        : 'bg-white text-text-gray-secondary border-border-gray-secondary hover:bg-bg-gray-soft-primary hover:text-text-gray-primary',
                    )}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Skills Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-xl">
              {filteredSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="rounded-2xl border border-border-gray-secondary bg-white p-spacing-xl sm:p-spacing-2xl space-y-spacing-md shadow-xs"
                >
                  <p className="text-label-md font-label-md-strong! text-text-gray-primary">
                    {skill.title}
                  </p>
                  <div>
                    <span
                      className={cn(
                        'inline-flex items-center px-spacing-md py-spacing-3xs rounded-md text-label-xs font-label-xs-strong!',
                        getSkillBadgeStyles(skill.level),
                      )}
                    >
                      {skill.level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Choice answers arrive as arrays; everything else as a scalar.
const formatAnswer = (value: unknown): string => {
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined || value === '') return 'N/A';
  return String(value);
};

const ShowInputValue = ({
  value,
  placeholder = 'N/A',
}: {
  value: string | number | null | undefined;
  placeholder?: string;
}) => {
  return (
    <input
      type="text"
      readOnly
      value={value != null && value !== '' ? String(value) : ''}
      placeholder={placeholder}
      className="w-full h-10 px-spacing-xl rounded-lg border border-border-gray-primary bg-white text-text-gray-primary text-label-sm font-label-sm-strong! focus:outline-none placeholder:text-text-gray-quaternary"
    />
  );
};
