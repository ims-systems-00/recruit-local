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
import { ONBOARDING_STEP_ENUMS } from '@rl/types';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import MultiCheckboxSkeleton from './multi-checkbox-skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Resolver, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { MAX_INDUSTRIES_STEP_SELECTION } from '@/services/industry/industry.validation';
import { useInfiniteIndustries } from '@/services/industry/industry.client';
import { updateJobProfileSchema } from '@/services/job-profile/job-profile.validation';
import { JobProfileUpdateInput } from '@/services/job-profile/job-profile.type';
import { jobProfileKeys, useUpdateJobProfile } from '@/services/job-profile';

const PAGE_LIMIT = 10;
const SCROLL_THRESHOLD = 80;

export default function IndustrySection({
  jobProfileId,
  existingIndustries,
}: {
  jobProfileId: string;
  existingIndustries: string[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { updateJobProfile, isPending: isUpdating } = useUpdateJobProfile();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<JobProfileUpdateInput>({
    resolver: yupResolver(
      updateJobProfileSchema,
    ) as Resolver<JobProfileUpdateInput>,
    defaultValues: {
      industry: existingIndustries,
    },
  });

  const selectedIndustries = watch('industry');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 500);

  const listFilters = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
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
  } = useInfiniteIndustries(listFilters);

  const industries = data?.pages.flatMap((page) => page.industries) ?? [];

  const isMaxSelected =
    selectedIndustries?.length &&
    selectedIndustries?.length >= MAX_INDUSTRIES_STEP_SELECTION;

  const handleToggle = (industryId: string, checked: boolean) => {
    const current = selectedIndustries || [];

    if (checked) {
      if (
        current.length >= MAX_INDUSTRIES_STEP_SELECTION &&
        !current.includes(industryId)
      ) {
        return;
      }

      setValue('industry', [...current, industryId], {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else {
      setValue(
        'industry',
        current.filter((id) => id !== industryId),
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
    }
  };

  const onSubmit = async (data: JobProfileUpdateInput) => {
    const payload = {
      industry: data.industry,
      onboardingStep: ONBOARDING_STEP_ENUMS.INDUSTRY,
    };

    await updateJobProfile({
      id: jobProfileId,
      payload: payload,
      onSuccessCallback: () => {
        queryClient.invalidateQueries({
          queryKey: jobProfileKeys.detail(jobProfileId),
        });
        router.push(
          `/candidate/onboarding/personalisation?step=${ONBOARDING_STEP_ENUMS.EXPERIENCE_LEVEL}`,
        );
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
          <Progress value={20} className="w-full h-2.5" />
          <span className=" text-label-xs font-label-xs-strong! text-text-gray-secondary">
            {20}%
          </span>
        </div>
        <div className=" space-y-spacing-lg">
          <h4 className=" text-label-xl font-label-xl-strong! text-text-gray-secondary">
            What industry would you like to work in?
          </h4>
          <p className=" text-label-sm font-label-sm-strong! text-text-gray-quaternary">
            Select up to 3
          </p>
          <InputGroup className="  h-12 rounded-lg shadow-xs border-border-gray-primary">
            <InputGroupInput
              type="text"
              placeholder="Search industry..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
            <InputGroupAddon>
              <Search className=" text-fg-gray-tertiary" />
            </InputGroupAddon>
          </InputGroup>
        </div>
        <div className=" space-y-spacing-lg">
          <div
            onScroll={handleScroll}
            className=" max-h-[500px] overflow-y-auto space-y-spacing-lg"
          >
            {isInitialLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <MultiCheckboxSkeleton key={index} />
              ))
            ) : industries.length > 0 ? (
              <>
                {industries.map((item) => {
                  const isSelected = selectedIndustries?.includes(item._id);
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
                        disabled={isDisabled || false}
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
                        {item.name}
                      </Label>
                    </div>
                  );
                })}
                {isFetchingNextPage && (
                  <div className=" space-y-spacing-lg">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <MultiCheckboxSkeleton key={`loading-${index}`} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className=" flex items-center justify-center p-spacing-5xl border border-border-gray-secondary rounded-lg">
                <p className=" text-label-md font-label-md-strong! text-text-gray-quaternary">
                  {isError
                    ? 'Failed to load industries'
                    : 'No industries found'}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className=" flex justify-between items-center">
          <Button
            disabled={isUpdating}
            onClick={() =>
              router.push(
                `/candidate/onboarding/personalisation?step=${ONBOARDING_STEP_ENUMS.JOB_TITLE}`,
              )
            }
            variant="outline"
            className="text-label-md font-label-md-strong! cursor-pointer border-border-gray-primary h-12 rounded-lg text-text-gray-secondary"
          >
            Back
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isUpdating}
            className="bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-12 rounded-lg"
          >
            {isUpdating ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
