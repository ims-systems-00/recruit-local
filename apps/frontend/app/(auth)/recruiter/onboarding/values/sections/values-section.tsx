'use client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Search } from 'lucide-react';
import { ONBOARDING_STEP_ENUMS, VALUE_TYPE_ENUM } from '@rl/types';
import { getOnboardingValuesRoute } from '../helpers/onboarding-route';
import { useRouter } from 'next/navigation';
import {
  useGetTopThreeValues,
  useInfiniteValues,
  useValues,
} from '@/services/value/value.client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import ValuesSkeleton from './values-skeleton';
import { useUpdateTenant, tenantKeys } from '@/services/tenants/tenants.client';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { ValueData } from '@/services/value/value.type';
import { Resolver, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  MAX_VALUES_STEP_SELECTION,
  ValuesStepFormValues,
  valuesStepSchema,
} from '@/services/tenants/tenants.validation';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_LIMIT = 10;
const SCROLL_THRESHOLD = 80;

const getStepValues = (values: ValueData[], types: VALUE_TYPE_ENUM[]) => {
  return values.filter((item) => types.includes(item.type));
};

export default function ValuesSection({
  existingValues,
  tenantId,
  tenantName,
  types,
  onboardingStep,
  progressValue,
  title,
  onSuccessNext,
  onSuccessBack,
  isBackDisabled = false,
  isNextDisabled = false,
}: {
  existingValues: ValueData[];
  tenantId: string;
  tenantName: string;
  types: VALUE_TYPE_ENUM[];
  onboardingStep: ONBOARDING_STEP_ENUMS;
  progressValue: number;
  title: string;
  onSuccessNext?: () => void;
  onSuccessBack?: () => void;
  isBackDisabled?: boolean;
  isNextDisabled?: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  console.log('existingValues', existingValues);

  const form = useForm<ValuesStepFormValues>({
    resolver: yupResolver(valuesStepSchema) as Resolver<ValuesStepFormValues>,
    defaultValues: {
      tenantName: tenantName,
      onboardingStep: onboardingStep,
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
      clientSearch: debouncedSearch || undefined,
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

  const { values: topThreeValues, isLoading: isTopThreeLoading } =
    useGetTopThreeValues(types[0]);

  const values = data?.pages.flatMap((page) => page.values) ?? [];

  const [savedValues, setSavedValues] = useState<ValueData[]>([]);

  useEffect(() => {
    setSavedValues(getStepValues(existingValues, types));
  }, [existingValues]);

  const isMaxSelected = selectedValues.length >= MAX_VALUES_STEP_SELECTION;

  const handleToggle = (value: ValueData, checked: boolean) => {
    if (checked && isMaxSelected) return;

    const updatedValues = checked
      ? [...selectedValues, value._id]
      : selectedValues.filter((id: string) => id !== value._id);

    setValue('values', updatedValues, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (checked) {
      setSavedValues((prev) => {
        if (prev.some((item) => item._id === value._id)) {
          return prev;
        }

        return [...prev, value];
      });
    } else {
      setSavedValues((prev) => prev.filter((item) => item._id !== value._id));
    }
  };

  const onSubmit = async (data: ValuesStepFormValues) => {
    const otherStepValueIds = existingValues
      .filter((item) => !types.includes(item.type))
      .map((item) => item._id);

    await updateTenant({
      id: tenantId,
      data: {
        name: data.tenantName,
        values: [...otherStepValueIds, ...data.values],
        onboardingStep: data.onboardingStep,
      },
      onSuccessNext: () => {
        queryClient.invalidateQueries({
          queryKey: tenantKeys.detail(tenantId),
        });

        onSuccessNext?.();
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
    <div className=" flex justify-center items-center">
      <div className=" w-[692px] bg-bg-gray-soft-primary rounded-lg flex flex-col gap-y-spacing-4xl p-spacing-5xl">
        <div className=" flex items-center justify-between gap-spacing-lg">
          <Progress value={progressValue} className="w-full h-2.5" />
          <span className=" text-label-xs font-label-xs-strong! text-text-gray-secondary">
            {progressValue}%
          </span>
        </div>
        <div className=" space-y-spacing-lg">
          <h4 className=" text-label-xl font-label-xl-strong! text-text-gray-secondary">
            {title}
          </h4>
          <InputGroup className="  h-12 rounded-lg shadow-xs border-border-gray-primary">
            <InputGroupInput
              type="text"
              placeholder="Search your mindset..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
            <InputGroupAddon>
              <Search className=" text-fg-gray-tertiary" />
            </InputGroupAddon>
          </InputGroup>
          <div className=" flex items-center gap-spacing-2xl">
            <span>Top 3 Most Important tags </span>
            {isTopThreeLoading ? (
              <div className=" flex items-center gap-spacing-2xl">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton
                    key={`loading-${index}`}
                    className="h-4 w-20 bg-gray-200"
                  />
                ))}
              </div>
            ) : (
              topThreeValues.map((item) => (
                <span
                  key={item._id}
                  className=" cursor-pointer whitespace-nowrap inline-flex items-center justify-center min-h-6 py-spacing-3xs px-spacing-md rounded-lg bg-bg-gray-soft-primary text-label-sm font-label-sm-strong! text-others-gray-dark border border-border-gray-primary"
                >
                  {item.label}
                </span>
              ))
            )}
          </div>
        </div>
        <div className=" space-y-spacing-lg">
          <div className=" flex items-center gap-spacing-2xl">
            <span className=" whitespace-nowrap text-body-sm text-text-gray-secondary">
              Selected:{' '}
            </span>
            <div className=" flex items-center gap-spacing-2xs flex-wrap">
              {savedValues?.map((item) => (
                <span
                  key={item._id}
                  className=" cursor-pointer whitespace-nowrap inline-flex items-center justify-center min-h-6 py-spacing-3xs px-spacing-md rounded-lg bg-bg-gray-soft-primary text-body-xs text-others-gray-dark border border-border-gray-primary"
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>
          {errors.values?.message && (
            <p className=" text-label-sm text-text-error-primary">
              {errors.values.message}
            </p>
          )}
          <div
            onScroll={handleScroll}
            className=" max-h-[500px] overflow-y-auto space-y-spacing-lg"
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
                          handleToggle(item as ValueData, checked === true)
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
        <div className=" flex justify-between items-center">
          <Button
            disabled={isBackDisabled}
            onClick={() => onSuccessBack?.()}
            variant="outline"
            className="text-label-md font-label-md-strong! cursor-pointer border-border-gray-primary h-12 rounded-lg text-text-gray-secondary"
          >
            Back
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isUpdating || isNextDisabled}
            className="bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-12 rounded-lg"
          >
            {isUpdating ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
