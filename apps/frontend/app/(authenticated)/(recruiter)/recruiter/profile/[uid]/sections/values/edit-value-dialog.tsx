'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useForm, type Resolver } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import {
  MAX_VALUES_STEP_SELECTION,
  ValuesStepFormValues,
  valuesStepSchema,
} from '@/services/tenants/tenants.validation';
import { yupResolver } from '@hookform/resolvers/yup';
import { VALUE_TYPE_ENUM } from '@rl/types';
import { ValueData } from '@/services/value';
import { tenantKeys, useUpdateTenant } from '@/services/tenants/tenants.client';
import { useDebounce } from '@/hooks/useDebounce';
import { useCallback, useMemo } from 'react';
import { useInfiniteValues } from '@/services/value/value.client';
import { Button } from '@/components/ui/button';
import ValuesSkeleton from './values-skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { TenantData } from '@/services/tenants/tenants.type';

const PAGE_LIMIT = 10;

const SCROLL_THRESHOLD = 80;

const getStepValues = (values: ValueData[], types: VALUE_TYPE_ENUM[]) => {
  return values.filter((item) => types.includes(item.type));
};

interface EditValueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  placeholder: string;
  tenantId: string;
  tenantName: string;
  existingValues: ValueData[];
  types: VALUE_TYPE_ENUM[];
  onSuccess: (values: ValueData[]) => void;
}

export default function EditValueDialog({
  open,
  onOpenChange,
  title,
  placeholder,
  tenantId,
  tenantName,
  existingValues,
  types,
  onSuccess,
}: EditValueDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<ValuesStepFormValues>({
    resolver: yupResolver(valuesStepSchema) as Resolver<ValuesStepFormValues>,
    defaultValues: {
      tenantName: tenantName,
      onboardingStep: undefined,
      values: getStepValues(existingValues, types).map((item) => item._id),
    },
  });

  const {
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = form;

  const selectedValues = watch('values');

  const { updateTenant, isPending: isUpdating } = useUpdateTenant();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 500);

  const listFilters = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      type: { in: types },
      search: debouncedSearch || undefined,
    }),
    [page, debouncedSearch],
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteValues(listFilters);

  const values = data?.pages.flatMap((page) => page.values) ?? [];

  const isMaxSelected = selectedValues.length >= MAX_VALUES_STEP_SELECTION;

  const handleToggle = (valueId: string, checked: boolean) => {
    if (checked && isMaxSelected) return;

    const updatedValues = checked
      ? [...selectedValues, valueId]
      : selectedValues.filter((id: string) => id !== valueId);

    setValue('values', updatedValues, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit = async (data: ValuesStepFormValues) => {
    const selectedValueObjects = values.filter((item) =>
      data.values.includes(item._id),
    );

    const otherValues = existingValues.filter(
      (item) => !types.includes(item.type),
    );

    const updatedValues = [...otherValues, ...selectedValueObjects];

    await updateTenant({
      id: tenantId,
      data: {
        name: data.tenantName,
        values: updatedValues.map((item) => item._id),
      },
      onSuccessNext: () => {
        onSuccess(updatedValues);

        onOpenChange(false);
      },
    });
  };

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;

      const distanceFromBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight;

      if (
        distanceFromBottom < SCROLL_THRESHOLD &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  const isInitialLoading = isLoading;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[692px] bg-bg-gray-soft-primary shadow-xs gap-y-spacing-4xl">
        <DialogTitle asChild>
          <div className="space-y-spacing-lg">
            <h4 className="text-label-lg font-label-lg-strong! text-text-gray-secondary">
              {title}
            </h4>

            <InputGroup className="h-12 rounded-lg border-border-gray-primary shadow-xs">
              <InputGroupInput
                type="text"
                placeholder={placeholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <InputGroupAddon>
                <Search className="text-fg-gray-tertiary" />
              </InputGroupAddon>
            </InputGroup>

            <div className="flex items-center gap-spacing-2xl">
              <span className="text-label-sm font-label-sm-strong! text-text-gray-secondary">
                Top 3 Most Important tags
              </span>

              <span className="inline-flex min-h-6 cursor-pointer items-center justify-center rounded-lg border border-border-gray-primary bg-bg-gray-soft-primary px-spacing-md py-spacing-3xs text-label-sm font-label-sm-strong! text-others-gray-dark">
                Growth-oriented
              </span>

              <span className="inline-flex min-h-6 cursor-pointer items-center justify-center rounded-lg border border-border-gray-primary bg-bg-gray-soft-primary px-spacing-md py-spacing-3xs text-label-sm font-label-sm-strong! text-others-gray-dark">
                Entrepreneurial
              </span>

              <span className="inline-flex min-h-6 cursor-pointer items-center justify-center rounded-lg border border-border-gray-primary bg-bg-gray-soft-primary px-spacing-md py-spacing-3xs text-label-sm font-label-sm-strong! text-others-gray-dark">
                Proactive
              </span>
            </div>
          </div>
        </DialogTitle>
        <div className=" space-y-spacing-lg">
          <div className=" flex items-center justify-between gap-spacing-lg">
            <p className=" text-label-sm font-label-sm-strong! text-text-gray-quaternary">
              Select your top mindsets (Maximum {MAX_VALUES_STEP_SELECTION})
            </p>
            <span className=" text-label-sm text-text-gray-quaternary">
              {selectedValues.length}/{MAX_VALUES_STEP_SELECTION} selected
            </span>
          </div>
          {errors.values?.message && (
            <p className=" text-label-sm text-text-error-primary">
              {errors.values.message}
            </p>
          )}
          <div
            onScroll={handleScroll}
            className=" max-h-[400px] overflow-y-auto space-y-spacing-lg"
          >
            {isInitialLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <ValuesSkeleton key={index} />
              ))
            ) : values.length > 0 ? (
              <>
                {values.map((item) => {
                  const isSelected = selectedValues.includes(item._id);
                  const isDisabled = isMaxSelected && !isSelected;

                  return (
                    <div
                      key={item._id}
                      className={cn(
                        ' flex items-center gap-spacing-lg p-spacing-2xl rounded-2xl border border-border-gray-secondary min-h-14',
                        isDisabled && 'opacity-50 cursor-not-allowed',
                      )}
                    >
                      <Checkbox
                        id={item._id}
                        name={item._id}
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={(checked) =>
                          handleToggle(item._id, checked === true)
                        }
                      />
                      <Label
                        htmlFor={item._id}
                        className={cn(
                          ' text-label-md font-label-md-strong! text-text-gray-secondary',
                          isDisabled && 'cursor-not-allowed',
                        )}
                      >
                        {item.label}
                      </Label>
                    </div>
                  );
                })}
                {isFetchingNextPage && (
                  <div className=" space-y-spacing-lg">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <ValuesSkeleton key={`loading-${index}`} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className=" flex items-center justify-center p-spacing-5xl border border-border-gray-secondary rounded-lg">
                <p className=" text-label-md font-label-md-strong! text-text-gray-quaternary">
                  {isError ? 'Failed to load values' : 'No values found'}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className=" flex justify-end items-center gap-spacing-2xl">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="text-label-md font-label-md-strong! cursor-pointer border-border-gray-primary h-10 rounded-lg text-text-gray-secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isUpdating}
            className="bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-10 rounded-lg"
          >
            {isUpdating ? 'Saving...' : 'Confirm'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
