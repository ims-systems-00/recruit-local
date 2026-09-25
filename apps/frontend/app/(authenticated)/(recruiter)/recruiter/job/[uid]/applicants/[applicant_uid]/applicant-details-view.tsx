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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Copy,
  Download,
  ChevronDown,
  EllipsisVertical,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { Application } from '@/services/application/application.type';
import { JobData } from '@/services/jobs/job.type';

type ApplicantDetailsViewProps = {
  jobId: string;
  applicantId: string;
  jobData?: JobData | null;
  applicationData?: Application | null;
};

export default function ApplicantDetailsView({
  jobId,
  applicantId,
  jobData,
  applicationData,
}: ApplicantDetailsViewProps) {
  const [copied, setCopied] = useState(false);

  const applicantName = applicationData?.jobProfile?.name || 'N/A';

  const statusLabel = applicationData?.status?.label || 'N/A';

  const appliedDateText = applicationData?.appliedAt
    ? `Applied ${formatDate(applicationData.appliedAt)}`
    : 'N/A';

  const jobReference = jobData?.reference || 'N/A';

  const coverLetterText = applicationData?.coverLetter || 'N/A';

  const portfolioUrlText = applicationData?.portfolioUrl;

  const cvFileName = applicationData?.resume?.storageInformation?.Name || 'N/A';

  const cvFileSize = applicationData?.resume?.storageInformation
    ? '100KB'
    : 'N/A';

  const caseStudiesList = applicationData?.caseStudyStorage?.length
    ? applicationData.caseStudyStorage.map((item) => ({
        name: item.Name,
        size: '100KB',
      }))
    : [];

  const workingDaysText =
    jobData?.workingDays != null ? String(jobData.workingDays) : 'N/A';

  const workingHoursText = jobData?.workingHours
    ? typeof jobData.workingHours === 'object' && jobData.workingHours.startTime
      ? `${jobData.workingHours.startTime} - ${jobData.workingHours.endTime}`
      : String(jobData.workingHours)
    : 'N/A';

  const handleCopyUrl = () => {
    if (!portfolioUrlText) {
      toast.error('No portfolio URL available');
      return;
    }
    const fullUrl = applicationData?.portfolioUrl || '';
    navigator.clipboard.writeText(fullUrl);
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

  console.log('applicationData', applicationData);

  return (
    <div>
      {/* Breadcrumb Bar */}
      <div className="py-spacing-lg px-spacing-4xl border-b border-border-gray-secondary">
        <Breadcrumb className="min-h-10 flex items-center">
          <BreadcrumbList>
            <BreadcrumbItem>
              <Link
                href="/recruiter/jobs"
                className="text-label-sm font-label-sm-strong! text-text-gray-quaternary hover:text-text-gray-primary"
              >
                Job Listing
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-fg-gray-tertiary" />
            <BreadcrumbItem>
              <Link
                href={`/recruiter/job/${applicationData?.jobId}`}
                className="text-label-sm font-label-sm-strong! text-text-gray-quaternary hover:text-text-gray-primary"
              >
                {jobReference}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-fg-gray-tertiary" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-label-sm font-label-sm-strong! py-spacing-2xs px-spacing-md rounded-md bg-bg-brand-soft-primary text-text-brand-primary">
                {applicationData?.reference || 'N/A'}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main Content */}
      <div className="p-spacing-4xl space-y-spacing-4xl">
        {/* Header Profile Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-spacing-2xs">
            <div className="flex items-center gap-spacing-md flex-wrap">
              <h3 className="text-label-xl font-label-xl-strong! text-text-gray-primary">
                {applicantName}
              </h3>
              <span className="px-spacing-md py-spacing-3xs rounded-full text-label-xs font-label-xs-strong! text-text-gray-secondary bg-bg-gray-soft-primary border border-border-gray-secondary">
                {statusLabel}
              </span>
            </div>
            <div className=" flex items-center gap-spacing-sm">
              <p className="capitalize text-label-sm text-text-gray-tertiary">
                {appliedDateText}
              </p>

              <div className=" w-1.5 h-1.5 bg-fg-gray-tertiary rounded-full"></div>

              <p className="capitalize text-label-sm text-text-gray-tertiary">
                {jobReference}
              </p>
            </div>
          </div>

          {/* <div className="flex items-center gap-spacing-md shrink-0">
            <Button
              type="button"
              onClick={() => toast.success('Interview invitation sent!')}
              className="cursor-pointer bg-[#E6007A] hover:bg-[#D0006E] text-white h-10 px-spacing-2xl rounded-lg text-label-sm font-label-sm-strong! shadow-xs transition-colors"
            >
              Invite for interview
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="size-10 rounded-lg border border-border-gray-primary bg-white flex items-center justify-center text-fg-gray-secondary hover:bg-bg-gray-soft-primary transition-colors cursor-pointer"
                >
                  <EllipsisVertical size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-white">
                <DropdownMenuItem
                  className="text-label-sm font-label-sm-strong! text-text-gray-secondary cursor-pointer"
                  onClick={() => toast.info('Viewing applicant profile')}
                >
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div> */}
        </div>

        {/* Cover Letter Section */}
        <div className="space-y-spacing-xs">
          <label className="text-label-sm font-label-sm-strong! text-text-gray-secondary flex items-center gap-1">
            Cover letter <span className="text-text-error-primary">*</span>
          </label>
          <textarea
            readOnly
            value={coverLetterText}
            placeholder="N/A"
            className="w-full min-h-32 p-spacing-xl rounded-xl border border-border-gray-primary bg-white text-text-gray-primary text-label-md font-label-md-base leading-relaxed focus:outline-none resize-y"
          />
        </div>

        {/* Application Package Section */}
        <div className="space-y-spacing-2xl">
          <h4 className="text-label-xl font-label-xl-strong! text-text-gray-primary">
            Application Package
          </h4>

          <div className="space-y-spacing-2xl">
            {/* Portfolio URL */}
            {portfolioUrlText && (
              <div className="space-y-spacing-xs">
                <label className="text-label-sm font-label-sm-strong! text-text-gray-secondary flex items-center gap-1">
                  Portfolio URL{' '}
                  <span className="text-text-gray-quaternary font-normal">
                    (Optional)
                  </span>
                </label>
                <div className="flex items-center rounded-lg border border-border-gray-primary bg-white h-10 w-full overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-bg-brand-solid-primary/20">
                  <input
                    type="text"
                    readOnly
                    value={portfolioUrlText}
                    className="flex-1 px-spacing-xl text-label-sm font-label-sm-strong! text-text-gray-primary focus:outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-spacing-xl text-fg-gray-tertiary hover:text-text-gray-primary transition-colors cursor-pointer"
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
            )}

            {/* CV */}
            <div className="space-y-spacing-xs">
              <label className="text-label-sm font-label-sm-strong! text-text-gray-secondary flex items-center gap-1">
                CV <span className="text-text-error-primary">*</span>
              </label>
              {applicationData?.resume?.storageInformation?.Name ? (
                <div className="w-full p-spacing-xl rounded-2xl border border-border-gray-secondary bg-white flex items-center justify-between gap-spacing-2xl">
                  <div className="flex gap-spacing-lg items-center">
                    <div className="size-10 rounded-lg bg-[#FF3B30] flex flex-col items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-xs">
                      PDF
                    </div>
                    <div className="space-y-spacing-3xs">
                      <p className="text-label-sm font-label-sm-strong! text-text-gray-primary">
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
                    className="size-9 rounded-lg border border-border-gray-primary flex items-center justify-center text-fg-gray-secondary hover:bg-bg-gray-soft-primary transition-colors cursor-pointer"
                    title="Download CV"
                  >
                    <Download size={16} />
                  </button>
                </div>
              ) : (
                <div className="w-full h-10 px-spacing-xl rounded-lg border border-border-gray-primary bg-white flex items-center text-text-gray-primary text-label-sm font-label-sm-strong!">
                  N/A
                </div>
              )}
            </div>

            {/* Case Studies */}
            {caseStudiesList.length > 0 && (
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
                      className="w-full p-spacing-xl rounded-2xl border border-border-gray-secondary bg-white flex items-center justify-between gap-spacing-2xl"
                    >
                      <div className="flex gap-spacing-lg items-center">
                        <div className="size-10 rounded-lg bg-[#FF3B30] flex flex-col items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-xs">
                          PDF
                        </div>
                        <div className="space-y-spacing-3xs">
                          <p className="text-label-sm font-label-sm-strong! text-text-gray-primary">
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
                        className="size-9 rounded-lg border border-border-gray-primary flex items-center justify-center text-fg-gray-secondary hover:bg-bg-gray-soft-primary transition-colors cursor-pointer"
                        title="Download Case Study"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Queries Section */}
        {Number(applicationData?.answers?.length) > 0 && (
          <div className="space-y-spacing-2xl">
            <h4 className="text-label-xl font-label-xl-strong! text-text-gray-primary">
              Additional Queries
            </h4>

            <div className="space-y-spacing-2xl">
              {applicationData?.answers?.map((answer, idx) => (
                <div className="space-y-spacing-xs">
                  <label className="text-label-sm font-label-sm-strong! text-text-gray-secondary flex items-center gap-1">
                    Queries Label{' '}
                    <span className="text-text-error-primary">*</span>
                  </label>
                  <textarea
                    readOnly
                    value={`${answer?.answer || 'N/A'}`}
                    placeholder="N/A"
                    className="w-full min-h-32 p-spacing-xl rounded-xl border border-border-gray-primary bg-white text-text-gray-primary placeholder:text-text-gray-quaternary text-label-md font-label-md-base focus:outline-none resize-y"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* State Expectation Section */}
        <div className="space-y-spacing-2xl">
          <h4 className="text-label-xl font-label-xl-strong! text-text-gray-primary">
            State Expectation
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-2xl">
            <div className="space-y-spacing-xs">
              <label className="text-label-sm font-label-sm-strong! text-text-gray-secondary flex items-center gap-1">
                Current Salary{' '}
                <span className="text-text-error-primary">*</span>
              </label>

              <ShowInputValue value={applicationData?.currentSalary} />
            </div>
            <div className="space-y-spacing-xs">
              <label className="text-label-sm font-label-sm-strong! text-text-gray-secondary flex items-center gap-1">
                Expected Salary{' '}
                <span className="text-text-error-primary">*</span>
              </label>
              <ShowInputValue value={applicationData?.expectedSalary} />
            </div>
            {/* <div className="space-y-spacing-xs">
              <label className="text-label-sm font-label-sm-strong! text-text-gray-secondary flex items-center gap-1">
                Working Days <span className="text-text-error-primary">*</span>
              </label>

              <ShowInputValue value={workingDaysText} />
            </div>

            <div className="space-y-spacing-xs">
              <label className="text-label-sm font-label-sm-strong! text-text-gray-secondary flex items-center gap-1">
                Working Hours <span className="text-text-error-primary">*</span>
              </label>

              <ShowInputValue value={workingHoursText} />
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}

const ShowInputValue = ({
  value,
}: {
  value: string | number | null | undefined;
}) => {
  return (
    <input
      type="text"
      readOnly
      value={`${value || 'N/A'}`}
      placeholder="N/A"
      className="w-full h-10 px-spacing-xl rounded-lg border border-border-gray-primary bg-white text-text-gray-primary text-label-sm font-label-sm-strong! focus:outline-none"
    />
  );
};
