'use client';
import { Button } from '@/components/ui/button';

import { Plus } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import DocumentItem from './document-item';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import DocumentsSkeleton from './documents-skeleton';
import PaginationComponent from '../pagination-component';
import EmptyBox from '@/components/empty-box';
import CreateEditDocumentForm from './create-edit-documen-form';
import { Cv } from '@/services/cv/cv.type';
import { useCvs } from '@/services/cv/cv.client';

export default function Documents() {
  const [open, setOpen] = useState(false);
  const [selectedCv, setSelectedCv] = useState<Cv | null>(null);
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({
      page,
      limit: 10,
    }),
    [page],
  );

  const { cvs, isLoading, pagination } = useCvs(filters);

  const onClearSelectedCv = () => {
    setSelectedCv(null);
  };

  return (
    <>
      <div className="space-y-spacing-4xl">
        <div className=" flex justify-between items-center gap-spacing-4xl py-spacing-xl">
          <h4 className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
            Documents
          </h4>

          <Button
            type="button"
            className="cursor-pointer h-10 rounded-lg bg-bg-brand-solid-primary text-white! text-label-sm font-label-sm-strong!"
            onClick={() => setOpen(true)}
          >
            <Plus className=" size-4" />
            Create
          </Button>
        </div>
        <div className=" space-y-spacing-2xl">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <DocumentsSkeleton key={index} />
            ))
          ) : Boolean(cvs?.length) ? (
            <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-4xl">
              {cvs?.map((cv) => (
                <DocumentItem
                  key={cv._id}
                  cv={cv}
                  onEdit={() => {
                    setSelectedCv(cv);
                    setOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyBox
              title="No documents added yet"
              description="Currently, there are no documents added yet."
            >
              <Button
                disabled={isLoading}
                onClick={() => setOpen(true)}
                className=" bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
              >
                <Plus />
                <span>Create New</span>
              </Button>
            </EmptyBox>
          )}
        </div>
        {Boolean(cvs?.length) && pagination?.totalPages && (
          <PaginationComponent
            meta={pagination}
            onPageChange={(pageNum) => {
              setPage(pageNum);
            }}
          />
        )}
      </div>
      <Sheet
        open={open}
        onOpenChange={(open) => {
          if (!open) {
            onClearSelectedCv();
          }
          setOpen(open);
        }}
      >
        <SheetContent className=" bg-white min-w-[400px] max-w-[400px]">
          <SheetHeader className=" px-spacing-4xl pt-spacing-2xl pb-spacing-xs">
            <SheetTitle className=" text-label-lg! font-label-lg-strong! text-text-gray-primary">
              {selectedCv?._id ? 'Edit Documents' : 'Add New Documents'}
            </SheetTitle>
          </SheetHeader>
          <div className=" px-spacing-4xl overflow-y-auto max-h-[calc(100vh-100px)]">
            <CreateEditDocumentForm
              setOpen={setOpen}
              defaultValues={selectedCv || undefined}
              onClearSelectedCv={onClearSelectedCv}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
