'use client';
import { cn } from '@/lib/utils';
import { LayoutGrid, Plus, TextAlignJustify } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import ApplicantKanbanView from './applicant-kanban-view';
import ApplicantListsView from './applicant-lists-view';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import CreateEditStatusForm from './create-edit-status-form';
import { usePageContext } from '@/components/ai-chat/page-context';

/** Job titles have no length limit on the server; the page summary is capped at 300. */
const TITLE_CHARS = 80;

export default function Applicants({
  jobId,
  jobTitle,
}: {
  jobId: string;
  jobTitle?: string;
}) {
  const [isListView, setIsListView] = useState(false);
  const [open, setOpen] = useState(false);

  // Registered on top of the page's own context while this tab is open, so
  // "this board" and "these applicants" mean this job's pipeline. Mounted only
  // when the tab is active, which is what makes it the more specific one.
  const shortTitle = jobTitle?.slice(0, TITLE_CHARS);

  usePageContext({
    page: 'recruiter.job.applicants',
    // Kept well inside the server's 300-character cap, which rejects the whole
    // request rather than trimming: an 80-character title must still fit.
    summary:
      `The applicants board for "${shortTitle ?? 'this job'}", the recruiter's own job. ` +
      'The stages here are this job\'s own board columns, and "this job" or "this board" means this one.',
    state: {
      jobId,
      jobTitle: shortTitle ?? null,
      view: isListView ? 'list' : 'kanban',
      addStatusFormOpen: open,
    },
  });

  return (
    <>
      <div className="space-y-spacing-4xl">
        {/* header section */}
        <div className=" flex justify-between items-center">
          <p className=" text-label-xl font-label-xl-strong! text-text-gray-secondary">
            Applicants
          </p>
          <div className=" flex items-center gap-spacing-2xl">
            <Button
              onClick={() => setOpen(true)}
              className="flex gap-spacing-2xs items-center bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
            >
              <Plus /> Add Status
            </Button>
            <div className=" border border-border-gray-primary bg-bg-gray-soft-primary overflow-hidden rounded-lg h-10 flex items-center divide-x divide-border-gray-primary">
              <span
                onClick={() => setIsListView(false)}
                className={cn(
                  ' h-full min-w-[120px] px-spacing-xl flex justify-center cursor-pointer gap-spacing-xs items-center text-text-gray-primary',
                  !isListView && 'bg-bg-gray-soft-secondary',
                )}
              >
                <LayoutGrid className=" size-4" />

                <span className=" text-label-sm font-label-sm-strong! ">
                  Kanban View
                </span>
              </span>
              <span
                onClick={() => setIsListView(true)}
                className={cn(
                  'h-full min-w-[120px] px-spacing-xl flex justify-center cursor-pointer gap-spacing-xs items-center text-text-gray-primary',
                  isListView && 'bg-bg-gray-soft-secondary',
                )}
              >
                <TextAlignJustify className=" size-4" />

                <span className=" text-label-sm font-label-sm-strong! ">
                  List View
                </span>
              </span>
            </div>
          </div>
        </div>
        {/* content part  */}
        <div className="">
          {isListView ? (
            <ApplicantListsView jobId={jobId} />
          ) : (
            <ApplicantKanbanView jobId={jobId} />
          )}
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className=" bg-white min-w-[400px] max-w-[400px]">
          <SheetHeader className=" px-spacing-4xl pt-spacing-2xl pb-spacing-xs">
            <SheetTitle className=" text-label-lg! font-label-lg-strong! text-text-gray-primary">
              Add New Status
            </SheetTitle>
          </SheetHeader>
          <div className=" px-spacing-4xl overflow-y-auto max-h-[calc(100vh-100px)]">
            <CreateEditStatusForm setOpen={setOpen} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
