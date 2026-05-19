'use client';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Ellipsis, Plus, Search } from 'lucide-react';
import { FormCard } from './components/form-card';

interface Form {
  id: string;
  name: string;
  updated: string;
}

const forms: Form[] = [
  { id: 'FRM-112', name: 'Initial Visit Form', updated: '14 Jan, 2026' },
  { id: 'FRM-221', name: 'Planning Form', updated: '14 Jan, 2026' },
  { id: 'FRM-087', name: 'Membership Form', updated: '16 Jan, 2026' },
  { id: 'FRM-310', name: 'Test NC/OFI', updated: '03 Mar, 2026' },
  { id: 'FRM-404', name: 'Form 1', updated: '09 Mar, 2026' },
  { id: 'FRM-512', name: 'Copy', updated: '09 Mar, 2026' },
  { id: 'FRM-600', name: 'Form 2', updated: '10 Mar, 2026' },
  { id: 'FRM-711', name: 'Form 3', updated: '11 Mar, 2026' },
  { id: 'FRM-808', name: 'Form 4', updated: '12 Mar, 2026' },
  { id: 'FRM-909', name: 'Form 5', updated: '13 Mar, 2026' },
  { id: 'FRM-101', name: 'Form 6', updated: '14 Mar, 2026' },
  { id: 'FRM-112', name: 'Form 7', updated: '15 Mar, 2026' },
  { id: 'FRM-123', name: 'Form 8', updated: '16 Mar, 2026' },
  { id: 'FRM-134', name: 'Form 9', updated: '17 Mar, 2026' },
  { id: 'FRM-145', name: 'Form 10', updated: '18 Mar, 2026' },
  { id: 'FRM-156', name: 'Form 11', updated: '19 Mar, 2026' },
  { id: 'FRM-167', name: 'Form 12', updated: '20 Mar, 2026' },
  { id: 'FRM-178', name: 'Form 13', updated: '21 Mar, 2026' },
  { id: 'FRM-189', name: 'Form 14', updated: '22 Mar, 2026' },
  { id: 'FRM-190', name: 'Form 15', updated: '23 Mar, 2026' },
  { id: 'FRM-201', name: 'Form 16', updated: '24 Mar, 2026' },
];

const ITEMS_PER_PAGE = 7;

export default function RecruiterFormsPage() {
  const currentPage = 1;
  const totalPages = Math.ceil(forms.length / ITEMS_PER_PAGE);

  // Get current page items
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentForms = forms.slice(startIndex, endIndex);

  const handleFormClick = (formId: string) => {
    console.log('Clicked form:', formId);
    // TODO: Navigate to form details or edit page
  };

  const handleActionsClick = (formId: string) => {
    console.log('Actions for form:', formId);
    // TODO: Open actions menu (edit, delete, duplicate, etc.)
  };
  return (
    <div className="flex flex-col gap-spacing-4xl">
      <div className="border-b border-border-gray-secondary">
        <header className="p-spacing-4xl flex flex-wrap items-center justify-between gap-spacing-2xl">
          <div className="space-y-spacing-2xs">
            <h3 className="text-text-gray-primary text-heading-sm font-heading-sm-strong!">
              Forms
            </h3>
            <p className="text-text-gray-tertiary text-label-md">
              Manage and reuse recruiter forms across workflows
            </p>
          </div>
          <div className="flex items-center gap-spacing-lg">
            <div className="min-w-[280px]">
              <InputGroup className="max-w-[320px] h-10">
                <InputGroupInput placeholder="Search forms..." />
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
              </InputGroup>
            </div>
            <Button className="h-10">
              <Plus />
              Create Form
            </Button>
          </div>
        </header>
      </div>

      <div className="px-spacing-4xl">
        <div className="grid grid-cols-1 gap-spacing-4xl sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          <button
            type="button"
            className="group flex min-h-60 flex-col items-center justify-center gap-spacing-3xl rounded-2xl border border-border-gray-secondary bg-white p-spacing-4xl text-left shadow-xs transition hover:border-border-brand-primary"
          >
            <span className="flex size-14 items-center justify-center rounded-full border border-border-gray-secondary bg-bg-gray-soft-primary">
              <Plus className="size-6 text-text-gray-secondary" />
            </span>
            <div className="space-y-spacing-2xs">
              <p className="text-label-lg font-label-lg-strong! text-text-gray-primary">
                Create from Scratch
              </p>
              <p className="text-label-sm text-text-gray-tertiary">
                Build a brand-new template for recurring use
              </p>
            </div>
          </button>

          {currentForms.map((form) => (
            <div
              key={form.id}
              onClick={() => handleFormClick(form.id)}
              className="cursor-pointer transition hover:shadow-md"
            >
              <FormCard
                id={form.id}
                name={form.name}
                updated={form.updated}
                onClick={() => handleFormClick(form.id)}
                onActionsClick={() => handleActionsClick(form.id)}
              />
            </div>
          ))}
        </div>

        <div className="mt-spacing-6xl flex justify-end">
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  className={
                    currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                  }
                  onClick={(e) => {
                    if (currentPage === 1) e.preventDefault();
                    // TODO: Implement page navigation
                  }}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === page}
                      onClick={(e) => {
                        e.preventDefault();
                        // TODO: Navigate to page {page}
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  className={
                    currentPage === totalPages
                      ? 'pointer-events-none opacity-50'
                      : ''
                  }
                  onClick={(e) => {
                    if (currentPage === totalPages) e.preventDefault();
                    // TODO: Implement page navigation
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
